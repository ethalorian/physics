# 🔧 Google Classroom Authentication Fix

## What Was Wrong

Your OAuth token only had basic scopes (`email`, `profile`) but Google Classroom requires additional API scopes to access courses and rosters.

---

## ✅ What I Fixed

### **Updated Scopes in `src/lib/auth.ts`:**

**Before:**
```typescript
scope: "openid email profile"
```

**After:**
```typescript
scope: [
  "openid",
  "email", 
  "profile",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students",
  "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
].join(" ")
```

### **Added Access Token Storage:**
Now the session includes the Google access token so it can be used for API calls.

---

## 🚀 How to Apply the Fix

### **Step 1: Sign Out**

You MUST sign out and sign back in to get a new token with the updated scopes.

1. Go to your app
2. Click your profile/sign out button
3. Sign out completely

### **Step 2: Sign Back In**

1. Sign in again with Google
2. You'll see a new OAuth consent screen
3. It will now ask for **additional permissions:**
   - ✅ View your email and profile (same as before)
   - ✅ **View your Google Classroom courses** (NEW!)
   - ✅ **View your class rosters** (NEW!)
   - ✅ **Manage coursework and submissions** (NEW!)

4. Click "Allow" to grant these permissions

### **Step 3: Test Google Classroom**

1. Go to Admin Dashboard
2. Try connecting to Google Classroom again
3. It should now work! ✅

---

## 🔍 Verify It Worked

After signing back in, open browser console and run:

```javascript
// Check if you have an access token
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    console.log('Access token exists:', !!session.accessToken)
    console.log('User:', session.user)
  })
```

You should see: `Access token exists: true`

---

## 🎯 What Each Scope Does

**Required for Google Classroom:**

| Scope | What It Allows |
|-------|---------------|
| `classroom.courses.readonly` | View your Google Classroom courses |
| `classroom.rosters.readonly` | View student and teacher lists |
| `classroom.coursework.students` | Create and manage assignments |
| `classroom.student-submissions.students.readonly` | View student work |

---

## ⚠️ Important Notes

### **Must Sign Out/In**
- Simply refreshing won't work
- You MUST sign out and back in
- This gets a new token with updated scopes

### **OAuth Consent**
- You'll see the new permission requests
- This is normal and expected
- Click "Allow" to proceed

### **Development vs Production**
- In development: May need to re-approve scopes
- In production: Users see this once

---

## 🐛 Still Getting Errors?

### **Error: "Access token missing"**
- Sign out completely
- Clear browser cookies
- Sign back in

### **Error: "Insufficient scopes" (still)**
- Check `.env.local` has correct Google Client ID/Secret
- Verify OAuth consent screen in Google Cloud Console
- Make sure scopes are enabled in your Google Cloud project

### **Error: "Invalid client"**
- Check your Google Cloud Console OAuth credentials
- Verify redirect URIs include your app URL
- Make sure OAuth consent screen is configured

---

## 🔧 Google Cloud Console Setup

If you still have issues, verify in Google Cloud Console:

1. **Go to:** https://console.cloud.google.com
2. **Navigate to:** APIs & Services → Credentials
3. **Find your OAuth Client**
4. **Check Authorized redirect URIs include:**
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3001/api/auth/callback/google` (your current port)
   - Your production URL

5. **Go to:** APIs & Services → Library
6. **Enable these APIs:**
   - ✅ Google Classroom API
   - ✅ Google People API

7. **Go to:** OAuth consent screen
8. **Verify scopes are listed** (they may not show until first use)

---

## ✅ Testing Checklist

After signing back in:

- [ ] Sign out of your app
- [ ] Sign back in with Google
- [ ] See new permission requests
- [ ] Click "Allow"
- [ ] Go to Admin Dashboard
- [ ] Try "Connect to Google Classroom"
- [ ] Should see your courses! ✅

---

## 📝 Summary

**Problem:** OAuth token lacked Google Classroom scopes  
**Solution:** Updated scopes + must re-authenticate  
**Action Required:** Sign out and sign back in  

**After this, Google Classroom integration will work!** 🎉

---

**Note:** Your dev server is now running on **port 3001** (http://localhost:3001)

