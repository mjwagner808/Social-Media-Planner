# Client Portal - Anonymous Access Deployment Guide

## ✅ What Was Built

A **truly anonymous** client portal that works without requiring Google accounts!

### Solution Overview

**Architecture:**
1. **Apps Script API** - Returns JSON data (deployed with "Anyone with Google account")
2. **Standalone HTML Page** - Hosted externally (GitHub Pages, Netlify, etc.)
3. **Token-Based Security** - Same secure authentication system

**How It Works:**
- Client visits: `https://yoursite.github.io/client-portal?token=ABC123`
- HTML page calls Apps Script API to get data
- Calendar renders with their posts
- **No Google login required!** ✅

---

## 📋 Deployment Steps

### Step 1: Deploy Apps Script with New API Endpoint

1. **Open Apps Script Editor:**
   ```bash
   clasp open-script
   ```
   Or visit: https://script.google.com/d/17T_4SSW8OD_1rU7HOgpIyN4THgJxLsFGOhvfnO24iQ5l_-NgvJ4iGCGg/edit

2. **Create New Deployment:**
   - Click **Deploy** → **New deployment**
   - Select type: **Web app**
   - Description: `Client Portal API v1.0`
   - Execute as: **Me** (your email)
   - Who has access: **Anyone with Google account**
   - Click **Deploy**

3. **Copy the Web App URL:**
   - It will look like: `https://script.google.com/macros/s/AKfycby.../exec`
   - **SAVE THIS URL** - you'll need it in Step 2

   OR if you already have a deployment:
   - Click **Deploy** → **Manage deployments**
   - Click pencil icon ✏️ to edit
   - Click **Version** → **New version**
   - Description: `Client Portal API v1.0`
   - Click **Deploy**
   - Copy the URL

---

### Step 2: Update the HTML File with Your URL

1. **Open the file:** `client-portal-standalone.html`

2. **Find this line** (around line 341):
   ```javascript
   const API_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
   ```

3. **Replace with your actual URL:**
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
   ```

4. **Save the file**

---

### Step 3: Host the HTML File (FREE Options)

You have several **free** options. Choose one:

#### **Option A: GitHub Pages** (Recommended - Easiest)

1. **Create a new GitHub repository** (or use existing one):
   - Go to https://github.com/new
   - Name: `client-portal` (or any name)
   - Public or Private (both work)
   - Create repository

2. **Upload the HTML file:**
   - Click "Add file" → "Upload files"
   - Upload `client-portal-standalone.html`
   - Rename it to `index.html` (important!)
   - Commit changes

3. **Enable GitHub Pages:**
   - Go to repository **Settings**
   - Scroll to **Pages** section
   - Source: Deploy from a branch
   - Branch: `main` / `root`
   - Click **Save**

4. **Get your URL:**
   - After a minute, your site will be live at:
   - `https://yourusername.github.io/client-portal/`

5. **Client access URL format:**
   - `https://yourusername.github.io/client-portal/?token=ABC123`

#### **Option B: Netlify** (Alternative)

1. Go to https://app.netlify.com/drop
2. Drag and drop `client-portal-standalone.html` (renamed to `index.html`)
3. Get your URL: `https://random-name-12345.netlify.app/`
4. Client URL: `https://random-name-12345.netlify.app/?token=ABC123`

#### **Option C: Vercel** (Alternative)

1. Go to https://vercel.com/new
2. Upload `client-portal-standalone.html` (renamed to `index.html`)
3. Get your URL: `https://project-name.vercel.app/`
4. Client URL: `https://project-name.vercel.app/?token=ABC123`

---

### Step 4: Generate Access Token for Client

Use the existing `grantClientAccess()` function:

1. **Open Apps Script editor**

2. **Run this code** in the script editor (or create a helper function):
   ```javascript
   function createAccessForAlohaAina() {
     var result = grantClientAccess('CLT-001', 'Aloha_Aina@icloud.com', 'Full');
     Logger.log('Token: ' + result.token);
     Logger.log('URL: ' + result.url);
   }
   ```

3. **Update the URL** in the logged result to use your GitHub Pages URL:
   - Instead of: `https://script.google.com/...?page=client&token=ABC123`
   - Use: `https://yourusername.github.io/client-portal/?token=ABC123`

4. **Send this URL to the client via email**

---

## 🧪 Testing

### Test with Your Personal Email

1. **Generate a test token:**
   ```javascript
   function testToken() {
     var result = grantClientAccess('CLT-001', 'Aloha_Aina@icloud.com', 'Full');
     Logger.log(result.token);
   }
   ```

2. **Visit the URL:**
   - `https://yourusername.github.io/client-portal/?token=THE_TOKEN_FROM_ABOVE`

3. **Expected result:**
   - ✅ No Google login prompt
   - ✅ Welcome message with client name
   - ✅ Calendar with posts
   - ✅ Status filters work

### What to Check

- [ ] Page loads without login
- [ ] Client name displays correctly
- [ ] Posts appear on calendar
- [ ] Month navigation works
- [ ] Status filters work
- [ ] Mobile responsive

---

## 🔐 Security Notes

**How is this secure without Google login?**

1. **Token-based authentication:**
   - Each client gets a unique 32-character random token
   - Token is stored in `Authorized_Clients` sheet
   - Token is validated server-side before returning data

2. **What the client sees:**
   - Only posts for their Client_ID
   - No access to other clients' data
   - No access to internal notes or sensitive fields

3. **Token management:**
   - Tokens can be revoked using `revokeClientAccess()`
   - Tokens can have expiration dates
   - Last login is tracked

4. **Apps Script protection:**
   - API still runs as YOU (Execute as: Me)
   - But no user login required for the HTML page
   - Data filtered by validated token

---

## 📧 Email Template for Clients

```
Subject: Access Your Social Media Content Calendar

Hi [Client Name],

You can now review and approve your upcoming social media posts online!

Access your content calendar here:
https://yourusername.github.io/client-portal/?token=ABC123XYZ

Features:
✅ View all scheduled posts
✅ Filter by status (Needs Review, Approved, etc.)
✅ Navigate by month
✅ No login required - just bookmark this link

Please keep this link private as it's unique to your account.

Questions? Just reply to this email.

Best regards,
[Your Name]
```

---

## 🐛 Troubleshooting

### "Failed to load data"
- Check that API_URL in HTML file is correct
- Check Apps Script deployment is active
- Check browser console (F12) for errors

### "Invalid or expired access token"
- Verify token is in `Authorized_Clients` sheet
- Check Status = 'Active'
- Check Client_ID matches

### Calendar is blank
- Check that posts exist for this client
- Check Scheduled_Date is set
- Try different month with posts

### CORS errors
- Apps Script should automatically handle CORS
- If issues persist, check deployment settings

---

## ✨ Advantages of This Solution

✅ **No Google Account Required** - Works with any email
✅ **Free Hosting** - GitHub Pages, Netlify, Vercel all free
✅ **Fast** - Hosted on CDN, loads quickly
✅ **Secure** - Token-based auth, server-side validation
✅ **Simple** - Single HTML file, no build process
✅ **Maintainable** - All logic still in Apps Script
✅ **Mobile Friendly** - Responsive design

---

## 🔄 Updating the Portal

**To update the HTML:**
1. Edit `client-portal-standalone.html`
2. Upload to GitHub (commit changes)
3. Changes go live immediately

**To update the API:**
1. Edit Apps Script files
2. Run `clasp push`
3. Deploy new version in Apps Script UI

---

## 📊 Current Status

- ✅ API endpoint added to Code.js
- ✅ Standalone HTML created
- ✅ Code pushed to Apps Script
- ⏳ Awaiting deployment
- ⏳ Awaiting HTML hosting
- ⏳ Awaiting testing

---

## Next Steps

1. Deploy new Apps Script version → Get URL
2. Update HTML file with URL
3. Host HTML on GitHub Pages
4. Generate token for `Aloha_Aina@icloud.com`
5. Test access without Google login
6. Send link to client

---

**You now have a professional, secure, anonymous client portal!** 🎉
