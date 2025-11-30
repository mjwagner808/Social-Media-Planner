# Status Synchronization Fix

## Problem

The `updatePostStatus()` function is designed to sync status changes across three sheets:
1. **Posts** - Main posts table
2. **Post_Platforms** - Platform-specific versions (needs "Status" column)
3. **Post_Approvals** - Approval records (needs "Post_Status" column)

**Issue:** Post_Platforms and Post_Approvals sheets may be missing the Status columns, causing status changes to NOT synchronize across sheets.

## Root Cause

- **Post_Platforms** sheet was created without a "Status" column
- **Post_Approvals** sheet was created without a "Post_Status" column
- The `updatePostStatus()` function silently fails when these columns don't exist (doesn't throw error, just logs warning)

## Solution

Add the missing columns and populate them with correct values.

---

## Deployment Steps

### Step 1: Run Diagnostic

1. Open **Apps Script Editor**:
   - Go to https://script.google.com
   - Open "Social Media Planner" project

2. Find and run **`diagnoseStatusColumns()`** function:
   - In the function dropdown, select `diagnoseStatusColumns`
   - Click ▶️ **Run**

3. **View Execution Log**:
   - Click **Execution log** or **View** → **Logs**
   - Check the output - it will show:
     - Current columns in each sheet
     - Whether Status/Post_Status columns exist
     - Recommendation for next steps

**Expected Output:**
```
========================================
STATUS COLUMN DIAGNOSTIC
========================================

--- POST_PLATFORMS SHEET ---
Current columns: ID, Post_ID, Platform, Media_File_URL, Media_Type, Created_Date
Has "Status" column? NO
Total columns: 6

--- POST_APPROVALS SHEET ---
Current columns: ID, Post_ID, Approval_Stage, Approver_Email, Approver_Name, Approval_Status, Decision_Date, Decision_Notes, Email_Sent_Date, Created_Date
Has "Post_Status" column? NO
Has "Status" column? NO
Total columns: 10

========================================
RECOMMENDATION:
If columns are missing, add them manually or use addStatusColumns() function
========================================
```

---

### Step 2: Add Missing Columns

**Option A: Automatic (Recommended)**

1. In Apps Script Editor, find and run **`addStatusColumns()`** function:
   - Function dropdown → select `addStatusColumns`
   - Click ▶️ **Run**

2. **Grant Permissions** (if prompted):
   - Click "Review permissions"
   - Select your Google account
   - Click "Advanced" → "Go to Social Media Planner (unsafe)"
   - Click "Allow"

3. **Check Execution Log**:
   - Should show success messages for columns added
   - Should populate existing rows with default/current values

**Expected Output:**
```
========================================
ADDING STATUS COLUMNS
========================================

--- POST_PLATFORMS SHEET ---
✅ Added "Status" column at position 7
✅ Set default "Draft" status for 15 existing rows

--- POST_APPROVALS SHEET ---
✅ Added "Post_Status" column at position 11
ℹ️  Populating Post_Status for 8 existing approval records...
✅ Populated Post_Status for existing rows

========================================
SUMMARY
========================================
✅ Changes made:
  - Post_Platforms: Added Status column
  - Post_Approvals: Added Post_Status column
========================================
```

**Option B: Manual (If automatic fails)**

1. Open spreadsheet: https://docs.google.com/spreadsheets/d/1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss/edit

2. **Post_Platforms sheet:**
   - Add column header "Status" (after Media_Type column)
   - Fill existing rows with "Draft" (or leave empty - will be synced on next status change)

3. **Post_Approvals sheet:**
   - Add column header "Post_Status" (after Created_Date column)
   - Fill with current post status from Posts sheet (or leave empty)

---

### Step 3: Test Status Sync

1. In Apps Script Editor, run **`testStatusSync()`** function:
   - Function dropdown → select `testStatusSync`
   - Click ▶️ **Run**

2. **Check Execution Log**:
   - Should show a test post being updated
   - Should confirm all 3 sheets were updated

**Expected Output:**
```
========================================
TESTING STATUS SYNCHRONIZATION
========================================

Using test post: POST-001 (Test Post Title)
Current status: Draft

Updating status to: Internal_Review

✅ Update succeeded!
Posts updated: true
Platforms updated: true
Approvals updated: true

========================================
```

---

### Step 4: Verify in Spreadsheet

1. Open spreadsheet and check:
   - **Post_Platforms** sheet has "Status" column
   - **Post_Approvals** sheet has "Post_Status" column
   - Values are populated correctly

2. Test in the app:
   - Submit a post for internal review
   - Check that status updates in all 3 sheets

---

## Success Criteria

✅ Post_Platforms sheet has "Status" column
✅ Post_Approvals sheet has "Post_Status" column
✅ Existing rows have correct status values
✅ `updatePostStatus()` function updates all 3 sheets
✅ Status changes in app reflect in all sheets

---

## Rollback Plan

If something goes wrong:

1. **Delete the new columns** from Post_Platforms and Post_Approvals sheets
2. **Restore from version history** (File → Version history in Google Sheets)
3. Report the error so we can fix the script

---

## Technical Details

### updatePostStatus() Function

Location: [DataService.js:244-350](DataService.js#L244)

**What it does:**
1. Updates Posts.Status for the given post
2. Updates Post_Platforms.Status for all platform records with that Post_ID
3. Updates Post_Approvals.Post_Status for all approval records with that Post_ID

**Called by:**
- `submitForInternalReview()` - Sets status to "Internal_Review"
- `submitForClientReview()` - Sets status to "Client_Review"
- `checkAndUpdatePostApprovalStatus()` - Sets status to "Approved" or "Draft"

### Column Purposes

**Post_Platforms.Status:**
- Tracks the status of each platform version
- Enables platform-specific workflows (future feature)
- Currently mirrors the main post status

**Post_Approvals.Post_Status:**
- Provides context for approval records
- Shows what status the post was in when approval was requested
- Useful for reporting and analytics

---

## Related Files

- **DiagnoseStatusSync.js** - Diagnostic and fix scripts
- **DataService.js** - Contains `updatePostStatus()` function
- **ApprovalService.js** - Calls `updatePostStatus()` for workflow changes

---

## Notes

- This fix is **non-breaking** - it only adds columns
- Existing data is preserved
- Default values are safe ("Draft" for platforms, lookup from Posts for approvals)
- The function already had the sync logic - we're just adding the missing columns
