# GovPulse — Real-Time Portal Anomaly Detection

> **Live Deployment:** [https://gov-pluse-anomaly-detector.vercel.app](https://gov-pluse-anomaly-detector.vercel.app)

GovPulse is an intelligent, real-time traffic anomaly detection and incident triage dashboard designed for government portals and mission-critical public web infrastructure. It pairs rolling statistical analysis with automated Google Gemini AI classification to identify, prioritize, and remediate anomalous traffic patterns in real time.

---

## 🚀 Live Demo

Access the live application at:
👉 **[https://gov-pluse-anomaly-detector.vercel.app](https://gov-pluse-anomaly-detector.vercel.app)**

---

## 🏗️ Architecture Overview

GovPulse is built with a high-performance modern web stack featuring decoupled client-side visualization and serverless backend triage:

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 19 + Vite)               │
│  - Live Streaming Time-Series Canvas (SVG + Motion)   │
│  - Statistical Rolling Window (Mean, StdDev, Z-Score)  │
│  - Interactive Triage & Alert Incident Feed           │
│  - Playback Controls (0.5x - 5x Replay, Scrubbing)     │
└───────────────────────────┬────────────────────────────┘
                            │
               HTTPS /api/analyze-anomaly
                            │
┌───────────────────────────▼────────────────────────────┐
│      Serverless API Tier (Vercel Functions / Node)      │
│  - api/analyze-anomaly.ts: Gemini 2.5 Flash Triage     │
│  - api/dataset.ts: High-speed benchmark CSV delivery   │
│  - Zero-downtime heuristic fallback engine             │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Google Gemini AI                      │
│  - Classification: Genuine Surge / Bot Attack / Fault  │
│  - Severity: Low / Medium / High / Critical            │
│  - Automated Site Reliability Remediation Playbook     │
└────────────────────────────────────────────────────────┘
```

### Key Components

1. **Client-Side Statistical Engine:**
   - Evaluates incoming request counts in real time using a sliding 30-sample historical window.
   - Dynamically calculates the rolling mean ($\mu$) and standard deviation ($\sigma$).
   - Calculates the instantaneous Z-score ($Z = \frac{x - \mu}{\sigma}$) and flags anomalous deviations exceeding the user-configurable threshold ($\sigma \ge 2.5$).

2. **Automated Gemini AI Incident Triage:**
   - When an anomaly fires, telemetry (current rate, rolling baseline, standard deviation, and Z-score) is evaluated by Google's Gemini models via structured JSON output.
   - Provides instant classification (`genuine_surge`, `bot_attack`, `system_fault`), impact severity, root-cause diagnosis, and actionable tactical remediation instructions for site reliability engineers.
   - Features built-in heuristic fallback safeguarding uninterrupted triage during quota rate limits or network degradation.

3. **Multi-Speed Replay Engine:**
   - Emulates live production traffic streams with pause, rewind, fast-forward (0.5x, 1x, 2x, 5x), and threshold sensitivity tuning.

---

## 📊 Dataset

GovPulse utilizes real-world production metrics from the **Numenta Anomaly Benchmark (NAB)**:

- **Dataset Name:** `realAWSCloudwatch/elb_request_count_8c0756.csv`
- **Source:** [Numenta Anomaly Benchmark (NAB)](https://github.com/numenta/NAB)
- **Metric:** AWS Elastic Load Balancer (ELB) request counts recorded at 5-minute intervals.
- **Characteristics:** Contains real operational baseline patterns, organic demand peaks, traffic drop-offs, and critical surge anomalies.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Motion
- **Backend / Serverless:** Vercel Node Functions (`@vercel/node`), Express.js, `@google/genai`
- **AI Model:** Google Gemini Flash (`gemini-2.5-flash` / `gemini-3.6-flash`)
- **Styling:** Modern Tailwind CSS with accessible high-contrast dark console design
- **Deployment:** Vercel (Production Live) / Cloud Run compatible

---

## 💻 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/your-username/govpulse.git
cd govpulse
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 5. Production build
```bash
npm run build
```

---

## 📄 License

MIT License. Designed for public service resilience and infrastructure reliability.
