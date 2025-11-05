# Vercel Setup - Quick Reference Guide

**Repository**: https://github.com/celebesstraat/weather-decision-apps
**Status**: ✅ Code pushed to GitHub, ready for Vercel

---

## Step-by-Step Vercel Integration

### 1. Import GetTheWashingOut App

1. Go to [vercel.com/new](https://vercel.com/new)

2. **Import Git Repository**:
   - If prompted, click **"Connect GitHub Account"** and authorize Vercel
   - Find and select: `celebesstraat/weather-decision-apps`
   - Click **"Import"**

3. **Configure Project**:
   ```
   Project Name: getthewashingout
   Framework Preset: Vite
   Root Directory: apps/washing          ← CRITICAL!
   Build Command: npm run build (auto-detected)
   Output Directory: dist (auto-detected)
   Install Command: (leave default)
   ```

4. **Environment Variables** (click "Environment Variables"):
   ```
   Name: VITE_GEMINI_API_KEY
   Value: [paste your Gemini API key here]

   ✓ Production
   ✓ Preview
   ✓ Development
   ```

5. Click **"Deploy"** and wait ~2-3 minutes

6. **Result**: Your washing app will be live at:
   - `https://getthewashingout.vercel.app`
   - Or custom domain if configured

---

### 2. Import GetTheWoodburnerOn App

**Important**: You'll import the **SAME repository again** but with a different root directory.

1. Go to [vercel.com/new](https://vercel.com/new) again

2. **Import Git Repository**:
   - Select: `celebesstraat/weather-decision-apps` (same repo!)
   - Click **"Import"**

3. **Configure Project**:
   ```
   Project Name: getthewoodburneronapp    ← Different name
   Framework Preset: Vite
   Root Directory: apps/woodburner        ← CRITICAL! Different from washing
   Build Command: npm run build (auto-detected)
   Output Directory: dist (auto-detected)
   Install Command: (leave default)
   ```

4. **Environment Variables**:
   ```
   Name: VITE_GEMINI_API_KEY
   Value: [paste your Gemini API key here]

   ✓ Production
   ✓ Preview
   ✓ Development
   ```

5. Click **"Deploy"** and wait ~2-3 minutes

6. **Result**: Your woodburner app will be live at:
   - `https://getthewoodburneronapp.vercel.app`
   - Or custom domain if configured

---

## Verification Checklist

After both deployments complete:

### Check Deployment Status
- [ ] Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- [ ] Verify both projects appear in your dashboard
- [ ] Both should show "Ready" status

### Test Both Apps
- [ ] Visit `https://getthewashingout.vercel.app`
  - Should load the laundry drying app
  - Try entering a location (e.g., "London")
  - Verify weather data loads
  - Check AI advice appears

- [ ] Visit `https://getthewoodburneronapp.vercel.app`
  - Should load the woodburner app
  - Try entering a location
  - Verify weather data loads
  - Check AI woodburner advice appears

### Verify Automatic Deployments

Test the CI/CD pipeline:

```bash
cd /c/Users/steel/weather-decision-apps

# Create a test file
echo "# Weather Decision Apps - Monorepo" > README_DEPLOYED.md

# Commit and push
git add README_DEPLOYED.md
git commit -m "test: Verify automatic Vercel deployments"
git push origin main
```

**Expected Result**:
1. GitHub receives push
2. Vercel webhook triggered automatically
3. Both apps rebuild (check Vercel Dashboard → Deployments)
4. New deployments live in ~2-3 minutes

---

## Common Issues & Solutions

### Issue: "Root Directory not found"
**Solution**:
- Double-check you entered `apps/washing` and `apps/woodburner` exactly
- No leading or trailing slashes
- Case-sensitive on some systems

### Issue: "Build failed - Cannot find module '@weather-apps/ai-services'"
**Solution**:
- Vercel automatically detects monorepos via `package.json` workspaces
- If issue persists, try:
  - Project Settings → Build & Development Settings
  - Build Command: `cd ../.. && npm install && npm run build`

### Issue: "Environment variable VITE_GEMINI_API_KEY not set"
**Solution**:
- Go to Project Settings → Environment Variables
- Click "Add Another"
- Ensure all three checkboxes are checked (Production, Preview, Development)
- Click "Save"
- Go to Deployments → latest deployment → "..." → "Redeploy"

### Issue: "Both projects deploy the same app"
**Solution**:
- This means you set the same Root Directory for both
- Go to Project Settings → General → Root Directory
- Ensure:
  - Washing project: `apps/washing`
  - Woodburner project: `apps/woodburner`
- Redeploy after fixing

---

## How Automatic Deployments Work

```
GitHub Push to main branch
        ↓
GitHub webhook notifies Vercel
        ↓
Vercel triggers builds for BOTH projects
        ↓
┌─────────────────┬─────────────────┐
│ Project 1       │ Project 2       │
│ (washing)       │ (woodburner)    │
│                 │                 │
│ 1. Git clone    │ 1. Git clone    │
│ 2. npm install  │ 2. npm install  │
│ 3. npm run build│ 3. npm run build│
│    (washing app)│    (woodburner) │
│ 4. Deploy dist/ │ 4. Deploy dist/ │
└─────────────────┴─────────────────┘
        ↓
Both apps live with latest code!
```

---

## Environment Variables Reference

Both apps need the same environment variable:

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_GEMINI_API_KEY` | Your Gemini API key | Powers AI advice generation |

**Security Note**:
- This key is only used server-side in `/api/gemini` serverless functions
- Never exposed to client-side JavaScript
- Safe to use in production

---

## Next Steps After Setup

### Update Existing GetTheWashingOut Project (Optional)

If you already have a Vercel project for GetTheWashingOut from `C:\Users\steel\GetTheWashingOut`:

**Option 1**: Keep Both (Recommended)
- Old project: Single app deployment
- New project: Monorepo deployment
- Compare and switch when ready

**Option 2**: Migrate Old Project
1. Go to old project settings
2. Change Git repository to `celebesstraat/weather-decision-apps`
3. Change Root Directory to `apps/washing`
4. Redeploy

### Custom Domains (Optional)

1. Go to Project Settings → Domains
2. Add custom domain (e.g., `getthewashingout.com`)
3. Follow DNS configuration instructions
4. Repeat for woodburner app if desired

---

## Deployment Commands Reference

```bash
# View deployment status
cd /c/Users/steel/weather-decision-apps
git status
git log --oneline -5

# Deploy both apps (automatic via push)
git add .
git commit -m "feat: Your commit message"
git push origin main
# ← Vercel automatically deploys both apps!

# Create preview deployment (via PR)
git checkout -b feature/my-feature
# ... make changes ...
git push origin feature/my-feature
# Then create PR on GitHub
# ← Vercel creates preview URLs for both apps

# Rollback (via Vercel Dashboard)
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." → "Promote to Production"
```

---

## Success Criteria

✅ **Setup Complete When**:
- Both apps appear in Vercel Dashboard
- Both show "Ready" status
- Both URLs load their respective apps
- Weather data and AI advice work in both
- Push to `main` triggers automatic redeployment

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Monorepo Guide**: https://vercel.com/docs/monorepos
- **Environment Variables**: https://vercel.com/docs/environment-variables
- **Custom Domains**: https://vercel.com/docs/custom-domains

- **Your Repository**: https://github.com/celebesstraat/weather-decision-apps
- **Your Setup Guide**: [GITHUB_SETUP_GUIDE.md](./GITHUB_SETUP_GUIDE.md)

---

**Created**: 2025-11-05
**Repository**: https://github.com/celebesstraat/weather-decision-apps
**Status**: ✅ Ready for Vercel setup

🚀 **Let's get your apps deployed with automatic CI/CD!** 🚀
