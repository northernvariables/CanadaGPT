# Production OAuth Setup Guide

Complete guide for enabling Google, GitHub, Facebook, and LinkedIn authentication on **https://canadagpt.ca**

## Current Configuration

- **Supabase Project**: `pbxyhcdzdovsdlsyixsk`
- **Production Domain**: `https://canadagpt.ca`
- **Supabase OAuth Callback**: `https://pbxyhcdzdovsdlsyixsk.supabase.co/auth/v1/callback`

## Quick Reference

All OAuth applications must use this redirect URL:
```
https://pbxyhcdzdovsdlsyixsk.supabase.co/auth/v1/callback
```

---

## 1. Google OAuth

### Create OAuth Application

1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Select project `canada-gpt-ca` (or create new)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**

### Configure OAuth Consent Screen (if not done)

1. **Application type**: External
2. **App name**: CanadaGPT
3. **User support email**: Your email
4. **App logo**: Upload Parliament Buildings image (optional)
5. **App domain**: `canadagpt.ca`
6. **Authorized domains**:
   - `canadagpt.ca`
   - `supabase.co`
7. **Developer contact**: Your email
8. **Scopes**:
   - `openid`
   - `email`
   - `profile`

### Create Web Client

1. **Application type**: Web application
2. **Name**: CanadaGPT Production
3. **Authorized JavaScript origins**:
   ```
   https://canadagpt.ca
   ```
4. **Authorized redirect URIs**:
   ```
   https://pbxyhcdzdovsdlsyixsk.supabase.co/auth/v1/callback
   ```
5. Click **Create** and save:
   - Client ID: `[SAVE THIS]`
   - Client Secret: `[SAVE THIS]`

### Add to Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/pbxyhcdzdovsdlsyixsk/auth/providers)
2. Find **Google** → Toggle ON
3. Paste credentials:
   - **Client ID**: Your Google Client ID
   - **Client Secret**: Your Google Client Secret
4. Click **Save**

---

## 2. GitHub OAuth

### Create OAuth Application

1. Visit [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in details:
   - **Application name**: CanadaGPT
   - **Homepage URL**: `https://canadagpt.ca`
   - **Application description**: Canadian Federal Parliamentary Data & AI Chat
   - **Authorization callback URL**: `https://pbxyhcdzdovsdlsyixsk.supabase.co/auth/v1/callback`
4. Click **Register application**

### Generate Credentials

1. Click **Generate a new client secret**
2. Save immediately (shown only once):
   - **Client ID**: `[visible at top]`
   - **Client Secret**: `[SAVE THIS NOW]`

### Add to Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/pbxyhcdzdovsdlsyixsk/auth/providers)
2. Find **GitHub** → Toggle ON
3. Paste credentials:
   - **Client ID**: Your GitHub Client ID
   - **Client Secret**: Your GitHub Client Secret
4. Click **Save**

---

## 3. Facebook OAuth

### Create Facebook App

1. Visit [Facebook Developers](https://developers.facebook.com/apps)
2. Click **Create App**
3. **Use case**: Authenticate and request data from users with Facebook Login
4. **App type**: Consumer
5. **App name**: CanadaGPT
6. **App contact email**: Your email

### Configure Facebook Login

1. In your app dashboard, click **Add Product**
2. Find **Facebook Login** → Click **Set Up**
3. Choose **Web** platform
4. **Site URL**: `https://canadagpt.ca`
5. Navigate to **Facebook Login** → **Settings**
6. Add to **Valid OAuth Redirect URIs**:
   ```
   https://pbxyhcdzdovsdlsyixsk.supabase.co/auth/v1/callback
   ```
7. Save changes

### Get Credentials

1. Navigate to **Settings** → **Basic**
2. Copy:
   - **App ID**: `[SAVE THIS]`
   - **App Secret**: Click **Show**, then `[SAVE THIS]`

### Add to Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/pbxyhcdzdovsdlsyixsk/auth/providers)
2. Find **Facebook** → Toggle ON
3. Paste credentials:
   - **Facebook Client ID**: Your Facebook App ID
   - **Facebook Client Secret**: Your Facebook App Secret
4. Click **Save**

### Make App Live (Important!)

1. In Facebook App Dashboard, go to **App Mode** (top right)
2. Switch from **Development** to **Live**
3. Complete any required verification steps

---

## 4. LinkedIn OAuth

### Create LinkedIn App

1. Visit [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **Create app**
3. Fill in details:
   - **App name**: CanadaGPT
   - **LinkedIn Page**: Your company page (or create one)
   - **App logo**: Upload Parliament Buildings image
   - **Legal agreement**: Check box
4. Click **Create app**

### Request OAuth Scopes

1. In your app, navigate to **Products** tab
2. Request access to **Sign In with LinkedIn using OpenID Connect**
3. Wait for approval (usually instant for basic scopes)

### Configure OAuth

1. Navigate to **Auth** tab
2. Add to **Authorized redirect URLs for your app**:
   ```
   https://pbxyhcdzdovsdlsyixsk.supabase.co/auth/v1/callback
   ```
3. Copy from **Application credentials**:
   - **Client ID**: `[SAVE THIS]`
   - **Client Secret**: Click **Show**, then `[SAVE THIS]`

### Add to Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/pbxyhcdzdovsdlsyixsk/auth/providers)
2. Find **LinkedIn (OIDC)** → Toggle ON
3. Paste credentials:
   - **Client ID**: Your LinkedIn Client ID
   - **Client Secret**: Your LinkedIn Client Secret
4. Click **Save**

---

## Verification Steps

After configuring all providers:

### 1. Test Each Provider Locally

```bash
cd packages/frontend
pnpm dev
```

Visit `http://localhost:3000/en/auth/login` and test each provider button.

### 2. Check Supabase Logs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/pbxyhcdzdovsdlsyixsk/auth/logs)
2. Monitor authentication attempts
3. Look for any errors or failed attempts

### 3. Test in Production

Once GitHub Actions deployment completes:

1. Visit `https://canadagpt.ca/en/auth/login`
2. Test each provider:
   - ✅ Google sign-in
   - ✅ GitHub sign-in
   - ✅ Facebook sign-in
   - ✅ LinkedIn sign-in
3. Verify redirect to `/en/dashboard` after successful login

---

## Troubleshooting

### "Redirect URI Mismatch" Error

**Cause**: OAuth provider has different redirect URL configured

**Fix**: Ensure this EXACT URL is configured in each provider:
```
https://pbxyhcdzdovsdlsyixsk.supabase.co/auth/v1/callback
```

### "Invalid Client" Error

**Cause**: Wrong Client ID or Client Secret

**Fix**:
1. Double-check credentials in provider console
2. Regenerate Client Secret if needed
3. Update in Supabase Dashboard

### Google "App Not Verified" Warning

**Cause**: OAuth consent screen not verified by Google

**Fix**:
- For testing: Add test users in OAuth consent screen
- For production: Submit app for verification (takes 1-2 weeks)
- Alternative: Users can click "Advanced" → "Go to CanadaGPT (unsafe)" during testing

### Facebook "App Not Live" Error

**Cause**: Facebook app still in Development mode

**Fix**: Switch app to Live mode in Facebook Developer Console

### LinkedIn "Product Access Denied"

**Cause**: Sign In with LinkedIn not approved for your app

**Fix**:
1. Request product access in LinkedIn app dashboard
2. Wait for approval (usually instant for basic auth)
3. If denied, contact LinkedIn developer support

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Use environment variables
   - Store in Supabase Dashboard only

2. **Restrict OAuth scopes**
   - Only request `email` and `profile` scopes
   - Don't request unnecessary permissions

3. **Monitor authentication logs**
   - Check Supabase auth logs regularly
   - Set up alerts for suspicious activity

4. **Rotate secrets periodically**
   - Regenerate OAuth secrets every 6-12 months
   - Update in Supabase immediately

---

## Quick Command Reference

### View current Supabase auth config
```bash
supabase dashboard --project-ref pbxyhcdzdovsdlsyixsk
```

### Test OAuth locally
```bash
cd packages/frontend
pnpm dev
# Visit http://localhost:3000/en/auth/login
```

### Check production OAuth
```bash
curl https://canadagpt.ca/en/auth/login
```

---

## Next Steps After Setup

1. ✅ Configure all 4 providers in Supabase
2. ✅ Test each provider locally
3. ✅ Deploy to production (GitHub Actions)
4. ✅ Test each provider in production
5. ✅ Submit Google app for verification (if needed)
6. ✅ Make Facebook app Live
7. ✅ Monitor authentication logs

---

**Last Updated**: 2025-11-08
**Supabase Project**: pbxyhcdzdovsdlsyixsk
**Production URL**: https://canadagpt.ca
