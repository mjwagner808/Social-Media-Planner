# Notification System Testing Guide

## Overview
Complete in-app notification system to reduce email dependency for internal users.

## What Was Built

### Backend (NotificationService.js)
- Complete notification CRUD API
- Database: Auto-creates "Notifications" sheet on first use
- Schema: ID, User_Email, Message, Type, Read, Post_ID, Created_Date, Action_URL
- Notification types: approval_request, approval_decision, comment_added, status_change, mention

### Integration (ApprovalService.js)
- Notifications triggered on:
  - Internal review submission → notifies internal approvers
  - Client review submission → notifies internal client approvers only
  - Approval decisions (approve/request changes) → notifies post creator

### Frontend (Index.html)
- Bell icon (🔔) in header with unread count badge
- Dropdown panel with notification list
- Click notifications to navigate to related posts
- "Mark all read" functionality
- Auto-refresh every 60 seconds
- Loads initial count on page load
- Click-outside-to-close behavior

## Testing Steps

### 1. Deploy New Version

```bash
clasp open
```

In Apps Script editor:
1. **Deploy** → **Manage deployments**
2. Click pencil icon ✏️ next to active deployment
3. **Version** → **New version** → "Version 104: In-app notification system"
4. Click **Deploy**

### 2. Test in Fresh Incognito Window

Open web app URL in new Incognito window to avoid caching.

### 3. Test Notification Creation

**Scenario A: Submit Post for Internal Review**

1. Create or open a Draft post
2. Click "Submit for Internal Review"
3. **Expected Results**:
   - Success message: "✅ Post submitted for internal review! 📧 Email notifications sent to X internal approver(s)"
   - Notifications created for each internal approver
   - Post status changes to "Internal_Review"

4. **As an Internal Approver** (different user):
   - Open web app
   - Bell icon should show badge with count (e.g., "1")
   - Click bell icon
   - Dropdown should show notification: "📋 New internal approval request: [Post Title]"

**Scenario B: Approve/Request Changes**

1. As internal approver, open the post
2. Click "Approve" or "Request Changes"
3. **Expected Results**:
   - Notification created for post creator
   - Post creator sees: "✅ [Approver Name] approved "[Post Title]"" or similar

**Scenario C: Submit for Client Review**

1. After all internal approvals, submit for client review
2. **Expected Results**:
   - Client approvers with @finnpartners.com emails get in-app notifications
   - External client approvers only get email (no in-app notification)

### 4. Test Notification UI Features

**Badge Display**:
- Badge shows correct count
- Badge hidden when count = 0
- Badge updates when new notifications arrive

**Dropdown Behavior**:
- Click bell icon → dropdown opens
- Click outside → dropdown closes
- Click bell again → dropdown closes

**Notification List**:
- Shows newest notifications first
- Displays correct icon for type (📋 approval_request, ✅ approval_decision, etc.)
- Shows "time ago" format (e.g., "5 minutes ago", "2 hours ago")
- Shows "No new notifications" when empty

**Click to Navigate**:
- Click notification → marks as read, opens post detail modal, closes dropdown
- Post detail modal opens to correct post

**Mark All Read**:
- Click "Mark all read" → all notifications marked read
- Badge count updates to 0
- List shows "No new notifications"

### 5. Test Auto-Refresh

1. Have two browser windows open (different users)
2. Create notification for User A (by submitting post for their approval)
3. Watch User A's bell icon badge
4. **Expected**: Badge count updates within 60 seconds without page refresh

### 6. Check Backend Logs

In Apps Script editor: **View** → **Execution log**

Look for:
- `=== Creating Notification ===`
- `✅ Notification created: NOTIF-###`
- `=== Getting Unread Notifications ===`
- `Found X unread notifications`

### 7. Verify Notifications Sheet

Open spreadsheet: `1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss`

Check for new "Notifications" sheet with columns:
- ID (e.g., NOTIF-001)
- User_Email
- Message
- Type
- Read (TRUE/FALSE)
- Post_ID
- Created_Date
- Action_URL

## Expected User Flow Example

1. **Designer creates post** → Status: Draft
2. **Designer submits for internal review** → Creates notifications for Creative Director and Account Manager
3. **Creative Director opens app** → Sees badge "2" (if they have 2 pending approvals)
4. **Creative Director clicks bell** → Sees list of approval requests
5. **Creative Director clicks notification** → Post detail modal opens
6. **Creative Director approves** → Notification marked read, notification sent to Designer
7. **Designer opens app** → Sees new notification: "Creative Director approved 'Summer Campaign Post'"
8. **After all internal approvals** → Designer submits for client review
9. **Client Approver (internal)** → Receives in-app notification
10. **Client Approver (external)** → Receives email only (no in-app notification)

## Troubleshooting

### Bell icon not showing badge
- Check execution log for `getUnreadNotificationCount` calls
- Verify Notifications sheet exists
- Check User_Email matches logged-in user

### Dropdown shows "Loading..." forever
- Check browser console for errors
- Verify `getUnreadNotifications()` function exists in NotificationService.js
- Check execution log for errors

### Notifications not being created
- Check execution log for "Creating Notification" entries
- Verify NotificationService.js was pushed via `clasp push`
- Check for try/catch warnings in ApprovalService.js logs

### Auto-refresh not working
- Check browser console for errors
- Verify setInterval is running (no errors in console)
- Test by manually creating notification and waiting 60 seconds

## Success Criteria

✅ Bell icon appears in header
✅ Badge shows correct unread count
✅ Clicking bell opens dropdown with notification list
✅ Notifications created when posts submitted for review
✅ Notifications created when approval decisions made
✅ Clicking notification navigates to post and marks as read
✅ "Mark all read" clears all notifications
✅ Auto-refresh updates badge count every 60 seconds
✅ Click outside closes dropdown
✅ Works for internal users (@finnpartners.com)
✅ External clients don't receive in-app notifications (email only)

## Next Steps After Testing

Once testing is complete and notification system works:
- ✅ Mark notification system complete
- Move to final Phase 2 cleanup and documentation
- Prepare for Phase 3: Post Detail View enhancements
