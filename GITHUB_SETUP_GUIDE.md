# GitHub Repository Setup & Vercel CI/CD Integration

**Date**: 2025-11-05
**Status**: Git initialized, ready for GitHub

---

## Current Status

✅ **Git repository initialized**
- Commit: `5cb8624` (Initial commit: Phase 3 complete)
- Files: 318 files, 93,508 lines
- Branch: `master` (default)

---

## Step 1: Create GitHub Repository

### Option A: Via GitHub Website (Easiest)

1. Go to [github.com/new](https://github.com/new)

2. **Repository Settings**:
   - **Name**: `weather-decision-apps`
   - **Description**: `Monorepo for GetTheWashingOut & GetTheWoodburnerOn weather PWAs`
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. Click **"Create repository"**

4. Copy the repository URL shown (should be like):
   ```
   https://github.com/YOUR_USERNAME/weather-decision-apps.git
   ```

### Option B: Via GitHub CLI (If Installed)

```bash
cd /c/Users/steel/weather-decision-apps
gh auth login  # Follow prompts
gh repo create weather-decision-apps --public --source=. --remote=origin --push
```

---

## Step 2: Connect Local Repo to GitHub

After creating the GitHub repo, run these commands:

```bash
cd /c/Users/steel/weather-decision-apps

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/weather-decision-apps.git

# Rename branch to 'main' (GitHub default)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME`** with your actual GitHub username!

---

## Step 3: Verify Push Success

After pushing, verify:

```bash
git remote -v
# Should show:
# origin  https://github.com/YOUR_USERNAME/weather-decision-apps.git (fetch)
# origin  https://github.com/YOUR_USERNAME/weather-decision-apps.git (push)

git log --oneline
# Should show:
# 5cb8624 Initial commit: Phase 3 complete - monorepo with shared AI services
```

Visit your GitHub repo in a browser:
```
https://github.com/YOUR_USERNAME/weather-decision-apps
```

You should see all 318 files!

---

## Step 4: Configure Vercel GitHub Integration

### 4.1 Connect Vercel to GitHub (One-Time Setup)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. If not connected, click **"Connect GitHub Account"**
5. Authorize Vercel to access your GitHub repositories

### 4.2 Import GetTheWashingOut

1. In Vercel Dashboard → **"Add New Project"**
2. Find `weather-decision-apps` repo
3. Click **"Import"**
4. **Configure Project**:
   - **Project Name**: `getthewashingout` (or your preferred name)
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/washing` ← **IMPORTANT!**
   - **Build Command**: `npm run build` (Vercel will use this from package.json)
   - **Output Directory**: `dist`
   - **Install Command**: Leave default (Vercel will detect monorepo)

5. **Environment Variables**:
   - Click **"Environment Variables"**
   - Add:
     ```
     Name: VITE_GEMINI_API_KEY
     Value: [your Gemini API key]
     Environments: Production, Preview, Development (all checked)
     ```

6. Click **"Deploy"**

### 4.3 Import GetTheWoodburnerOn

Repeat the same process:
1. Vercel Dashboard → **"Add New Project"**
2. Select `weather-decision-apps` repo again (yes, same repo!)
3. Click **"Import"**
4. **Configure Project**:
   - **Project Name**: `getthewoodburneronxxx` (add suffix to avoid conflict)
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/woodburner` ← **IMPORTANT!**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Environment Variables**:
   - Add same `VITE_GEMINI_API_KEY` variable

6. Click **"Deploy"**

---

## Step 5: Automatic Deployments (Configured!)

Once connected, Vercel will **automatically**:

### Production Deployments
- **Trigger**: Push to `main` branch
- **Action**: Both apps redeploy automatically
- **URL**:
  - `getthewashingout.vercel.app`
  - `getthewoodburneronxxx.vercel.app`

### Preview Deployments
- **Trigger**: Open pull request
- **Action**: Deploy preview for both apps
- **URL**: Unique preview URLs (e.g., `getthewashingout-abc123.vercel.app`)

### Branch Deployments
- **Trigger**: Push to any branch
- **Action**: Create preview deployment
- **Access**: Via Vercel Dashboard → Deployments

---

## Step 6: Test Automatic Deployment

Let's test the CI/CD pipeline:

```bash
cd /c/Users/steel/weather-decision-apps

# Make a small change
echo "# Weather Decision Apps Monorepo" > README_TEST.md
git add README_TEST.md
git commit -m "test: Verify automatic Vercel deployments"
git push origin main
```

**Expected Result**:
1. GitHub receives push
2. Vercel webhook triggered
3. Both apps rebuild automatically
4. New deployments live in ~2-3 minutes

Check progress:
- Vercel Dashboard → Deployments → Watch build logs

---

## Step 7: Configure Advanced Settings (Optional)

### Turbo Caching (Recommended for Monorepos)

In each Vercel project settings:
1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Enable **"Turbo"** (if available)
4. Save

This will cache unchanged packages and speed up builds.

### Branch Protection (Recommended)

On GitHub:
1. Go to repo → **Settings** → **Branches**
2. Add rule for `main`:
   - ✅ Require status checks (Vercel deployments must pass)
   - ✅ Require branches to be up to date
   - ✅ Do not allow force pushes

---

## Monorepo Deployment Architecture

```
GitHub Repository: weather-decision-apps
│
├── main branch push
│   │
│   ├─→ Vercel Project 1: GetTheWashingOut
│   │   └─→ Builds apps/washing
│   │   └─→ Deploys to getthewashingout.vercel.app
│   │
│   └─→ Vercel Project 2: GetTheWoodburnerOn
│       └─→ Builds apps/woodburner
│       └─→ Deploys to getthewoodburneronxxx.vercel.app
│
└── Pull request
    └─→ Preview deployments for both apps
```

---

## Troubleshooting

### Issue: "Build failed - Cannot find module"

**Solution**: Ensure `Root Directory` is set correctly:
- Washing: `apps/washing`
- Woodburner: `apps/woodburner`

### Issue: "Environment variable not found"

**Solution**:
1. Go to Project Settings → Environment Variables
2. Add `VITE_GEMINI_API_KEY`
3. Check all environments (Production, Preview, Development)
4. Redeploy

### Issue: "Monorepo dependencies not found"

**Solution**: Vercel automatically detects monorepos. If issues persist:
1. Check `package.json` has workspace configuration
2. Ensure `turbo.json` exists at monorepo root
3. Try manual override in Vercel:
   - Build Command: `cd ../.. && npm install && npm run build`

### Issue: "Both apps try to deploy from same directory"

**Solution**: You need **TWO separate Vercel projects** from the **SAME GitHub repo**:
- Project 1: Root directory = `apps/washing`
- Project 2: Root directory = `apps/woodburner`

---

## Summary

### What You'll Have After Setup

1. ✅ **GitHub Repository**: Single source of truth for all code
2. ✅ **Automatic CI/CD**: Push to `main` → both apps deploy
3. ✅ **Preview Deployments**: Every PR gets preview URLs
4. ✅ **Version Control**: Full git history, rollback capability
5. ✅ **Collaboration Ready**: Team members can clone and contribute

### Typical Workflow After Setup

```bash
# Make changes locally
cd /c/Users/steel/weather-decision-apps/apps/washing
# ... edit files ...

# Commit and push
git add .
git commit -m "feat: Add new feature"
git push origin main

# Vercel automatically deploys both apps!
# Check status: vercel.com/dashboard
```

---

## Quick Reference

### Common Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# Create new branch
git checkout -b feature/my-feature

# Push branch
git push origin feature/my-feature

# Merge to main
git checkout main
git merge feature/my-feature
git push origin main
```

### Vercel CLI Commands (Optional)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy manually (for testing)
cd apps/washing
vercel

# View deployment logs
vercel logs
```

---

## Next Steps

1. ✅ Complete Step 1-2: Create GitHub repo and push
2. ✅ Complete Step 4: Configure Vercel projects
3. ✅ Complete Step 6: Test automatic deployment
4. 🎉 Enjoy automatic CI/CD for both apps!

---

**Created**: 2025-11-05
**Status**: Ready to execute
**Estimated Setup Time**: 15-20 minutes

🚀 **Let's get your monorepo on GitHub with automatic Vercel deployments!** 🚀
