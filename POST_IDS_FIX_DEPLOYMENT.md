# Post_IDs Logic Bug Fix - Deployment Guide

## 🐛 Bug Fixed
**Problem:** When client admins assigned reviewers to specific posts, it broke their full access - they could only see that one post instead of all posts.

**Root Cause:** Empty `Post_IDs` meant "all posts", but populated `Post_IDs` meant "ONLY these posts" (restrictive instead of additive).

**Solution:** Added `Access_Type` field to separate "access level" (Full vs Restricted) from "post assignments" (tracking).

---

## 📋 Deployment Steps

### Step 1: Deploy New Code ✅ DONE
Code has been pushed with `clasp push`. Now deploy a new version:

1. Run `clasp open` or open Apps Script editor
2. **Deploy** → **Manage deployments**
3. Click pencil icon ✏️ next to active deployment
4. **Version** → **New version**
5. Description: `"Fix Post_IDs logic bug - Add Access_Type field"`
6. Click **Deploy**

### Step 2: Add Access_Type Column to Sheet (MANUAL)

1. Open spreadsheet: https://docs.google.com/spreadsheets/d/1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss

2. Navigate to **Authorized_Clients** sheet

3. Find the **Post_IDs** column (should be column H or I)

4. **Right-click the column to the RIGHT of Post_IDs** → **Insert 1 column right**

5. **Name the new column:** `Access_Type`

6. ✅ **Column added manually**

### Step 3: Run Migration Script

1. In Apps Script editor, open **MigrateAccessType.js**

2. **Select function:** `migrateAccessType` from dropdown

3. **Click Run ▶️**

4. **Check Execution Log** (View → Logs)
   - Should see: "✅ Migrated X records"
   - Shows breakdown of Full vs Restricted access

5. ✅ **Migration complete**

### Step 4: Verify Migration

1. In Apps Script editor, **select function:** `testAccessTypeMigration`

2. **Click Run ▶️**

3. **Check Execution Log**
   - Should see: "✅ ALL RECORDS HAVE ACCESS_TYPE"
   - Shows counts of Full vs Restricted

4. **Manually inspect** Authorized_Clients sheet:
   - Every row should have Access_Type value ("Full" or "Restricted")
   - **Full Access:** Should have empty Post_IDs OR Post_IDs = ""
   - **Restricted Access:** Should have Post_IDs with values

5. ✅ **Verification passed**

---

## 🧪 Testing

### Test 1: Full Access Reviewer (Most Common Case)

**Setup:**
1. Client admin adds a new reviewer via "Manage Reviewers"
2. System should create: `Access_Type = "Full"`, `Post_IDs = ""`

**Test:**
1. Client admin opens a post
2. Checks the reviewer in "Share with Reviewers" section
3. **Expected:** Reviewer still sees ALL posts (assignment is metadata only)
4. **Before fix:** Reviewer would only see that ONE post ❌
5. ✅ **After fix:** Reviewer sees ALL posts ✅

### Test 2: Restricted Access Reviewer (Edge Case)

**Setup:**
1. Manually change a reviewer to: `Access_Type = "Restricted"`, `Post_IDs = "POST-045"`
2. This is for users who should ONLY see specific posts

**Test:**
1. Verify reviewer only sees POST-045
2. Client admin assigns POST-046
3. **Expected:** Reviewer now sees POST-045 AND POST-046
4. ✅ **Should work correctly**

### Test 3: Client Admin (Always Full Access)

**Setup:**
1. Promote a reviewer to client admin via Admin Panel
2. System should set: `Access_Level = "Admin"`, `Access_Type = "Full"`, `Post_IDs = ""`

**Test:**
1. Verify client admin sees all posts
2. Verify "Manage Reviewers" button appears
3. ✅ **Should work correctly**

### Test 4: Backward Compatibility

**Setup:**
1. Existing reviewer with: `Access_Type = ""` (empty - old data)

**Test:**
1. Code should default to `Access_Type = "Full"` if missing
2. Verify they see all posts
3. ✅ **Migration script should have fixed this**

---

## 🔍 What Changed

### Files Modified:

1. **ClientAuthService.js**
   - `grantClientAccess()`: Added `accessType` parameter
   - `getClientPosts()`: Only filters Post_IDs if `Access_Type = "Restricted"`

2. **Code.js**
   - `addReviewerAsClientAdmin()`: Sets `Access_Type = "Full"` for new reviewers
   - `updatePostReviewersForAdmin()`: Skips Post_IDs update for Full access users

3. **UserManagementService.js**
   - `updateAuthorizedClient()`: Added `accessType` handling
   - `setAsClientAdmin()`: Sets `Access_Type = "Full"` for admins

4. **MigrateAccessType.js** (NEW)
   - Migration script to add column and populate data

### How It Works Now:

**Access_Type = "Full"** (Default for all reviewers)
- User sees ALL posts for their client
- Post_IDs field is metadata only (for workflow tracking, doesn't filter)
- Checking/unchecking in "Share with Reviewers" does NOT affect what they see

**Access_Type = "Restricted"** (Manual edge case)
- User sees ONLY posts in their Post_IDs list
- Checking/unchecking DOES add/remove posts from their access
- Use this for contractors or limited reviewers

---

## 🎯 Success Criteria

✅ **All existing reviewers migrated** (Access_Type populated)
✅ **Full access reviewers see all posts** (not broken by assignment)
✅ **Restricted access reviewers filtered correctly** (edge case)
✅ **Client admins can assign posts** (doesn't break access)
✅ **New reviewers get Full access** (default behavior)

---

## 🚨 Troubleshooting

### Issue: Migration script says "Access_Type column not found"
**Solution:** Did you add the column manually? Go back to Step 2.

### Issue: Some records still missing Access_Type
**Solution:** Run `migrateAccessType()` again. It's safe to run multiple times.

### Issue: Reviewer can't see any posts
**Check:**
1. Is their `Status = "Active"`?
2. Is their `Access_Type = "Full"` or "Restricted"?
3. If Restricted, do they have Post_IDs?
4. Are there posts in Client_Review+ status for that client?

### Issue: "Share with Reviewers" checkboxes don't work
**Check:**
1. Is the user a client admin (`Access_Level = "Admin"` AND `Access_Type = "Full"`)?
2. Are there any non-admin reviewers for that client?
3. Check browser console for JavaScript errors

---

## 📊 Migration Summary

**What the migration does:**
1. Adds `Access_Type` column after `Post_IDs`
2. For each existing record:
   - If `Post_IDs = ""` → Sets `Access_Type = "Full"`
   - If `Post_IDs = "POST-..."` → Sets `Access_Type = "Restricted"`
3. Logs results and counts

**Safe to run multiple times:** Yes, script checks if column exists and only updates empty Access_Type values.

---

## 📝 Next Steps After Deployment

1. ✅ Deploy new version
2. ✅ Add Access_Type column (manual)
3. ✅ Run migration script
4. ✅ Test with real user
5. Monitor for issues
6. Continue to Sprint 1 Task 2: Status Synchronization Fix
