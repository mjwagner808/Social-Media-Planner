# Client Portal Testing Guide

## ✅ Implementation Complete!

All UI enhancements have been implemented and pushed to Apps Script. Here's your complete testing guide.

---

## 📋 Pre-Testing Checklist

### 1. Deploy New Version

1. Open Apps Script editor:
   ```
   https://script.google.com/d/17T_4SSW8OD_1rU7HOgpIyN4THgJxLsFGOhvfnO24iQ5l_-NgvJ4iGCGg/edit
   ```

2. **Deploy new version:**
   - Click **Deploy** → **Manage deployments**
   - Click pencil icon ✏️ next to active deployment
   - **CRITICAL:** Under "Execute as" select **"User accessing the web app"** (NOT "Me")
   - **CRITICAL:** Under "Who has access" select **"Anyone"**
   - **Version** → **New version**
   - Description: `Version 102 - Fix deployment permissions + Client Portal UI`
   - Click **Deploy**
   - **IMPORTANT:** Copy the web app URL (you'll need it)

3. **Verify deployment:**
   - **CRITICAL:** You MUST be signed in to your **FINN Google account** (mj.wagner@finnpartners.com) to access the web app
   - Open web app in **new incognito window** (but sign in first!)
   - This avoids caching issues AND disables browser extensions that may interfere
   - **If still not loading:** Disable browser extensions (especially dev tools or content blockers)

---

## 🧪 Complete End-to-End Test

### Test Scenario: Agency User Workflow

**Agency User:** mj.wagner@finnpartners.com
**Client Email:** meijeanne@yahoo.com (non-Google account)

---

### STEP 1: Create New Post

1. **Open the main app** in incognito window
2. **Click "New Post" button**
3. **Fill out the form:**
   - **Client:** Select Aloha Aina (CLT-001) or any client
   - **Post Title:** "Test Post for Client Approval Workflow"
   - **Post Copy:** "This is a test post to validate the complete client approval workflow"
   - **Scheduled Date:** Tomorrow's date
   - **Platforms:** Select at least one (e.g., Instagram)
   - **Internal Approvers:** mj.wagner@finnpartners.com
   - **Client Approvers:** meijeanne@yahoo.com
   - **Submit for Review:** ✅ Check this box

4. **Click "Create Post"**

**Expected Result:**
- ✅ Post created successfully
- ✅ Post appears on calendar in **yellow/orange** (Internal_Review status)
- ✅ Approval badge shows "1" pending approval

**📸 Screenshot Checkpoint:** Calendar with new yellow post

---

### STEP 2: Internal Approval

1. **Click the approval badge** (shows pending count)
2. **Find your test post** in the approval dashboard
3. **Click "Approve"**
4. **Enter approval comments** (optional)
5. **Submit approval**

**Expected Result:**
- ✅ Post status still **Internal_Review** (yellow) - waiting for client submission
- ✅ Approval badge count decreases

**📸 Screenshot Checkpoint:** Approval submitted confirmation

---

### STEP 3: Submit for Client Review (NEW FEATURE!)

1. **On the calendar, click the test post**
2. **Post detail modal opens**
3. **Check the footer buttons:**
   - Should see "📤 Submit for Client Review" button
   - Should see "Approve" button
   - Should see "Request Changes" button

4. **Click "📤 Submit for Client Review"**
5. **Confirm the dialog**

**Expected Result:**
- ✅ Success message: "Post submitted for client review! Approver count: 1"
- ✅ Modal closes and reopens automatically
- ✅ Post status changes to **Client_Review** (red on calendar)
- ✅ **New "Client Portal Access" section appears** (blue background)

**📸 Screenshot Checkpoint:** Post detail modal showing Client Portal Access section

---

### STEP 4: Generate Client Access Token (NEW FEATURE!)

**In the same post detail modal:**

1. **Verify Client Portal Access section shows:**
   - "⚠️ Client doesn't have portal access yet"
   - "Generate Access Token" button

2. **Click "Generate Access Token"**
3. **Confirm the dialog**

**Expected Result:**
- ✅ Alert: "Client access granted! Token: XXXXX..."
- ✅ Section updates to show:
   - "✅ Client has portal access"
   - "Last login: Never"
   - **Portal URL in copyable input field**
   - "📋 Copy" button
   - "📧 Email Link to Client" button
   - "🔒 Revoke Access" button

**📸 Screenshot Checkpoint:** Client Portal Access section with URL

---

### STEP 5: Copy Portal URL (NEW FEATURE!)

1. **Click "📋 Copy" button** next to portal URL
2. **Verify button changes to "✅ Copied!"**
3. **Paste the URL somewhere** to verify it copied

**Expected Portal URL Format:**
```
https://mjwagner808.github.io/Social-Media-Planner/client-portal.html?token=XXXXX...
```

**📸 Screenshot Checkpoint:** URL copied to clipboard

---

### STEP 6: Email Template (NEW FEATURE!)

1. **Click "📧 Email Link to Client" button**
2. **Confirm the dialog**

**Expected Result:**
- ✅ Alert: "Email template copied to clipboard!"
- ✅ Shows client email: "Paste into your email client and send to: meijeanne@yahoo.com"

3. **Paste the template** into a notepad/email client

**Verify email template contains:**
- Subject line
- Portal URL with token
- Instructions for client
- Feature list
- Professional signature

**📸 Screenshot Checkpoint:** Email template pasted

---

### STEP 7: Client Approval (CLIENT SIDE)

**Now switch to CLIENT perspective:**

1. **Open a NEW incognito window** (client browser)
2. **Paste the portal URL** you copied earlier
3. **Press Enter**

**Expected Result:**
- ✅ **NO Google login required!**
- ✅ Page loads showing: "Aloha Aina's Content Calendar" (or client name)
- ✅ Calendar shows posts for this client only
- ✅ Your test post appears on the calendar in **red** (Client_Review status)

**📸 Screenshot Checkpoint:** Client portal calendar view

4. **Click on the test post**
5. **Post detail modal opens showing:**
   - Post title, copy, scheduled date
   - Platform details
   - **Approve button**
   - **Request Changes button**
   - **Add Comment button**

6. **Choose ONE action to test:**

#### Option A: Approve the Post

1. **Click "Approve" button**
2. **Enter feedback** (optional): "Looks great! Approved."
3. **Submit**

**Expected Result:**
- ✅ Success message: "Post approved successfully"
- ✅ Post **disappears from calendar** (no longer pending client review)

**Go back to AGENCY browser:**
- ✅ Post status changed to **Approved** (green on calendar)
- ✅ Refresh calendar to see color change

#### Option B: Request Changes

1. **Click "Request Changes" button**
2. **Enter feedback** (required): "Please update the hashtags"
3. **Submit**

**Expected Result:**
- ✅ Success message with feedback
- ✅ Post **disappears from calendar** (returned to draft)

**Go back to AGENCY browser:**
- ✅ Post status changed to **Draft** (gray on calendar)
- ✅ Comments visible in post detail
- ✅ Refresh calendar to see color change

**📸 Screenshot Checkpoint:**
- Client side: Success message
- Agency side: Updated post status

---

### STEP 8: Verify Data Integrity

**Open Google Sheets - Check all tabs:**

1. **Posts Sheet:**
   - ✅ Test post exists
   - ✅ Status = "Approved" or "Draft" (depending on client action)
   - ✅ Client_Approvers = "meijeanne@yahoo.com"

2. **Post_Approvals Sheet:**
   - ✅ Internal approval record exists (Approved)
   - ✅ Client approval record exists
   - ✅ Client approval shows:
     - Approver_Email = "meijeanne@yahoo.com" (actual client email)
     - Approval_Status = "Approved" or "Changes_Requested"
     - Decision_Date = timestamp
     - Decision_Notes = client feedback

3. **Authorized_Clients Sheet:**
   - ✅ New row for CLT-001
   - ✅ Email = "meijeanne@yahoo.com"
   - ✅ Access_Token = 32-character string
   - ✅ Status = "Active"
   - ✅ Last_Login_Date = timestamp

4. **Comments Sheet:**
   - ✅ New comment from client (if they added feedback)
   - ✅ Comment_Type = "Client_Approval" or "Client_Changes"
   - ✅ Comment_Date = timestamp

**📸 Screenshot Checkpoint:** Each sheet tab showing correct data

---

### STEP 9: Test Revoke Access (Optional)

**Back in the AGENCY browser:**

1. **Click the test post again**
2. **In Client Portal Access section**
3. **Click "🔒 Revoke Access" button**
4. **Confirm the warning dialog**

**Expected Result:**
- ✅ Alert: "Client access revoked"
- ✅ Section shows "⚠️ Client doesn't have portal access yet"
- ✅ "Generate Access Token" button reappears

**Test revocation:**
- Go to CLIENT browser
- **Refresh the portal page**
- ✅ Should show error: "Invalid or expired access token"

**📸 Screenshot Checkpoint:** Access revoked confirmation

---

## 🐛 Common Issues & Solutions

### Issue: "Access Error - Access denied. Please use a valid access link or sign in."

**Cause:** Deployment permissions are set incorrectly.

**Solution:**
1. In Apps Script: **Deploy** → **Manage deployments**
2. Click pencil icon ✏️ next to active deployment
3. **CRITICAL:** Change "Execute as" to **"User accessing the web app"** (NOT "Me")
4. **CRITICAL:** Change "Who has access" to **"Anyone"**
5. Deploy new version
6. Access the NEW web app URL (it will change after redeployment)

**Why this matters:**
- `Execute as: Me` = Runs as you (deployer), requires explicit permission for each user
- `Execute as: User accessing` = Runs as the logged-in user, works for anyone with a Google account

---

### Issue: Calendar stuck on "Loading your content calendar..." for 5+ minutes

**This is a critical loading failure - the backend is not responding.**

**Immediate Diagnostic Steps:**

1. **Open Browser Console (F12)**:
   - Look for JavaScript errors in red
   - Check if you see `console.log` messages like "Loaded posts:" or errors
   - Take a screenshot of the console output

2. **Check Apps Script Execution Logs**:
   - Go to: `https://script.google.com/d/17T_4SSW8OD_1rU7HOgpIyN4THgJxLsFGOhvfnO24iQ5l_-NgvJ4iGCGg/edit`
   - Click **View** → **Execution log** or **View** → **Logs**
   - Look for errors when loading the web app
   - Check if `getAllPostsWithImages()` or `getAllClients()` is failing

3. **Test Backend Functions Directly**:
   - In Apps Script editor, open **Code.js**
   - Add this test function at the bottom:
   ```javascript
   function TEST_LOAD_DATA() {
     Logger.log('=== TESTING DATA LOAD ===');

     try {
       Logger.log('1. Testing getAllPostsWithImages()...');
       var posts = getAllPostsWithImages();
       Logger.log('Posts loaded: ' + (Array.isArray(posts) ? posts.length : 'ERROR'));

       Logger.log('2. Testing getAllClients()...');
       var clients = getAllClients();
       Logger.log('Clients loaded: ' + (Array.isArray(clients) ? clients.length : 'ERROR'));

       Logger.log('✅ Both functions work!');
     } catch (e) {
       Logger.log('❌ ERROR: ' + e.message);
       Logger.log(e.stack);
     }
   }
   ```
   - Run `TEST_LOAD_DATA()` function
   - Check execution log for results

4. **Check Spreadsheet Permissions**:
   - Open the spreadsheet: `https://docs.google.com/spreadsheets/d/1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss`
   - Verify you have edit access
   - Check that Posts, Clients, Post_Platforms sheets exist

5. **Verify Deployment**:
   - In Apps Script: **Deploy** → **Manage deployments**
   - Check that the active deployment shows the correct version
   - Copy the web app URL and ensure it matches what you're accessing
   - Try accessing the web app URL directly (not through a bookmark)

6. **Clear Cache and Retry**:
   - Close incognito window completely
   - Open NEW incognito window
   - Sign in to FINN Google account
   - Access the web app URL directly

**Most Likely Causes:**
- **Browser extension conflict** (see error: `web-client-content-script.js`) - USE INCOGNITO MODE
- Backend function error (check execution logs)
- Spreadsheet access denied (check permissions)
- Wrong Google account signed in (must be mj.wagner@finnpartners.com)
- Deployment issue (old version deployed or deployment URL changed)
- Script timeout (too much data, >30 second limit)

**If you see error "Uncaught SyntaxError" in console:**
This is caused by a browser extension injecting code. Solutions:
1. **Use incognito mode** (disables most extensions automatically)
2. **Disable extensions** one by one to find the culprit
3. Common culprits: developer tools extensions, content blockers, script injectors

**Report Back With:**
- Browser console errors (screenshot)
- Apps Script execution log (screenshot)
- Result of TEST_LOAD_DATA() function
- Spreadsheet permissions status

---

### Issue: "Submit for Client Review" button doesn't appear

**Cause:** Post not in Internal_Review status or internal approvals not complete

**Solution:**
1. Check post status in Posts sheet
2. Check Post_Approvals sheet - all internal approvals must be "Approved"
3. Run `DIAGNOSE_POST_STATUS('POST-XXX')` in Apps Script

---

### Issue: Client Portal Access section doesn't show

**Cause:** Post not in Client_Review status

**Solution:**
1. Post must be in "Client_Review" status
2. The section only appears for Client_Review posts (by design)

---

### Issue: "Generate Access Token" fails

**Cause:** No client approver email on the post

**Solution:**
1. Edit the post
2. Add client approver email in "Client Approvers" field
3. Try again

---

### Issue: Portal URL doesn't work

**Possible causes:**
- Token invalid/revoked
- Client portal not deployed to GitHub Pages
- CORS issues

**Solution:**
1. Check Authorized_Clients sheet - Status should be "Active"
2. Verify GitHub Pages URL: https://mjwagner808.github.io/Social-Media-Planner/client-portal.html
3. Test in incognito window
4. Check browser console (F12) for errors

---

### Issue: Calendar doesn't update after client action

**Cause:** Browser cache

**Solution:**
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Close and reopen in new incognito window
3. Check Posts sheet directly - status should be updated

---

## ✅ Success Criteria

**The system is working correctly if:**

1. ✅ "Submit for Client Review" button appears for Internal_Review posts
2. ✅ Client Portal Access section appears for Client_Review posts
3. ✅ Token can be generated with one click
4. ✅ Portal URL can be copied easily
5. ✅ Email template generates correctly
6. ✅ Client can access portal without Google login
7. ✅ Client can approve/reject posts
8. ✅ Post status updates correctly in main app
9. ✅ All data saves to correct sheets
10. ✅ Approver email records actual client email (not generic)
11. ✅ Access can be revoked and re-granted
12. ✅ Calendar colors update immediately after status changes

---

## 📊 Test Results Tracking

| Test Step | Status | Notes | Screenshot |
|-----------|--------|-------|------------|
| 1. Create Post | ⬜ | | |
| 2. Internal Approval | ⬜ | | |
| 3. Submit for Client Review | ⬜ | | |
| 4. Generate Token | ⬜ | | |
| 5. Copy Portal URL | ⬜ | | |
| 6. Email Template | ⬜ | | |
| 7. Client Approval | ⬜ | | |
| 8. Data Integrity | ⬜ | | |
| 9. Revoke Access | ⬜ | | |

**Legend:**
- ⬜ Not tested
- ✅ Passed
- ❌ Failed
- ⚠️ Partial/Issues

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ System is production-ready
2. ✅ Can be used with real clients
3. ✅ Send portal links to actual clients

If issues found:
1. Document the issue with screenshots
2. Check execution logs in Apps Script
3. Run diagnostic functions (`DIAGNOSE_POST_STATUS`, `AUDIT_CLIENT_TOKENS`)
4. Report issues for troubleshooting

---

## 📞 Need Help?

**Diagnostic Functions Available:**
- `DIAGNOSE_POST_STATUS('POST-XXX')` - Check approval workflow state
- `AUDIT_CLIENT_TOKENS()` - View all client access tokens
- `generateTestToken()` - Quick token generation for testing
- `FIX_CLIENT_REVIEW_POSTS()` - Fix posts missing approval records

**Check these logs:**
- Apps Script Execution Log
- Browser Console (F12)
- Google Sheets (Posts, Post_Approvals, Authorized_Clients)

---

**Ready to test? Follow the steps above and check off each item!** 🚀
