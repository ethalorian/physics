# Google Service Account Setup for Production

## ✅ Local Setup Complete
Your service account is now stored as an environment variable in `.env.local`.
The original `service-account-key.json` file has been:
- Backed up to: `~/secure-keys-backup/`
- Removed from the project directory
- Converted to environment variable: `GOOGLE_SERVICE_ACCOUNT_KEY`

## 🚀 Production Deployment

### For Vercel

1. Go to your project settings in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - **Name:** `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value:** Copy the entire value from your `.env.local` file (including the quotes)
   - **Environment:** Production (and Preview if needed)
4. Click Save
5. Redeploy your application

### For Other Platforms

#### Heroku
```bash
heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY='<paste-json-here>'
```

#### Netlify
1. Site settings → Environment variables
2. Add `GOOGLE_SERVICE_ACCOUNT_KEY` with the JSON value

#### AWS/Docker
Add to your environment configuration or secrets manager

## 📋 Getting the Value

To get the value for production, run this locally:
```bash
grep "^GOOGLE_SERVICE_ACCOUNT_KEY=" .env.local | cut -d= -f2-
```
This will output the full JSON string with quotes that you need to copy.

## 🔒 Security Notes

1. **Never commit** the service account key to git
2. **Use environment variables** in all deployed environments
3. **Rotate keys** if you suspect they've been exposed
4. **Limit permissions** - only enable APIs you actually use:
   - Google Classroom API (if using roster sync)
   - RISC API (if using cross-account protection)

## 🧪 Testing in Production

After deployment, verify Google integrations work:
1. Test Google Classroom connection (if using)
2. Check RISC webhook endpoints (if configured)
3. Monitor logs for any authentication errors

## 🔑 If You Need the Original File

Your original service account file is backed up at:
```
~/secure-keys-backup/service-account-key-backup-[date].json
```

## ⚠️ Troubleshooting

If Google features aren't working after deployment:

1. **Check the environment variable is set:**
   - Most platforms show if env vars are configured (not the values)
   
2. **Verify the JSON is valid:**
   - Make sure quotes are properly escaped
   - No line breaks in the middle of the JSON
   
3. **Check API permissions:**
   - Ensure required Google APIs are enabled in Google Cloud Console
   - Verify service account has necessary roles

4. **Review logs:**
   - Look for "Service account key not found" errors
   - Check for JSON parsing errors

## 📝 What Changed in Your Code

Nothing! Your code already supports both:
- File-based: `service-account-key.json` (old method)
- Environment variable: `GOOGLE_SERVICE_ACCOUNT_KEY` (new method ✅)

The app will automatically use the environment variable when available.
