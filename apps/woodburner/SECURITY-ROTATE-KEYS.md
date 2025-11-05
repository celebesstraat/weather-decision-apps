# 🚨 URGENT: API Key Rotation Required

## Critical Security Issue

**EXPOSED API KEYS** have been committed to this repository and must be rotated immediately.

### Compromised Keys

The following Gemini API keys are exposed in git history and **MUST BE REVOKED**:

1. `AIzaSyBW6Wj3pY8PA3FHe9HfPJlvYD9q3qimfs8` (found in `.env.local`)
2. `AIzaSyBetxsV5yoVkQ1fb4WecriXtcHyoGff0AY` (found in `.env.example`)

---

## Immediate Action Required (BEFORE DEPLOYMENT)

### Step 1: Revoke Compromised Keys

1. Go to [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials)
2. Find and **DELETE** both keys listed above
3. Verify deletion in the API keys list

### Step 2: Generate New Restricted API Key

1. In Google Cloud Console → **CREATE CREDENTIALS** → **API Key**
2. Click on the newly created key to edit restrictions
3. Configure the following restrictions:

   **Application Restrictions:**
   - Select: **HTTP referrers (web sites)**
   - Add referrers (include BOTH apps):
     ```
     https://getthewashingout.vercel.app/*
     https://getthewoodburneron.vercel.app/*
     https://*.vercel.app/*
     http://localhost:5000/*
     http://localhost:5173/*
     http://localhost:*/*
     ```

   **Note:** You can use the same API key for both GetTheWashingOut and GetTheWoodburnerOn by including both domain patterns in the HTTP referrer restrictions.

   **API Restrictions:**
   - Select: **Restrict key**
   - Choose: **Generative Language API** only

   **Quota Limits:**
   - Go to **Quotas** page
   - Set daily limit: **$5.00 USD** (protects against abuse)
   - Enable alerts at 80% quota consumption

4. **Copy the new API key** (you'll need it for Vercel)

### Step 3: Configure Vercel Environment Variables

**DO NOT commit the new key to git!**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add variable:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** `[YOUR_NEW_API_KEY]`
   - **Environments:** Production, Preview, Development (all selected)
5. Click **Save**

### Step 4: Clean Local Environment

```bash
# Remove .env.local from working directory
rm .env.local

# Create new .env.local with placeholder (DO NOT commit)
echo "VITE_GEMINI_API_KEY=your_key_here_from_vercel_dashboard" > .env.local

# Verify .gitignore excludes it
cat .gitignore | grep ".env.local"
```

### Step 5: Clean Git History (Optional but Recommended)

**WARNING:** This rewrites git history. Coordinate with team members first.

Using BFG Repo-Cleaner (faster than filter-branch):

```bash
# Install BFG
# macOS: brew install bfg
# Windows: Download from https://rtyley.github.io/bfg-repo-cleaner/

# Backup your repo first!
cd ..
cp -r GetTheWoodburnerOn GetTheWoodburnerOn-backup

# Clone a fresh copy (required for BFG)
git clone --mirror https://github.com/yourusername/GetTheWoodburnerOn.git

# Remove .env.local from all commits
bfg --delete-files .env.local GetTheWoodburnerOn.git

# Clean up and push
cd GetTheWoodburnerOn.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force

# Return to working directory
cd ../GetTheWoodburnerOn
git pull --force
```

Alternative using git filter-branch (slower but built-in):

```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.local .env.example' \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote
git push origin --force --all
```

---

## Post-Rotation Verification

### Checklist

- [ ] Both old keys revoked in Google Cloud Console
- [ ] New key created with HTTP referrer restrictions
- [ ] New key configured in Vercel dashboard (NOT in git)
- [ ] `.env.local` removed from local working directory
- [ ] `.gitignore` explicitly includes `.env.local`
- [ ] Git history cleaned (optional)
- [ ] Quota limits set ($5/day)
- [ ] Alerts configured (80% quota)
- [ ] Test app deployment on Vercel
- [ ] Verify API calls work with new key
- [ ] Verify old keys no longer work

### Testing New Setup

```bash
# Local development (if you added key to .env.local)
npm run dev
# Test location search → should work

# Production (after Vercel deploy)
# Open https://yourapp.vercel.app
# Test location search → should work
# Open DevTools → Network → Check API calls to /api/gemini (not direct to Google)
```

---

## Security Improvements in This Refactor

### Before (INSECURE)
```
Browser → geminiService.ts → [API_KEY_IN_BUNDLE] → Google Gemini API
          ❌ Key visible in DevTools
```

### After (SECURE)
```
Browser → geminiService.ts → /api/gemini (Vercel serverless) → Google Gemini API
                                        ↑
                                [API_KEY_ON_SERVER]
                                ✅ Key never exposed
```

---

## Monitoring & Alerts

### Google Cloud Console

Set up alerts for:
1. **Cost Alert:** Daily spend >$4 → Email notification
2. **Quota Alert:** API calls >80% → Email notification
3. **Error Rate:** >10% failed requests → Email notification

### Vercel Dashboard

Monitor:
1. **Function Invocations:** Should stay under 10k/month (free tier)
2. **Build Errors:** Should be zero after successful deploy
3. **Analytics:** Watch for unusual traffic spikes

---

## Emergency Response

### If Old Keys Were Used Maliciously

1. Check Google Cloud Console → **Billing** → Review charges
2. Check **API Metrics** → Look for unusual spike in requests
3. If charges are suspicious:
   - Contact Google Cloud Support immediately
   - Explain keys were accidentally exposed
   - Request charge reversal (may be approved for first incident)

### If New Keys Are Compromised

1. Immediately revoke key in Google Cloud Console
2. Generate replacement key with same restrictions
3. Update Vercel environment variable
4. Trigger new deployment in Vercel dashboard

---

## Prevention for Future

### Never Commit:
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- Any file containing API keys, tokens, or secrets

### Always Use:
- Vercel environment variables for production
- Local `.env.local` for development (in `.gitignore`)
- Server-side API proxies for sensitive keys
- HTTP referrer restrictions on API keys
- Quota limits to prevent abuse

### Best Practices:
- **Pre-commit hook:** Use `git-secrets` to scan for keys before commit
- **Repository scanning:** Use GitHub secret scanning (auto-enabled for public repos)
- **Regular audits:** Review environment variables quarterly
- **Rotation schedule:** Rotate API keys every 90 days

---

## Support & Resources

- **Google Cloud Console:** https://console.cloud.google.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **BFG Repo-Cleaner:** https://rtyley.github.io/bfg-repo-cleaner/
- **Git Secrets Tool:** https://github.com/awslabs/git-secrets

---

**Last Updated:** 2025-11-02
**Status:** 🚨 ACTION REQUIRED
**Priority:** CRITICAL - Complete before any production deployment
