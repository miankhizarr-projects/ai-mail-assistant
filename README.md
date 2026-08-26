# 📧 AI Mail Assistant — Autonomous Gmail Agent & Inbox Copilot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/Frontend-React%2019-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38bdf8)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express.js-lightgrey)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange)](https://deepmind.google/technologies/gemini/)

An autonomous AI-powered Gmail copilot and executive email client that summarizes email threads, constructs dynamic HTML replies, categorizes inbox messages, and executes complex email workflows using natural language chat and AI function calling.

---

## 🚀 Live Demo

- **Production App**: [https://mailassistant.khizar.pro](https://mailassistant.khizar.pro)

---

## ✨ Features

- **🤖 Autonomous AI Agent**: Conversational agent powered by Gemini AI capable of searching, reading, summarizing, drafting, labeling, and sending emails via function calling.
- **⚡ One-Click Thread Summarization**: Quickly condense lengthy email threads and multi-part messages into action items.
- **📂 Smart Inbox Categorization**: Automatically organizes emails into Primary, Starred, Purchases, Updates, Spam, Scheduled, and Drafts.
- **🎨 Interactive HTML Email Generator**: Draft responsive, styled HTML emails with live visual iframe previews before sending.
- **✉️ Context-Aware AI Replies**: Custom prompt builder for drafting replies in various tones (Professional, Friendly, Executive, Direct).
- **🔒 Secure Google OAuth 2.0 Integration**: Native integration with Google Workspace and Gmail API (`gmail.readonly`, `gmail.compose`, `gmail.modify`, `gmail.send`).
- **💾 Hybrid Persistence Storage**: Primary support for MongoDB with automated in-memory fallback for high availability.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide React
- **Backend**: Node.js, Express, ESBuild
- **AI Engine**: `@google/genai` (Gemini 2.5 Flash), OpenRouter API fallback
- **Database**: MongoDB / Mongoose (with automated fallback store)
- **Deployment**: Vercel Serverless Functions (`esbuild` bundled CommonJS entrypoint)

---

## 📦 Project Structure

```text
├── api/                  # Vercel serverless entry point
│   └── index.ts
├── server/               # Express server modules & AI agents
│   ├── agent/            # Agent loop, tools, and prompts
│   ├── models/           # MongoDB schema & database connections
│   └── services/         # Gmail API integration logic
├── src/                  # React 19 frontend
│   ├── components/       # UI components (Agent Chat, Mailbox, HTML Editor)
│   ├── services/         # Client-side API fetchers
│   ├── App.tsx           # Main application shell
│   └── main.tsx          # Application entrypoint
├── index.html            # HTML entry
├── server.ts             # Express server setup & API routes
├── vercel.json           # Vercel deployment routes & configuration
└── vite.config.ts        # Vite configuration
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI agent execution. |
| `OPENROUTER_API_KEY` | Optional | Fallback OpenRouter API key for LLM models. |
| `OPENROUTER_MODEL` | Optional | Model identifier (defaults to `google/gemini-2.5-flash`). |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth 2.0 Client Secret. |
| `SESSION_SECRET` | Yes | Secret key used for session cookie signing. |
| `MONGODB_URI` | Optional | MongoDB connection string (falls back to memory store if empty). |
| `APP_URL` | Yes | Public URL of your deployed application (e.g. `https://mailassistant.khizar.pro`). |

---

## 🔑 Setting Up Google OAuth 2.0

To enable Gmail login and inbox access:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and enable the **Gmail API**.
3. Configure the **OAuth Consent Screen** (add scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/gmail.modify`, `https://www.googleapis.com/auth/gmail.compose`, `https://www.googleapis.com/auth/gmail.send`).
4. Create an **OAuth 2.0 Client ID** (Web application).
5. Add Authorized JavaScript Origins:
   - `http://localhost:3000`
   - `https://mailassistant.khizar.pro`
6. Add Authorized Redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `https://mailassistant.khizar.pro/auth/callback`
7. Copy the **Client ID** and **Client Secret** into your `.env` file or Vercel Environment Variables.

---

## 💻 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ai-mail-assistant.git
   cd ai-mail-assistant
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
