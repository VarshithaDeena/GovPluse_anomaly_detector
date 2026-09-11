import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
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

// Endpoint to provide local backup of the NAB CloudWatch dataset if remote fails
app.get('/api/dataset', (req, res) => {
  const filePath = path.resolve('public/data/elb_request_count_8c0756.csv');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/csv');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Dataset file not found' });
  }
});

let quotaCooldownUntil = 0;

function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Endpoint to triage anomalies using Gemini AI
app.post('/api/analyze-anomaly', async (req, res) => {
  const { currentPoint, windowPoints, rollingMean, rollingStd, zScore } = req.body;

  if (!currentPoint || typeof zScore !== 'number') {
    return res.status(400).json({ error: 'Invalid payload: currentPoint and zScore required' });
  }

  const val = Number(currentPoint.value);
  const z = Number(zScore);
  const mean = Number(rollingMean || 70);

  // High-fidelity fallback heuristic generator
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
    } else {
      severity = 'medium';
      classification = 'genuine_surge';
      summary = `Elevated request count of ${val.toFixed(0)} requests/interval (+${z.toFixed(1)}σ) detected during citizen portal monitoring.`;
      recommended_action = 'Monitor subsequent intervals to verify if traffic stabilizes or continues rising.';
    }

    return { classification, severity, summary, recommended_action };
  };

  // If in quota cooldown or API key missing, return heuristic triage immediately
  if (Date.now() < quotaCooldownUntil || !process.env.GEMINI_API_KEY) {
    return res.json({
      success: true,
      analysis: getHeuristicTriage(),
      isFallback: true,
    });
  }

  const prompt = `Analyze this AWS ELB traffic anomaly on a US government public portal:
- Metric: AWS ELB Request Count (requests per 5-minute interval)
- Current Event: ${currentPoint.timestamp} -> ${val.toFixed(1)} req/interval
- 30-pt Rolling Mean: ${mean.toFixed(1)}, Std Dev: ${Number(rollingStd || 10).toFixed(1)}
- Calculated Z-Score: ${z.toFixed(2)}σ (Threshold: > 2.50)

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
    return res.json({
      success: true,
      analysis: parsed,
      isFallback: false,
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded')) {
      // Cooldown for 60s if quota limit is reached
      quotaCooldownUntil = Date.now() + 60000;
      console.log('[Triage] Quota rate limit encountered; engaging 60s cooldown with heuristic triage engine.');
    } else {
      console.log('[Triage] Heuristic fallback engaged:', errMsg);
    }

    return res.json({
      success: true,
      analysis: getHeuristicTriage(),
      isFallback: true,
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GovPulse server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone listener when not running as a Vercel serverless function
if (!process.env.VERCEL) {
  startServer();
}

export default app;
