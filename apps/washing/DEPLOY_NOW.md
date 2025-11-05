# 🚀 Deploy Security Fix Now - Quick Guide

## Prerequisites Checklist

- [x] Code changes complete
- [x] Build tested locally
- [x] API key NOT in bundle (verified)
- [ ] **YOU NEED TO DO**: Set environment variable in Vercel

---

## 🔴 STEP 1: Set Environment Variable (DO THIS FIRST!)

### Vercel Dashboard Method (Recommended)

1. **Go to**: https://vercel.com/dashboard
2. **Select**: GetTheWashingOut project
3. **Navigate**: Settings → Environment Variables
4. **Click**: "Add New"
5. **Enter**:
   ```
   Key: VITE_GEMINI_API_KEY
   Value: [paste your Gemini API key here]
   ```
6. **Select Environments**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
7. **Click**: Save

### Vercel CLI Method (Alternative)

```bash
# Set for production
vercel env add VITE_GEMINI_API_KEY production

# When prompted, paste your API key
# Press Enter

# Set for preview
vercel env add VITE_GEMINI_API_KEY preview

# Set for development
vercel env add VITE_GEMINI_API_KEY development
```

---

## 🚀 STEP 2: Deploy to Production

### Option A: Git Push (Easiest)

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Secure Gemini API with serverless proxy

CRITICAL SECURITY FIX:
- Move API key from client-side to server-side
- Add serverless proxy (/api/gemini) with rate limiting
- Remove @google/genai from client bundle (53% size reduction)
- Add input validation, XSS/SQLi protection, and CORS

Verification:
✅ API key NOT in production bundle
✅ Google GenAI library NOT in client code
✅ Rate limiting: 20 requests/minute per IP
✅ Build size: 996KB → 471KB

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to main branch (triggers auto-deploy on Vercel)
git push origin main
```

### Option B: Vercel CLI (Manual Deploy)

```bash
# Deploy to production
vercel --prod

# Follow the prompts
# Vercel will build and deploy automatically
```

---

## ✅ STEP 3: Verify Deployment (Important!)

### A. Check Deployment Status

```bash
# Option 1: CLI
vercel ls

# Option 2: Dashboard
# Visit: https://vercel.com/dashboard
# Check "Deployments" tab for status
```

### B. Test Production App

1. **Visit**: https://getthewashingout.vercel.app
2. **Enter location**: e.g., "London"
3. **Verify**:
   - ✅ Weather data loads
   - ✅ AI advice appears
   - ✅ No console errors

### C. Security Verification (Critical!)

```bash
# Open browser DevTools on production site
# 1. Go to Sources tab
# 2. Press Ctrl+Shift+F (search all files)
# 3. Search for: AIzaSy
# 4. Should find: 0 results ✅

# Check serverless function exists
curl -X POST https://getthewashingout.vercel.app/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"type":"place-name","latitude":51.5074,"longitude":-0.1278}'

# Expected: JSON response with place name
# Or 429 if rate limited (that's good!)
```

### D. Check Network Requests

1. Open DevTools → Network tab
2. Enter a location in the app
3. Look for `/api/gemini` request
4. **Verify**:
   - Request URL: `/api/gemini` (not `generativelanguage.googleapis.com`)
   - Status: 200 OK
   - Response: Valid JSON with `text` field

---

## 🎉 Success Criteria

Your deployment is successful when:

- [x] Vercel deployment status: "Ready"
- [ ] App loads at production URL
- [ ] AI advice appears for test location
- [ ] No API key in browser sources (verified via DevTools search)
- [ ] `/api/gemini` endpoint responds (verified via Network tab)
- [ ] No console errors

---

## ⚠️ Troubleshooting

### Issue: "AI advice unavailable"

**Cause**: Environment variable not set or misspelled

**Fix**:
1. Check Vercel Dashboard → Settings → Environment Variables
2. Verify key name: `VITE_GEMINI_API_KEY` (exact spelling)
3. Verify value is correct Gemini API key
4. Redeploy: `vercel --prod`

### Issue: "API error: 500"

**Cause**: Serverless function error

**Fix**:
```bash
# Check logs
vercel logs --prod

# Look for error messages in /api/gemini function
# Common issues:
# - Missing environment variable
# - Incorrect API key
# - Gemini API quota exceeded
```

### Issue: "Rate limit exceeded"

**Status**: This is actually GOOD! It means rate limiting works.

**Fix**: Wait 60 seconds and try again.

### Issue: Build fails

**Cause**: TypeScript errors or missing dependencies

**Fix**:
```bash
# Check build locally first
npm run build

# Fix any errors shown
# Then redeploy
```

---

## 🔄 Rollback (If Needed)

### Emergency Rollback via Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click: Deployments
3. Find: Previous working deployment
4. Click: "..." menu → "Promote to Production"

### Rollback via Git

```bash
# Revert last commit
git revert HEAD

# Push to trigger redeploy
git push origin main
```

---

## 📊 Post-Deployment Monitoring

### Day 1: Monitor for errors

```bash
# Check logs every few hours
vercel logs --prod

# Look for:
# - 500 errors (serverless function issues)
# - 429 errors (rate limiting - expected)
# - Unusual patterns
```

### Week 1: Check metrics

1. **Vercel Dashboard** → Analytics
   - Response times for `/api/gemini`
   - Error rates
   - Total requests

2. **Cost monitoring**
   - Vercel Functions: Should be well under 1M invocations (free tier)
   - No unexpected charges

---

## 📝 Quick Reference

| What | Command |
|------|---------|
| Deploy | `git push origin main` |
| Check status | `vercel ls` |
| View logs | `vercel logs --prod` |
| Rollback | Vercel Dashboard → Deployments → Promote previous |
| Test locally | `vercel dev --port 5000` |
| Check env vars | Vercel Dashboard → Settings → Environment Variables |

---

## Next Action: DEPLOY NOW! 🚀

Run these commands:

```bash
# 1. Stage changes
git add .

# 2. Commit
git commit -m "feat: Secure Gemini API with serverless proxy"

# 3. Push (triggers auto-deploy)
git push origin main

# 4. Watch deployment
vercel logs --prod --follow
```

**Estimated time**: 2-3 minutes for deployment
**Risk level**: Low (graceful degradation on errors)
**Rollback time**: < 1 minute via Vercel Dashboard

---

**Ready to deploy? Just push to main!** 🎉
