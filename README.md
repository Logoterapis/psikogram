# Psikogram

The React app uses a Vercel Function at `/api/ai` for Gemini, DeepSeek, and Claude. Provider API keys are read only by that function. Do not add them to Vite `define` or any `VITE_` variable: those values become public browser code.

## Local development

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set fresh API keys. Never commit `.env.local`.
3. Run `npx vercel dev` to serve both the Vite app and `/api/ai`. `npm run dev` serves only the frontend, so AI actions will not work through it.

## Vercel deployment

Set `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, and `CLAUDE_API_KEY` as server-side environment variables for the environments you use. Gemini is required for every analysis mode, including the DeepSeek and Claude hybrid modes. Deploy again after changing environment variables.

The app handles private applicant documents. Enable Vercel Deployment Protection or equivalent authentication for the project before using the server-side AI endpoint in production. Restrict and monitor the provider keys and rotate all keys previously included in the browser bundle. Vercel Functions accept request bodies up to 4.5 MB; the app shows a size error above 4 MB to leave room for transport overhead.
