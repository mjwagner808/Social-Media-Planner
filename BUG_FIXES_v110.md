# Bug Fixes - Version 110

**Date:** November 6, 2025
**Previous Version:** v109
**Changes:** 5 critical bug fixes from client portal testing

---

## Bugs Fixed

### 1. ✅ Comment Submission Status Change Investigation

**Issue:** User reported comment submission changed post status to Draft.

**Root Cause:** Could not be definitively identified in code - the code path for comment-only submissions does NOT call `updatePostStatus()`.

**Fix Applied:** Added comprehensive logging to detect if status changes occur:
- [Code.js:662](Code.js#L662) - Log status BEFORE comment added
- [Code.js:682-689](Code.js#L682-L689) - Log status AFTER comment added and warn if changed
- This will help identify if a spreadsheet formula or trigger is causing the issue

**Files Modified:**
- [Code.js](Code.js) - Added defensive status checking in `handleClientApproval()`

**Testing Notes:**
- If status changes are detected in logs, this indicates a spreadsheet-level formula or trigger
- The application code itself does not change status when adding comments

---

### 2. ✅ Comments Not Displaying in Client Portal

**Issue:** Comments were saved to database but not visible in UI on client portal.

**Root Cause:** Token not being read correctly in `loadCommentHistory()` function. The function tried to read token from URL parameters (`window.location.search`), but Apps Script's HtmlService strips URL parameters when serving HTML.

**Fix Applied:**
- [client-portal.html:1028](client-portal.html#L1028) - Changed token reading to use server-side injected variable
```javascript
// BEFORE (broken):
const token = urlParams.get('token');

// AFTER (fixed):
const token = '<?= accessToken ?>' || urlParams.get('token');
```

**Files Modified:**
- [client-portal.html](client-portal.html) - Updated `loadCommentHistory()` function

**Expected Result:**
- Comments now load and display correctly in client portal
- Comment history shows below post details with commenter, timestamp, and comment type

**Note:** Agency portal (Index.html) doesn't have comment display implemented yet - this is Phase 3 work.

---

### 3. ✅ Status Not Syncing Across Sheets (CRITICAL)

**Issue:** Status changes in Posts sheet not propagating to Post_Platforms and Post_Approvals sheets, causing data inconsistency.

**Root Cause:** `updatePostStatus()` function only updated the Posts sheet, ignoring related sheets.

**Fix Applied:** Completely rewrote `updatePostStatus()` to sync across all three sheets:

**[DataService.js:205-288](DataService.js#L205-L288)** - Enhanced function now:
1. Updates Posts sheet (as before)
2. Updates all matching rows in Post_Platforms sheet (by Post_ID)
3. Updates all matching rows in Post_Approvals sheet (by Post_ID and Post_Status column)
4. Logs which sheets were updated
5. Returns detailed success info showing which sheets were synced

**Files Modified:**
- [DataService.js](DataService.js) - Rewrote `updatePostStatus()` function

**Expected Result:**
- When status changes (e.g., Draft → Internal_Review → Client_Review → Approved), ALL three sheets update simultaneously
- Post_Platforms: Status column updates for all platform entries
- Post_Approvals: Post_Status column updates for all approval records
- Execution logs show: "Status sync complete: Posts=true, Platforms=true, Approvals=true"

**Impact:** This was a critical data integrity bug. All status updates now maintain consistency across the database.

---

### 4. ✅ Incorrect Carousel Detection

**Issue:** Non-carousel images showing carousel badge (📸) in UI.

**Root Cause:** Carousel detection logic was too loose - used `indexOf('carousel') > -1` which could match partial strings or unexpected data.

**Fix Applied:** Changed to strict equality check:

**[DataService.js:398](DataService.js#L398)** - Changed detection logic:
```javascript
// BEFORE (loose):
isCarousel: String(mediaType).toLowerCase().indexOf('carousel') > -1

// AFTER (strict):
var isCarousel = String(mediaType).trim().toLowerCase() === 'carousel';
```

**Files Modified:**
- [DataService.js](DataService.js) - Updated carousel detection in `getAllPostsWithImages()`

**Expected Result:**
- Only posts with Media_Type = "Carousel" (exact match, case-insensitive) show carousel badge
- Images and videos display normally without carousel badge

---

### 5. ✅ Missing Box Link for Carousels

**Issue:** Carousel posts didn't show clickable Box folder link in post detail modals.

**Root Cause:** Feature not implemented - carousels just showed "📸 Carousel (multiple images)" text without link.

**Fix Applied:** Added Box link display for carousels on both portals:

**Client Portal:**
- [client-portal.html:949-959](client-portal.html#L949-L959) - Added clickable Box link
```html
📸 Carousel (multiple images)
🔗 View carousel in Box
```

**Agency Portal:**
- [Index.html:1596-1602](Index.html#L1596-L1602) - Already had Box link implemented ✓

**Files Modified:**
- [client-portal.html](client-portal.html) - Added Box link to carousel display in `openPostDetail()`

**Expected Result:**
- When viewing a carousel post, users see "📸 Carousel (multiple images)" with a clickable "🔗 View carousel in Box" link
- Link opens Box folder in new tab
- Behavior consistent across client and agency portals

---

## Files Changed Summary

| File | Changes | Impact |
|------|---------|--------|
| [Code.js](Code.js) | Added status change detection logging | Helps identify if spreadsheet triggers are modifying status |
| [client-portal.html](client-portal.html) | Fixed token reading, added Box link | Comments now display, carousels show link |
| [DataService.js](DataService.js) | Status sync across sheets, strict carousel detection | Critical data integrity fix, accurate carousel badges |

---

## Deployment Instructions

### 1. Push Code (Already Done)
```bash
clasp push  # ✅ Completed
```

### 2. Deploy New Version

1. Open Apps Script editor:
   ```bash
   clasp open
   ```

2. In Apps Script editor:
   - **Deploy** → **Manage deployments**
   - Click pencil icon ✏️ next to active deployment
   - **Version** → **New version** → **"Version 110: Bug fixes - comments, status sync, carousel detection"**
   - Click **Deploy**

### 3. Test in New Incognito Window

**IMPORTANT:** Always test in new Incognito window to avoid caching issues.

---

## Testing Checklist

### Test 1: Comment Display
- [ ] Open client portal with a post that has comments
- [ ] Verify comment history loads below post details
- [ ] Check comments show: commenter email, timestamp, comment type, comment text
- [ ] Test on both client portal and agency portal (agency portal = Phase 3, not implemented yet)

### Test 2: Status Synchronization
- [ ] Change a post status from Draft → Internal_Review
- [ ] Open spreadsheet and check all three sheets:
  - [ ] Posts sheet: Status updated ✓
  - [ ] Post_Platforms sheet: Status column updated for all entries with that Post_ID ✓
  - [ ] Post_Approvals sheet: Post_Status column updated for all entries with that Post_ID ✓
- [ ] Check execution logs for "Status sync complete" message

### Test 3: Carousel Detection
- [ ] Create/view posts with different media types:
  - [ ] Image: Should NOT show carousel badge
  - [ ] Video: Should NOT show carousel badge
  - [ ] Carousel: SHOULD show carousel badge (📸)
- [ ] Open spreadsheet Post_Platforms sheet
- [ ] Verify Media_Type column has correct values: "Image", "Video", or "Carousel"

### Test 4: Carousel Box Links
- [ ] Open a post with Media_Type = "Carousel"
- [ ] Verify modal shows: "📸 Carousel (multiple images)"
- [ ] Verify "🔗 View carousel in Box" link appears
- [ ] Click link - should open Box folder in new tab
- [ ] Test on BOTH client portal and agency portal

### Test 5: Comment Submission Status (Monitoring)
- [ ] Submit a comment via client portal (not "Request Changes", just comment)
- [ ] Check execution logs for:
  - "BEFORE COMMENT: Post status = [status]"
  - "AFTER COMMENT: Post status = [status]"
- [ ] If statuses differ, logs will show: "⚠️ WARNING: Post status changed unexpectedly"
- [ ] This indicates a spreadsheet formula/trigger is modifying the status

---

## Known Limitations

### 1. Comment Display on Agency Portal
- **Status:** Not implemented (Phase 3 work)
- **Current Behavior:** Agency users (internal) cannot see comments in the calendar view
- **Workaround:** Comments visible in database Comments sheet
- **Future:** Will be implemented in Phase 3 Post Detail View enhancements

### 2. Comment Submission Status Change
- **Status:** Under investigation
- **Current Behavior:** May change status to Draft (user reported, but code doesn't do this)
- **Investigation:** Added logging to detect if spreadsheet formulas/triggers are causing this
- **Action Required:** Monitor execution logs after deployment to identify root cause

---

## Rollback Plan

If critical issues are discovered:

1. In Apps Script editor: **Deploy** → **Manage deployments**
2. Click pencil icon ✏️ next to active deployment
3. **Version** → Select **"Version 109"** (previous working version)
4. Click **Deploy**

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark bug fixes complete
2. Update [SESSION_SUMMARY.md](SESSION_SUMMARY.md) with test results
3. Decide on next priority:
   - **Option A:** Phase 3 - Post Detail View (comments, approval actions for internal users)
   - **Option B:** Additional Phase 2 polish based on user feedback
   - **Option C:** Begin Phase 5 - Strategy Dashboard

---

## Technical Notes

### Server-Side Template Variable Injection Pattern

**Key Learning:** Apps Script's `HtmlService` removes URL parameters when serving HTML. Always use server-side template variables for passing data.

**Correct Pattern:**
```javascript
// Backend (Code.js)
const template = HtmlService.createTemplateFromFile('client-portal');
template.accessToken = token || '';
return template.evaluate()...

// Frontend (client-portal.html)
const token = '<?= accessToken ?>' || urlParams.get('token');
```

**This pattern was applied to:**
- Data loading (v108)
- Approval actions (v109)
- Comment loading (v110) ← New fix

---

**End of Bug Fixes Document - Version 110**
