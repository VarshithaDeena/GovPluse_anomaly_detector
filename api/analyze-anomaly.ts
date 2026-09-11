import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

let quotaCooldownUntil = 0;

function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentPoint, windowPoints, rollingMean, rollingStd, zScore, metric, threshold } = req.body || {};

    const val = Number(currentPoint?.value ?? metric ?? 350);
    const z = Number(zScore ?? 4.0);
    const mean = Number(rollingMean || 70);
    const timeStr = currentPoint?.timestamp || new Date().toISOString();

    const getHeuristicTriage = () => {
      let classification = 'genuine_surge';
      let severity = 'medium';
      let summary = `Portal traffic escalated to ${val.toFixed(0)} requests/interval (${z.toFixed(1)}σ deviation above the ${mean.toFixed(0)} req/interval baseline).`;
      let recommended_action = 'Inspect ELB connection counts and monitor backend target group CPU utilization.';

      if (z > 10 || val > 350) {
        severity = 'critical';
        classification = 'genuine_surge';
        summary = `Severe traffic surge detected at ${val.toFixed(0)} requests/interval (+${z.toFixed(1)}σ deviation). Sudden ~5x surge over normal baseline (~70 req/interval).`;
        recommended_action = 'Trigger emergency autoscaling for application tier and enable AWS Shield / CloudFront rate limiting.';
      } else if (z > 5 || val > 200) {
        severity = 'high';
        classification = 'genuine_surge';
        summary = `Substantial request surge of ${val.toFixed(0)} requests/interval (+${z.toFixed(1)}σ) observed across ELB targets.`;
        recommended_action = 'Scale out portal worker instances and review upstream database connection pools.';
      }

      return { classification, severity, summary, recommended_action };
    };

    if (Date.now() < quotaCooldownUntil || !process.env.GEMINI_API_KEY) {
      const fallbackAnalysis = getHeuristicTriage();
      return res.status(200).json({
        success: true,
        analysis: fallbackAnalysis,
        isFallback: true,
      });
    }

    const prompt = `Analyze this AWS ELB traffic anomaly on a US government public portal:
- Metric: AWS ELB Request Count (requests per 5-minute interval)
- Current Event: ${timeStr} -> ${val.toFixed(1)} req/interval
- 30-pt Rolling Mean: ${mean.toFixed(1)}, Std Dev: ${Number(rollingStd || 10).toFixed(1)}
- Calculated Z-Score: ${z.toFixed(2)}σ (Threshold: > ${threshold || 2.5})

Return JSON with:
"classification": "genuine_surge" | "bot_attack" | "system_fault",
"severity": "low" | "medium" | "high" | "critical",
"summary": 1-2 sentence concise diagnostic explanation,
"recommended_action": 1 tactical remediation step for portal engineers.`;

    try {
      const ai = getGeminiClient();
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                classification: {
                  type: Type.STRING,
                  enum: ['genuine_surge', 'bot_attack', 'system_fault'],
                },
                severity: {
                  type: Type.STRING,
                  enum: ['low', 'medium', 'high', 'critical'],
                },
                summary: {
                  type: Type.STRING,
                },
                recommended_action: {
                  type: Type.STRING,
                },
              },
              required: ['classification', 'severity', 'summary', 'recommended_action'],
            },
            systemInstruction:
              'You are GovPulse AI, an automated Site Reliability & Cyber Defense Anomaly Triage Agent for critical government public portals.',
          },
        }),
        7500
      );

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      const parsed = JSON.parse(text);
      return res.status(200).json({
        success: true,
        analysis: parsed,
        isFallback: false,
      });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded')) {
        quotaCooldownUntil = Date.now() + 60000;
        console.log('[Triage] Quota rate limit reached; using fallback.');
      } else {
        console.log('[Triage] Fallback engaged:', errMsg);
      }

      return res.status(200).json({
        success: true,
        analysis: getHeuristicTriage(),
        isFallback: true,
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
