# Shared API Key Setup - GetTheWashingOut & GetTheWoodburnerOn

**Quick Reference:** Using the same Gemini API key for both applications

---

## Overview

Both applications can share the **same Gemini API key** for simplified management:
- ✅ Single key to manage
- ✅ Combined quota monitoring
- ✅ Easier cost tracking
- ✅ Simplified key rotation

---

## Quick Setup (If You Already Have GetTheWashingOut Deployed)

### Step 1: Copy API Key from GetTheWashingOut

1. Go to: https://vercel.com/dashboard
2. Select project: **getthewashingout**
3. Click **Settings** → **Environment Variables**
4. Find `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY`
5. Copy the value (starts with `AIza...`)

### Step 2: Add to GetTheWoodburnerOn

1. Still in Vercel Dashboard
2. Select project: **getthewoodburneron** (or whatever you named it)
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Name:** `GEMINI_API_KEY` (use this, NOT `VITE_GEMINI_API_KEY`)
   - **Value:** [paste the key you copied]
   - **Environments:** ✅ Production ✅ Preview ✅ Development
6. Click **Save**

### Step 3: Update API Key Restrictions in Google Cloud

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your Gemini API key
3. Click on it to edit
4. Under **Application restrictions** → **HTTP referrers**, ensure these are included:
   ```
   https://getthewashingout.vercel.app/*
   https://getthewoodburneron.vercel.app/*
   https://*.vercel.app/*
   http://localhost:5000/*
   http://localhost:5173/*
   ```
5. Click **Save**

### Step 4: Deploy GetTheWoodburnerOn

```bash
# Either via CLI
vercel --prod

# Or via Vercel Dashboard → Deployments → Deploy
```

**That's it!** Both apps now share the same API key securely.

---

## Monitoring Combined Usage

### Google Cloud Console

**View API Usage:**
1. Go to: https://console.cloud.google.com
2. Navigate to **APIs & Services** → **Dashboard**
3. Click **Generative Language API**
4. View combined usage from both apps

**Set Quota Alerts:**
1. Go to **Monitoring** → **Alerting**
2. Create alert for combined usage:
   - **Condition:** Daily API spend > $8
   - **Notification:** Email to your address
   - **Note:** $8 threshold covers both apps (adjust as needed)

### Cost Estimation (Combined)

| Traffic Level | Users/Day (Both Apps) | Estimated Cost/Month |
|---------------|----------------------|----------------------|
| Low | <2k total | $5-10 |
| Medium | 2k-20k total | $20-100 |
| High | 20k-100k total | $200-500 |

**Current Setup Protection:**
- Quota limit: $10/day (recommended for 2 apps)
- Maximum monthly cost: $300 (with quota)
- Serverless rate limiting: 20 req/min per IP

---

## Key Rotation (Both Apps at Once)

When you need to rotate the key:

### Step 1: Generate New Key
1. Google Cloud Console → API Credentials
2. Create new API key
3. Set same HTTP referrer restrictions (both domains)

### Step 2: Update Vercel (Both Projects)
```bash
# Update GetTheWashingOut
vercel env rm GEMINI_API_KEY production --yes
vercel env add GEMINI_API_KEY production
# Paste new key

# Update GetTheWoodburnerOn
vercel env rm GEMINI_API_KEY production --yes
vercel env add GEMINI_API_KEY production
# Paste same key
```

### Step 3: Redeploy Both Apps
```bash
# Redeploy GetTheWashingOut
cd ../GetTheWashingOut
vercel --prod

# Redeploy GetTheWoodburnerOn
cd ../GetTheWoodburnerOn
vercel --prod
```

### Step 4: Revoke Old Key
1. Google Cloud Console → API Credentials
2. Delete old key

---

## Architecture Comparison

### GetTheWashingOut (Before Refactor)
```
Browser → Client-side JavaScript → [API_KEY_IN_BUNDLE] → Gemini API
          ❌ Key exposed to users
```

### GetTheWoodburnerOn (After Refactor)
```
Browser → /api/gemini (Serverless) → Gemini API
                    ↑
            [API_KEY_ON_SERVER]
            ✅ Key never exposed
```

**Recommendation:** You should also refactor GetTheWashingOut to use the same serverless proxy architecture for better security!

---

## Benefits of Shared Key

### Management
- ✅ One key to secure (not two)
- ✅ One rotation process
- ✅ Single point of monitoring

### Cost Control
- ✅ Combined quota limit ($10/day for both apps)
- ✅ Easier budget tracking
- ✅ Single alert for both apps

### Security
- ✅ HTTP referrer restrictions protect both apps
- ✅ Quota limits prevent abuse across both apps
- ✅ Simplified audit trail

---

## Troubleshooting

### Issue: "Configuration error" in GetTheWoodburnerOn

**Check:**
1. Vercel env var is named `GEMINI_API_KEY` (NOT `VITE_GEMINI_API_KEY`)
2. Key is set for all environments (Production, Preview, Development)
3. Key has no extra spaces or quotes

**Fix:**
```bash
vercel env ls
# Verify GEMINI_API_KEY exists

# If missing, add it:
vercel env add GEMINI_API_KEY production
```

### Issue: "Rate limit exceeded" on both apps

**Cause:** Combined usage from both apps hitting rate limit

**Fix:**
```typescript
// In api/gemini.ts, increase limit:
const MAX_REQUESTS_PER_MINUTE = 30; // Increased from 20
```

### Issue: Quota exceeded earlier than expected

**Cause:** Combined usage from both apps

**Solution:**
1. Monitor usage split between apps in Google Cloud Console
2. Increase quota limit: $15/day (if needed)
3. Implement caching to reduce API calls (see optimization guide)

---

## Next Steps for GetTheWashingOut

**Recommendation:** Upgrade GetTheWashingOut to the same secure architecture

You can copy the refactored code from GetTheWoodburnerOn:
- `api/gemini.ts` → Serverless proxy
- `vercel.json` → Security headers
- Updated `geminiService.ts` → Proxy calls

**Benefits:**
- ✅ Same security improvements
- ✅ Both apps using same architecture
- ✅ Easier maintenance (identical setup)
- ✅ API key protected in both apps

---

## Quick Reference Commands

### Check API key in Vercel
```bash
# GetTheWashingOut
cd ../GetTheWashingOut
vercel env ls

# GetTheWoodburnerOn
cd ../GetTheWoodburnerOn
vercel env ls
```

### Update API key in both projects
```bash
# Set new key in both
vercel env add GEMINI_API_KEY production
# Paste key when prompted
# Repeat for preview and development if needed
```

### View Google Cloud usage
```bash
# Open in browser
open https://console.cloud.google.com/apis/dashboard
```

### Test both apps
```bash
# GetTheWashingOut
curl https://getthewashingout.vercel.app

# GetTheWoodburnerOn
curl https://getthewoodburneron.vercel.app
```

---

## Support

- **Security Questions:** See `SECURITY-ROTATE-KEYS.md`
- **Deployment Help:** See `VERCEL-DEPLOYMENT-GUIDE.md`
- **Google Cloud Console:** https://console.cloud.google.com
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**Last Updated:** 2025-11-02
**Applies To:** GetTheWashingOut + GetTheWoodburnerOn
**Status:** ✅ Ready for shared key setup
