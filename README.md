# GovPulse — Real-Time Portal Anomaly Detection

> 🌐 **Live App:** [https://gov-pluse-anomaly-detector.vercel.app/](https://gov-pluse-anomaly-detector.vercel.app/)

GovPulse — Real-time government portal traffic monitoring using AWS CloudWatch telemetry and automated Gemini AI triage. The app consumes streaming telemetry from the Numenta Anomaly Benchmark (NAB) dataset and processes it through a serverless AI pipeline to detect, classify, and mitigate traffic surges before public infrastructure crashes.

---

## 💡 Real-World Mission: Tackling Public Sector Server Crashes

### The Problem: Why Government Websites Keep Crashing
Public sector portals worldwide (tax filing, entrance examination results, citizen benefit disbursements, and appointment bookings) repeatedly crash during peak traffic spikes. Most government websites **do not use dynamic cloud autoscaling** due to:
- **Legacy Infrastructure & Fixed Capacity:** Many departments run on fixed on-premise hardware, legacy bare-metal server pools, or state datacenters with capped virtual machine allocations.
- **Budget & Procurement Constraints:** Cloud autoscaling carries unpredictable variable costs that clash with strict annual public expenditure budgets.
- **Cascading Failures:** When citizen volume surges 5x–10x at deadline hours, connection pools saturate and servers enter a cascade collapse (HTTP 502 Bad Gateway / 504 Gateway Timeout), taking the portal completely offline for hours.

### How GovPulse Solves This in Real-Time
GovPulse was designed to prevent catastrophic portal downtime **even when infrastructure lacks automatic horizontal scaling**:

1. **Passive Edge Telemetry Tap (Non-Intrusive):**
   - Sits as a lightweight listener at the edge (Cloudflare Worker, AWS ELB/ALB CloudWatch stream, NGINX reverse-proxy, or Envoy log tap). It requires **zero changes** to legacy backend application code.
2. **Pre-Crash Early Warning (5–15 Minutes Before Failure):**
   - By calculating rolling Z-score deviations ($\ge 2.5\sigma$) in 5-minute sampling windows, GovPulse flags abnormal traffic spikes *before* CPU and memory saturation trigger complete server freeze.
3. **AI-Driven Automated Congestion Control & Virtual Queueing:**
   - When an authentic traffic surge is verified by Gemini AI, GovPulse can immediately trigger:
     - **Automated Virtual Waiting Rooms:** Queuing excess users at the edge CDN (e.g., CloudFront/Cloudflare Waiting Room) to limit incoming concurrency to the server's exact maximum stable capacity.
     - **Graceful Feature Degradation:** Temporarily routing non-essential background jobs, heavy asset downloads, or report generation to off-peak queues.
     - **Selective Emergency Burst Scaling:** Triggering on-demand container/VM burst pools only during verified genuine surges, keeping public cloud expenditure tightly bounded.

---

## 🚀 Live Demo

Access the live application at:
👉 **[https://gov-pluse-anomaly-detector.vercel.app](https://gov-pluse-anomaly-detector.vercel.app)**

---

## 🏗️ Architecture Overview

The application consumes streaming telemetry from the **Numenta Anomaly Benchmark (NAB)** dataset and processes it through a **serverless AI pipeline** designed for sub-second incident triage:

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
