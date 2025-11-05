# Vercel Deployment Guide - GetTheWoodburnerOn

**Status:** Ready for secure deployment after API key rotation
**Last Updated:** 2025-11-02
**Security:** Phase 1 (Critical) completed

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Security Changes Applied](#security-changes-applied)
3. [Vercel Setup Instructions](#vercel-setup-instructions)
4. [Environment Variables Configuration](#environment-variables-configuration)
5. [Testing & Verification](#testing--verification)
6. [Post-Deployment Monitoring](#post-deployment-monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

**CRITICAL: Complete these steps BEFORE deploying to Vercel**

### Step 1: API Key Security ✅ COMPLETED
- [x] Created `SECURITY-ROTATE-KEYS.md` with rotation instructions
- [x] Documented exposed keys that need revocation
- [ ] **YOU MUST DO:** Follow instructions in `SECURITY-ROTATE-KEYS.md` to:
  - Revoke old API keys in Google Cloud Console
  - Generate new restricted API key
  - Configure key in Vercel (NOT in git)

### Step 2: Code Refactoring ✅ COMPLETED
- [x] Created serverless function: `api/gemini.ts`
- [x] Updated `services/geminiService.ts` to use proxy
- [x] Removed direct API key exposure from client code
- [x] Added comprehensive security headers in `vercel.json`
- [x] Cleaned up service worker unregistration code
- [x] Removed Replit-specific configuration
- [x] Updated `.gitignore` to exclude all `.env` files

### Step 3: Dependencies ✅ COMPLETED
- [x] Installed `@vercel/node` for serverless function types
- [ ] **OPTIONAL:** Run `npm audit fix` to address 5 vulnerabilities

### Step 4: Local Testing (Recommended)
```bash
# Build the project locally
npm run build

# Preview production build
npm run preview

# Verify:
# - App loads without errors
# - Location search works
# - Geolocation permission prompt works
# - Check browser console for errors
```

---

## Security Changes Applied

### 1. API Proxy Architecture (CRITICAL)

**Before (INSECURE):**
```
Browser → geminiService.ts → [API_KEY_IN_BUNDLE] → Google Gemini API
          ❌ Key visible in DevTools
```

**After (SECURE):**
```
Browser → geminiService.ts → /api/gemini (Vercel Serverless) → Google Gemini API
                                        ↑
                                [API_KEY_ON_SERVER]
                                ✅ Key never exposed
```

**Files Changed:**
- **NEW:** `api/gemini.ts` - Serverless function with rate limiting
- **UPDATED:** `services/geminiService.ts` - Now calls proxy endpoint

### 2. Security Headers (`vercel.json`)

Added comprehensive security headers:
- **Content-Security-Policy** - Prevents XSS attacks
- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-Content-Type-Options: nosniff** - Prevents MIME sniffing
- **Strict-Transport-Security** - Forces HTTPS
- **Referrer-Policy** - Controls referrer information
- **Permissions-Policy** - Restricts browser features

### 3. Rate Limiting

Implemented in serverless function (`api/gemini.ts`):
- **20 requests per minute** per IP address
- In-memory rate limiting (sufficient for single-instance)
- Returns `429` status code when exceeded

**Note:** For production at scale, consider upgrading to Redis or Vercel KV for distributed rate limiting.

### 4. Input Sanitization

Already implemented in `components/LocationInput.tsx`:
- Sanitizes location input (removes HTML, scripts, SQL)
- Validates coordinates (range checks, format validation)
- Rate limits location submissions

### 5. Environment Variable Security

Updated `.gitignore`:
```
.env
.env.local
.env.*.local
.env.development
.env.production
.env.test
```

**IMPORTANT:** `.env.local` was previously committed with exposed key. Follow `SECURITY-ROTATE-KEYS.md` to clean git history.

---

## Vercel Setup Instructions

### Option A: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd c:\Users\steel\GetTheWoodburnerOn
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Scope: Select your account
# - Link to existing project? N (first time) or Y (if exists)
# - Project name: getthewoodburneron (or your preferred name)
# - Directory: ./ (root)
# - Override settings? N (use vercel.json)
```

**Environment Variables (CLI):**
```bash
# Add production environment variable
vercel env add GEMINI_API_KEY production
# Paste your NEW API key when prompted

# Add preview environment variable (for PR previews)
vercel env add GEMINI_API_KEY preview
# Paste same key

# Add development environment variable (optional)
vercel env add GEMINI_API_KEY development
# Paste same key or use different for testing
```

### Option B: Deploy via Vercel Dashboard (Easiest)

1. **Connect Repository**
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Connect your GitHub account
   - Select `GetTheWoodburnerOn` repository
   - Click "Import"

2. **Configure Project**
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

3. **Add Environment Variables**
   - Click "Environment Variables"
   - Add variable:
     - **Key:** `GEMINI_API_KEY` (NOT `VITE_GEMINI_API_KEY`)
     - **Value:** [Your NEW API key from Google Cloud]
     - **Environment:** Production, Preview, Development (all selected)
   - Click "Add"

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Vercel will provide a deployment URL: `https://getthewoodburneron-xyz.vercel.app`

---

## Environment Variables Configuration

### Required Variables

| Variable | Value | Where to Set |
|----------|-------|--------------|
| `GEMINI_API_KEY` | Your Gemini API key (same as GetTheWashingOut) | Vercel Dashboard → Settings → Environment Variables |

**CRITICAL NOTES:**
1. **Use `GEMINI_API_KEY`** (without `VITE_` prefix) for serverless function
2. **Sharing keys across apps:** You can use the SAME API key for both GetTheWashingOut and GetTheWoodburnerOn
3. **Never commit** API keys to git
4. **Set for all environments:** Production, Preview, Development
5. **Verify** key restrictions include BOTH app domains in Google Cloud Console

### Sharing API Key Between GetTheWashingOut and GetTheWoodburnerOn

**Benefits:**
- Single quota management
- Simplified monitoring
- Cost tracking in one place
- Easier key rotation

**Setup:**
1. Use the same `GEMINI_API_KEY` value for both projects in Vercel
2. Ensure HTTP referrer restrictions include both domains:
   - `https://getthewashingout.vercel.app/*`
   - `https://getthewoodburneron.vercel.app/*`
   - `https://*.vercel.app/*` (catches preview deployments)
3. Monitor combined usage in Google Cloud Console
4. Set quota limits appropriately for BOTH apps (recommend $10/day for 2 apps)

### Setting Variables in Vercel Dashboard

**Option A: If you already have the key in GetTheWashingOut**

1. Go to GetTheWashingOut project: `https://vercel.com/[your-username]/getthewashingout`
2. Click **Settings** → **Environment Variables**
3. Find `GEMINI_API_KEY` and copy the value
4. Go to GetTheWoodburnerOn project: `https://vercel.com/[your-username]/getthewoodburneron`
5. Click **Settings** → **Environment Variables**
6. Click **Add New**
7. Enter:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** [paste the SAME value from GetTheWashingOut]
   - **Environments:** ✅ Production ✅ Preview ✅ Development
8. Click **Save**
9. Update API key restrictions in Google Cloud Console to include both domains (see above)

**Option B: If you need a new key**

1. Follow the steps in `SECURITY-ROTATE-KEYS.md` to generate a new key
2. Add the key to BOTH projects in Vercel (same value for both)
3. Set HTTP referrer restrictions to include both app domains

---

## Testing & Verification

### After Deployment

#### 1. Basic Functionality Test
```
Visit: https://your-app.vercel.app

✅ App loads without errors
✅ Location input appears
✅ Geolocation button works (requests permission)
✅ Can enter location and submit
✅ Weather recommendations appear
✅ FlameCast scores display
✅ AI advice loads (may take 2-3 seconds)
```

#### 2. Network Inspection (DevTools)
```
Open DevTools → Network tab

✅ API calls go to /api/gemini (NOT direct to Google)
✅ No API key visible in request headers
✅ Response status: 200 OK
✅ No CORS errors
✅ Security headers present in response
```

#### 3. Security Header Verification
```
Visit: https://securityheaders.com/?q=https://your-app.vercel.app

Expected Grade: A or A+

✅ Content-Security-Policy: present
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ Strict-Transport-Security: present
✅ Referrer-Policy: present
```

#### 4. Lighthouse Audit
```
DevTools → Lighthouse → Run Analysis

Target Scores:
- Performance: >85 (mobile), >95 (desktop)
- Accessibility: >90
- Best Practices: >95
- SEO: >90
- PWA: >80 (if service worker re-enabled)
```

#### 5. API Key Exposure Check
```
Open DevTools → Sources → Search for "AIza"

❌ Should find ZERO results
✅ API key is NOT in client bundle
```

### Common Issues After Deployment

| Issue | Cause | Fix |
|-------|-------|-----|
| "Configuration error" message | Serverless function can't access API key | Check Vercel env vars, redeploy |
| API calls return 500 error | Serverless function error | Check Vercel logs: Dashboard → Deployments → [deployment] → Functions |
| API calls return 429 error | Rate limit exceeded OR Google quota | Wait 1 minute, check Google Cloud quotas |
| "AI advice temporarily unavailable" | Gemini API key invalid/restricted | Verify key in Google Cloud, check restrictions |
| CORS errors in console | CSP header too strict | Update `vercel.json` CSP policy |

---

## Post-Deployment Monitoring

### Vercel Analytics (Recommended)

**Enable Vercel Analytics:**
1. Go to project in Vercel Dashboard
2. Click **Analytics** tab
3. Click **Enable Analytics** (free tier: 100k events/month)

**Monitor:**
- **Web Vitals:** LCP, FID, CLS (Core Web Vitals)
- **Page Views:** Track daily usage
- **Top Pages:** Identify popular routes
- **Geographic Data:** Verify UK/Ireland traffic

### Google Cloud Monitoring (CRITICAL)

**Set Up Alerts:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Monitoring** → **Alerting**
3. Create alerts:

**Alert 1: Daily Cost Threshold**
```
Condition: Daily API spend > $4
Notification: Email to [your-email]
```

**Alert 2: Quota Warning**
```
Condition: API quota > 80%
Notification: Email to [your-email]
```

**Alert 3: High Error Rate**
```
Condition: API error rate > 10%
Notification: Email to [your-email]
```

### Vercel Function Logs

**View Logs:**
1. Dashboard → Project → **Deployments**
2. Click on latest deployment
3. Click **Functions** tab
4. Click on `api/gemini.ts`
5. View real-time logs and errors

**Watch For:**
- `429` rate limit errors (too many requests)
- `500` server errors (function crashes)
- `403` auth errors (API key issues)

### Weekly Maintenance

```bash
# Check for dependency updates
npm outdated

# Update non-breaking changes
npm update

# Audit security vulnerabilities
npm audit

# Fix auto-fixable issues
npm audit fix

# Commit updates
git add package.json package-lock.json
git commit -m "chore: Update dependencies"
git push

# Vercel will auto-deploy (if auto-deploy enabled)
```

---

## Troubleshooting

### Issue: API Key Not Working After Deployment

**Symptoms:**
- "Configuration error" message
- AI advice says "temporarily unavailable"
- Serverless function returns 500 error

**Diagnosis:**
```bash
# Check Vercel environment variables
vercel env ls

# Should see: GEMINI_API_KEY (Production, Preview, Development)
```

**Fix:**
1. Verify environment variable name is `GEMINI_API_KEY` (NOT `VITE_GEMINI_API_KEY`)
2. Verify key is set for all environments
3. Verify key value has no extra spaces or quotes
4. Redeploy: `vercel --prod`

### Issue: Rate Limit Errors (429)

**Symptoms:**
- Users see "Too many requests" message
- Serverless function logs show rate limit hits

**Diagnosis:**
Check `api/gemini.ts` rate limiting:
```typescript
const MAX_REQUESTS_PER_MINUTE = 20;
```

**Fix:**
1. **Short-term:** Increase limit in `api/gemini.ts` (e.g., to 30)
2. **Long-term:** Implement caching to reduce API calls
3. **Production-scale:** Upgrade to Vercel KV or Redis for distributed rate limiting

### Issue: CSP Errors in Console

**Symptoms:**
- Browser console shows "Content Security Policy" violations
- Resources fail to load (fonts, images, API calls)

**Diagnosis:**
Check browser console for blocked resources

**Fix:**
Update `vercel.json` CSP header to allow blocked domains:
```json
"connect-src 'self' https://your-new-api-domain.com"
```

### Issue: Build Fails on Vercel

**Symptoms:**
- Deployment fails during build step
- Error message mentions TypeScript or Vite

**Diagnosis:**
Check build logs in Vercel Dashboard

**Common Causes & Fixes:**
1. **TypeScript errors:**
   ```bash
   # Test build locally
   npm run build

   # Fix errors, commit, push
   ```

2. **Missing dependencies:**
   ```bash
   # Ensure all deps in package.json
   npm install
   git add package.json package-lock.json
   git commit -m "fix: Add missing dependencies"
   git push
   ```

3. **Node version mismatch:**
   - Add `package.json`:
     ```json
     "engines": {
       "node": ">=18.0.0"
     }
     ```

### Issue: Serverless Function Timeout

**Symptoms:**
- API calls take >30 seconds
- Vercel logs show "FUNCTION_INVOCATION_TIMEOUT"

**Diagnosis:**
Check `vercel.json`:
```json
"functions": {
  "api/**/*.ts": {
    "maxDuration": 30  // 30 seconds
  }
}
```

**Fix:**
1. **Reduce prompt size** in `geminiService.ts` (less data = faster response)
2. **Reduce maxOutputTokens** (faster generation)
3. **Increase timeout** (only if necessary, costs more):
   ```json
   "maxDuration": 60  // 60 seconds (requires Pro plan)
   ```

---

## Performance Optimization Checklist

### Before Going Viral

- [ ] Enable Vercel Analytics
- [ ] Set up Google Cloud cost alerts ($5/day max)
- [ ] Test from mobile devices (iOS & Android)
- [ ] Run Lighthouse audit (target >90 all categories)
- [ ] Verify PWA installability
- [ ] Test offline functionality (if service worker re-enabled)
- [ ] Load test serverless function (use Artillery or k6)
- [ ] Implement API response caching (reduce Gemini calls by 60%)
- [ ] Convert PNG images to WebP (60% size reduction)
- [ ] Consider CDN for static assets (Vercel includes this)

### Scaling Considerations

**Current Architecture:**
- ✅ Static assets: Vercel Edge CDN (global, fast)
- ✅ Serverless functions: Auto-scaling (Vercel handles)
- ⚠️ Rate limiting: In-memory (single-instance only)
- ⚠️ No caching: Every request hits Gemini API

**If Traffic Exceeds 10k Users/Day:**
1. **Upgrade Rate Limiting:** Use Vercel KV or Upstash Redis
2. **Implement Caching:** Cache weather data (10min TTL) and Gemini responses (1hr TTL)
3. **Monitor Costs:** Gemini API can get expensive (est. $0.10-$0.50 per 1k users)
4. **Consider Pro Plan:** Vercel Hobby has limits (100GB bandwidth, 100k serverless invocations)

---

## Next Steps (Optional Enhancements)

### Phase 3: Performance Optimization
- [ ] Add bundle analyzer to identify large dependencies
- [ ] Implement weather data caching (reduce API calls)
- [ ] Convert icons to WebP format
- [ ] Re-enable service worker for offline support
- [ ] Add lazy loading for more components

### Phase 4: Production Hardening
- [ ] Set up error tracking (Sentry or Vercel Error Tracking)
- [ ] Add user analytics (privacy-friendly, like Plausible)
- [ ] Implement A/B testing for UI improvements
- [ ] Add dark mode toggle
- [ ] Improve accessibility (ARIA labels, keyboard nav)
- [ ] Add internationalization (i18n) for non-UK markets

### Phase 5: Business Features
- [ ] Add user accounts (optional, for favorites)
- [ ] Push notifications for weather changes
- [ ] Integrate with smart home APIs (Nest, Ecobee)
- [ ] Add Apple Watch/Wear OS complications
- [ ] Create browser extension

---

## Support & Resources

### Documentation
- **Vercel Docs:** https://vercel.com/docs
- **Vite Docs:** https://vitejs.dev/guide/
- **React 19 Docs:** https://react.dev/

### Security
- **Security Headers Test:** https://securityheaders.com
- **CSP Evaluator:** https://csp-evaluator.withgoogle.com/
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/

### Monitoring
- **Google Cloud Console:** https://console.cloud.google.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Gemini API Pricing:** https://ai.google.dev/pricing

### Getting Help
- **Vercel Discord:** https://vercel.com/discord
- **GitHub Issues:** https://github.com/anthropics/claude-code/issues
- **Stack Overflow:** Tag with `vercel`, `vite`, `react`

---

## Final Security Reminder

🚨 **BEFORE YOU DEPLOY:**

1. **Revoke old API keys** in Google Cloud Console (see `SECURITY-ROTATE-KEYS.md`)
2. **Generate new restricted key** with HTTP referrer limits
3. **Never commit** `.env.local` or any file containing API keys
4. **Set quota limits** in Google Cloud ($5/day recommended)
5. **Test locally** before deploying to production

---

**Deployment Status:** ✅ Code is ready for secure deployment
**Estimated Deploy Time:** 5-10 minutes (after API key rotation)
**Expected First-Deploy Cost:** $0 (Vercel Hobby + Google Cloud free tier)
**Ongoing Monthly Cost:** $0-$10 (depends on traffic)

**Last Updated:** 2025-11-02
**Maintainer:** steel + Claude (Sonnet 4.5)
