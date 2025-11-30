# Production Deployment Checklist

**Version:** 2.1 (Sprint 1 & 2 + UX Polish Complete)
**Date:** November 30, 2025
**Status:** Ready for Production

---

## Pre-Deployment Verification

### ✅ Code Status
- [x] All code pushed to Apps Script (`clasp push` successful)
- [x] All changes committed to git repository
- [x] Session summary created ([SESSION_SUMMARY_2025-11-30.md](SESSION_SUMMARY_2025-11-30.md))
- [x] Test scripts removed (CheckAllColumns, DiagnoseApprovals, etc.)
- [x] Production utilities kept (DiagnoseStatusSync, MigrateAccessType)

### ✅ Database Changes Completed
- [x] **Authorized_Clients** sheet has `Access_Type` column
- [x] **Post_Platforms** sheet has `Status` column
- [x] **Post_Approvals** sheet has `Post_Status` column
- [x] Migration scripts run successfully:
  - [x] `migrateAccessType()` - Populated Access_Type for existing records
  - [x] `addStatusColumns()` - Added Status columns and populated data
  - [x] `testStatusSync()` - Verified sync working

### ✅ Documentation
- [x] [SESSION_SUMMARY_2025-11-30.md](SESSION_SUMMARY_2025-11-30.md) - Complete session overview
- [x] [POST_IDS_FIX_DEPLOYMENT.md](POST_IDS_FIX_DEPLOYMENT.md) - Access control fix guide
- [x] [STATUS_SYNC_FIX.md](STATUS_SYNC_FIX.md) - Status sync fix guide
- [x] [STRATEGIC_DEVELOPMENT_PLAN.md](STRATEGIC_DEVELOPMENT_PLAN.md) - Full roadmap
- [x] [CLAUDE.md](CLAUDE.md) - Project overview (existing)

---

## Deployment Steps

### Step 1: Apps Script Deployment

**Location:** https://script.google.com

1. **Open Apps Script Editor**
   - Navigate to: https://script.google.com
   - Open "Social Media Planner" project

2. **Create New Deployment Version**
   - Click **Deploy** (top right)
   - Select **Manage deployments**
   - Click the **pencil/edit icon** ✏️ next to the active deployment

3. **Configure New Version**
   - Under **Version**, select **New version**
   - **Description:**
     ```
     v2.1: Access control, status sync, admin-only delete, carousel detection,
     loading skeletons, client-side caching, manual refresh button
     ```
   - Click **Deploy**

4. **Copy Deployment URL**
   - Note the Web app URL (should remain the same)
   - Format: `https://script.google.com/macros/s/.../exec`

5. **Verify Deployment**
   - [ ] Deployment shows new version number
   - [ ] No errors during deployment
   - [ ] Web app URL accessible

**⏱️ Estimated Time:** 3-5 minutes

---

### Step 2: Post-Deployment Testing

**Test in NEW Incognito Window** to avoid cache issues.

#### Test 1: Access Control (Restricted vs Full)

**Agency Side:**
- [ ] Login as admin
- [ ] Open Admin Panel → Client Access tab
- [ ] Add new reviewer for a client
- [ ] **Verify:** Reviewer shows `Access_Type = "Restricted"` in spreadsheet
- [ ] **Verify:** Reviewer can't see any posts initially (empty Post_IDs)

**Client Admin Side:**
- [ ] Login to client portal as client admin
- [ ] Click "Manage Reviewers"
- [ ] Add a new reviewer
- [ ] **Verify:** New reviewer has `Access_Type = "Restricted"`
- [ ] Open a post
- [ ] Assign the new reviewer using "Assign Reviewers" dropdown
- [ ] **Verify:** Reviewer's Post_IDs field updated in spreadsheet

**Reviewer Side:**
- [ ] Login to client portal as restricted reviewer
- [ ] **Verify:** Only sees posts assigned to them (not all client posts)
- [ ] **Verify:** Can approve/reject assigned posts

**Client Admin Promotion:**
- [ ] As agency admin, promote reviewer to "Client Admin"
- [ ] **Verify:** `Access_Type` changes to "Full" in spreadsheet
- [ ] **Verify:** Client admin now sees all posts for their client

**⏱️ Estimated Time:** 10 minutes

---

#### Test 2: Status Synchronization

- [ ] Create a new post (Status = "Draft")
- [ ] Check spreadsheet:
  - [ ] **Posts** sheet: Status = "Draft"
  - [ ] **Post_Platforms** sheet: Status = "Draft"
  - [ ] **Post_Approvals** sheet: (no records yet - expected)

- [ ] Submit post for Internal Review
- [ ] Check spreadsheet:
  - [ ] **Posts** sheet: Status = "Internal_Review"
  - [ ] **Post_Platforms** sheet: Status = "Internal_Review"
  - [ ] **Post_Approvals** sheet: Post_Status = "Internal_Review"

- [ ] Approve post internally
- [ ] Submit for Client Review
- [ ] Check spreadsheet:
  - [ ] **Posts** sheet: Status = "Client_Review"
  - [ ] **Post_Platforms** sheet: Status = "Client_Review"
  - [ ] **Post_Approvals** sheet: New record with Post_Status = "Client_Review"

- [ ] Approve post from client portal
- [ ] Check spreadsheet:
  - [ ] **Posts** sheet: Status = "Approved"
  - [ ] **Post_Platforms** sheet: Status = "Approved"
  - [ ] **Post_Approvals** sheet: Post_Status = "Approved"

**⏱️ Estimated Time:** 5 minutes

---

#### Test 3: Permission Enforcement

**Non-Admin User:**
- [ ] Login as non-admin user (Creator role)
- [ ] Open any post detail
- [ ] **Verify:** Delete button is HIDDEN

**Admin User:**
- [ ] Login as admin user
- [ ] Open any post detail
- [ ] **Verify:** Delete button is VISIBLE
- [ ] Click delete button
- [ ] **Verify:** Post deleted successfully
- [ ] Check spreadsheet:
  - [ ] Post removed from **Posts** sheet
  - [ ] Platform entries removed from **Post_Platforms** sheet
  - [ ] Approval records removed from **Post_Approvals** sheet

**API Bypass Test (Optional - Advanced):**
- [ ] As non-admin, try calling `deletePost()` directly in browser console
- [ ] **Verify:** Error: "Permission denied: Only administrators can delete posts"

**⏱️ Estimated Time:** 5 minutes

---

#### Test 4: Carousel Detection

**Box Folder URL (Carousel):**
- [ ] Create post with platform using Box.com folder URL containing `/folder/`
- [ ] **Verify:** Carousel badge (📸) appears on calendar
- [ ] **Verify:** Post detail shows carousel indicator

**Single Image URL:**
- [ ] Create post with platform using single Box.com image URL (no `/folder/`)
- [ ] **Verify:** No carousel badge
- [ ] **Verify:** Image preview works on hover

**Media_Type = "Carousel":**
- [ ] Create post with `Media_Type = "Carousel"` but regular URL
- [ ] **Verify:** Carousel badge appears (backward compatible)

**⏱️ Estimated Time:** 5 minutes

---

#### Test 5: Edit Post

- [ ] Open any existing post
- [ ] Click "Edit Post" button
- [ ] **Verify:** Form opens with all fields populated:
  - [ ] Post title
  - [ ] Post copy
  - [ ] Scheduled date
  - [ ] Client selected
  - [ ] Subsidiaries checked
  - [ ] Platforms selected with media URLs
  - [ ] Approvers selected
- [ ] Make changes to:
  - [ ] Post title
  - [ ] Post copy
  - [ ] Add a new platform
  - [ ] Remove a platform
- [ ] Save changes
- [ ] **Verify:** Post updated successfully
- [ ] **Verify:** Calendar shows updated data
- [ ] Check spreadsheet:
  - [ ] **Posts** sheet has updated data
  - [ ] **Post_Platforms** sheet has new platform entries
  - [ ] Old platform entries deleted

**⏱️ Estimated Time:** 5 minutes

---

#### Test 6: UX Improvements (Skeletons & Caching)

**Loading Skeletons:**
- [ ] Refresh calendar (F5) - Should see skeleton calendar grid with shimmer animation
- [ ] Click any post - Should see skeleton post detail layout while loading
- [ ] Click "Create Post" without cached form options - Should see skeleton checkboxes for platforms

**Client-Side Caching:**
- [ ] Load calendar - Note the timestamp in console
- [ ] Navigate away and back (don't refresh) - Should load instantly from cache
- [ ] Click "🔄 Refresh" button - Should force fresh data load
- [ ] Create a new post - Cache should auto-invalidate and reload
- [ ] Check console logs - Should see "Using cached calendar data" messages

**⏱️ Estimated Time:** 3 minutes

---

### Step 3: Smoke Test (Quick Health Check)

Run through core workflows to ensure nothing broke:

- [ ] **Create new post** - Success
- [ ] **Submit for review** - Success
- [ ] **Approve post** - Success
- [ ] **View in calendar** - Success
- [ ] **Filter by client** - Success
- [ ] **Filter by status** - Success
- [ ] **View post detail** - Success
- [ ] **Add comment** - Success
- [ ] **Client portal login** - Success
- [ ] **Client approval** - Success
- [ ] **Save as template** - Success
- [ ] **Load template** - Success
- [ ] **Manual refresh (🔄 button)** - Success
- [ ] **Token expiration** - Verified (existing tokens have 90-day expiry)

**⏱️ Estimated Time:** 10 minutes

---

## Success Criteria

### ✅ Deployment Successful If:

1. **New version deployed** without errors
2. **All 6 tests pass** (Access Control, Status Sync, Permissions, Carousel, Edit, UX)
3. **Smoke test passes** (all core workflows functional)
4. **No critical errors** in Apps Script execution logs
5. **User can perform daily tasks** without issues
6. **Loading skeletons appear** during data loads
7. **Caching works** (instant loads on repeat visits)

### 🚨 Rollback If:

- Critical workflow broken (can't create/edit/approve posts)
- Data corruption in spreadsheets
- Permission errors preventing normal use
- Status sync not working (posts stuck in wrong status)

**Rollback Steps:**
1. Apps Script: Deploy → Manage deployments → Select previous version
2. Test immediately to verify rollback successful
3. Review error logs to diagnose issue
4. Contact development team if needed

---

## Post-Deployment Actions

### Immediate (Within 1 hour)

- [ ] **Monitor execution logs** for errors
  - Apps Script Editor → View → Logs
  - Look for: Permission denied, Status sync failures, Null reference errors

- [ ] **Notify team** of deployment
  - Send email: "Social Media Planner v2.0 deployed - New access control features"
  - Include link to [SESSION_SUMMARY_2025-11-30.md](SESSION_SUMMARY_2025-11-30.md)

- [ ] **Update version in CLAUDE.md**
  - Current status line should reflect v2.0

### Within 24 hours

- [ ] **User acceptance testing** by 2-3 power users
  - Have them test their normal workflows
  - Collect feedback on any issues

- [ ] **Check spreadsheet data integrity**
  - Verify Access_Type values look correct
  - Verify Status columns are populating
  - Check for any blank/null values that shouldn't be there

### Within 1 week

- [ ] **Performance check** with realistic data volumes
  - Test with 50+ posts in calendar
  - Check load times
  - Monitor for slowdowns

- [ ] **Review analytics** (if available)
  - Number of posts created
  - Number of approvals processed
  - Number of edits performed

---

## Known Issues to Monitor

### Minor Issues (Non-Critical)

1. **Email notifications** - Not working for @finnpartners.com addresses
   - **Impact:** Low - In-app notifications working
   - **Monitoring:** Check if users report missing email notifications
   - **Workaround:** Use in-app notification badge

2. **Box.com URL display** - Some sharing URLs don't display as images
   - **Impact:** Low - URL still accessible, just no preview
   - **Monitoring:** Watch for user complaints about image previews
   - **Workaround:** Use direct image URLs or /s/ format

3. **Loading states** - Basic "Loading..." text (not skeleton screens)
   - **Impact:** Cosmetic - Doesn't affect functionality
   - **Monitoring:** User feedback on perceived performance
   - **Future:** Implement skeleton screens in next version

### Watch For (Potential Issues)

1. **Large Post_IDs lists** - If a reviewer is assigned to 50+ posts
   - **Concern:** Performance degradation
   - **Monitoring:** Check Post_IDs field length in spreadsheet
   - **Threshold:** Alert if any user has >100 posts in Post_IDs

2. **Status sync failures** - If updatePostStatus() silently fails
   - **Concern:** Data inconsistency across sheets
   - **Monitoring:** Run `testStatusSync()` weekly
   - **Fix:** Re-run status sync for affected posts

3. **Access_Type confusion** - Users not understanding Full vs Restricted
   - **Concern:** Support requests about "can't see posts"
   - **Monitoring:** Track support tickets related to post visibility
   - **Fix:** Add in-app tooltips explaining access types

---

## Rollback Plan (If Needed)

### Quick Rollback (Under 5 minutes)

**If critical workflow is broken:**

1. **Revert Apps Script Deployment**
   ```
   1. Deploy → Manage deployments
   2. Click pencil icon on active deployment
   3. Version dropdown → Select previous version
   4. Deploy
   ```

2. **Notify Users**
   - Email: "Experiencing technical issues, rolled back to previous version"
   - Estimate: "Will redeploy after fixing issue"

3. **Test Previous Version**
   - Quick smoke test to ensure rollback successful

**⏱️ Estimated Time:** 5 minutes

---

### Full Rollback (If Database Changes Needed)

**If Access_Type or Status columns cause issues:**

1. **Revert Apps Script** (see above)

2. **Revert Database Changes** (Use Google Sheets Version History)
   ```
   1. Open spreadsheet
   2. File → Version history → See version history
   3. Find version before today's changes
   4. Click "Restore this version"
   ```

3. **Remove New Columns** (if necessary)
   - Delete `Access_Type` column from Authorized_Clients
   - Delete `Status` column from Post_Platforms
   - Delete `Post_Status` column from Post_Approvals

4. **Revert Git Commit** (for code reference)
   ```bash
   git revert HEAD
   git push origin main
   ```

**⏱️ Estimated Time:** 15 minutes

---

## Support Contacts

**Primary Developer:** Claude (Anthropic AI Assistant)
**Session Date:** November 30, 2025

**Documentation:**
- [SESSION_SUMMARY_2025-11-30.md](SESSION_SUMMARY_2025-11-30.md) - Complete session notes
- [POST_IDS_FIX_DEPLOYMENT.md](POST_IDS_FIX_DEPLOYMENT.md) - Access control details
- [STATUS_SYNC_FIX.md](STATUS_SYNC_FIX.md) - Status sync details
- [CLAUDE.md](CLAUDE.md) - Project overview

**Apps Script Project:**
- URL: https://script.google.com
- Project: "Social Media Planner"

**Spreadsheet:**
- ID: `1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss`
- URL: https://docs.google.com/spreadsheets/d/1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss/edit

---

## Deployment Sign-Off

**Deployed By:** ___________________
**Date/Time:** ___________________
**Version:** 2.1 (Sprint 1 & 2 + UX Polish)
**Deployment Successful:** ☐ Yes ☐ No
**All Tests Passed:** ☐ Yes ☐ No
**Issues Encountered:** ___________________

**Notes:**
___________________
___________________
___________________

---

**Total Estimated Deployment Time:** 50-55 minutes
- Apps Script deployment: 5 minutes
- Testing (all 6 tests): 33 minutes
- Smoke test: 10 minutes
- Post-deployment monitoring: Ongoing

**End of Deployment Checklist**
