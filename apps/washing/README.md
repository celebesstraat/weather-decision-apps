<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GetTheWashingOut

A React PWA that tells UK residents when to hang their laundry outside. Combines real weather data with a proprietary drying algorithm and Gemini AI summaries for actionable recommendations.

View your app in AI Studio: https://ai.studio/apps/drive/1vDMh6goUXV-6VNk3v4kqfiuZhf1ughHN

## Run Locally

**Prerequisites:** Node.js (v18 or higher)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your Gemini API key:
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5000](http://localhost:5000) in your browser

## Deploy to Vercel

### Prerequisites
- A [Vercel account](https://vercel.com/signup)
- A [Google Gemini API key](https://ai.google.dev/gemini-api/docs/api-key)
- This repository connected to your GitHub account

### Deployment Steps

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import Project in Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your `GetTheWashingOut` repository
   - Vercel will auto-detect Vite configuration

3. **Configure Environment Variables:**
   In Vercel Dashboard → Settings → Environment Variables, add:

   | Variable Name | Value | Environments |
   |---------------|-------|--------------|
   | `VITE_GEMINI_API_KEY` | Your Gemini API key | Production, Preview, Development |

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - You'll receive a production URL (e.g., `your-app.vercel.app`)

5. **Verify Deployment:**
   - ✅ PWA installs correctly
   - ✅ Service worker registers
   - ✅ Geolocation works
   - ✅ Weather data loads
   - ✅ AI summaries generate

### Automatic Deployments

Once connected to GitHub:
- **Production:** Push to `main` branch → auto-deploy to production
- **Preview:** Open a PR → auto-deploy preview URL
- **Rollback:** Vercel Dashboard → Deployments → Promote previous deployment

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | Yes | Your Google Gemini API key for AI-powered summaries |

**Important:** Never commit `.env.local` to git. It's already in `.gitignore`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:5000) |
| `npm run build` | Build for production (output: `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm test` | Run Jest unit tests |
| `npm run lint` | Lint TypeScript files |

## Tech Stack

- **Framework:** React 19 + TypeScript 5.8
- **Build Tool:** Vite 6.2
- **Styling:** Tailwind CSS (local build)
- **Animation:** Framer Motion 12.x
- **AI:** Google Gemini 2.5 Flash
- **Weather Data:** Open-Meteo API (UK Met Office)
- **Deployment:** Vercel

## Architecture

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation, algorithm explanation, and contributor guide.

## License

MIT
