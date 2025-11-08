# Debug Instructions for Approval Status Issue

## Problem
Client approvals are being recorded in Post_Approvals sheet and Comments sheet, but the Posts sheet status is not updating from "Client_Review" to "Approved".

## Steps to Debug

### Step 1: Find the Post ID
Look at the post that was just approved. What is its Post_ID? (Example: POST-032)

### Step 2: Run Manual Check Function
In Apps Script editor:

1. Open the script editor (`clasp open` or via Apps Script UI)
2. In the top function dropdown, select: `MANUAL_CHECK_APPROVAL_STATUS`
3. Click "Run"
4. When prompted, allow permissions
5. Check the execution log to see detailed output

**OR** run it with a specific post ID:
```javascript
MANUAL_CHECK_APPROVAL_STATUS('POST-032')  // Replace with actual Post ID
```

This function will:
- Show current post status
- Show all approval records
- Show what the logic SHOULD do
- Actually run the status update
- Show the result

### Step 3: Check Execution Logs from Client Approval

From your Executions tab screenshot:
1. Find the execution that ran when you clicked "Approve" (around 5:17 PM)
2. Click on it to expand full details
3. Look for these key log entries:

```
=== HANDLING CLIENT APPROVAL ===
=== RECORD APPROVAL DECISION ===
Calling checkAndUpdatePostApprovalStatus...
=== Checking approval status for post: POST-XXX ===
Client approvals found: X
  Client: APR-XXX - Status: Approved, Stage: Client
All client approved: true
→ Updating status to: Approved (client approved)
=== UPDATING POST STATUS ===
Found post at row X, current status: Client_Review
Setting status to: Approved at row X, column Y
✅ Posts sheet updated at row X
```

### Step 4: Check Post_Approvals Sheet

Open the spreadsheet and check the Post_Approvals sheet:
- Find the approval record for the post you just approved
- Check column C (Approval_Stage) - what does it say? Should be "Client" or "Client_Review"
- Check column F (Approval_Status) - what does it say? Should be "Approved" after you clicked approve

### Step 5: Check for Spreadsheet Formulas

In the Posts sheet:
- Click on the Status cell for the post
- Check if there's a formula in the cell (starts with =)
- If there's a formula, it might be overwriting our status updates!

## What We're Looking For

1. Is `checkAndUpdatePostApprovalStatus()` being called?
2. Is it finding the client approval records?
3. Is `allClientApproved` evaluating to `true`?
4. Is `updatePostStatus()` being called?
5. Is the post being found in the Posts sheet?
6. Is the status actually being set?
7. Is there a formula overwriting the status afterward?

## Quick Fix Test

If you want to test if the logic works, you can manually run:
```javascript
checkAndUpdatePostApprovalStatus('POST-032')  // Replace with actual Post ID
```

This will force the status check to run and you can see if it updates the status correctly.
