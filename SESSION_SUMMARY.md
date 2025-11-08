# Session Summary: In-App Notifications & Client Portal Fixes

**Date:** November 6, 2025
**Version Range:** v100 → v109
**Status:** Major features complete, bugs identified for next session

---

## Accomplishments

### ✅ In-App Notification System (Complete)

**Backend Implementation:**
- Created [NotificationService.js](NotificationService.js) - Complete CRUD API for notifications
- Auto-creates "Notifications" sheet on first use
- Schema: ID, User_Email, Message, Type, Read, Post_ID, Created_Date, Action_URL
- Notification types: approval_request, approval_decision, comment_added, status_change, mention

**Integration:**
- Modified [ApprovalService.js](ApprovalService.js:73-78) - Internal review notifications
- Modified [ApprovalService.js](ApprovalService.js:171-179) - Client review notifications (internal users only)
- Modified [ApprovalService.js](ApprovalService.js:219-228) - Approval decision notifications

**Frontend Implementation:**
- Added bell icon (🔔) to [Index.html](Index.html:876-890) header with unread count badge
- Notification dropdown panel with list display
- Click notifications to navigate to related posts
- "Mark all read" functionality
- Auto-refresh every 60 seconds
- Click-outside-to-close behavior

**Testing Results:**
- ✅ Bell icon displays with correct badge count
- ✅ Notifications created on internal review submission
- ✅ Notifications created on approval decisions
- ✅ Clicking notification navigates to post and marks as read
- ✅ Auto-refresh updates badge count
- ✅ Internal users (@finnpartners.com) receive in-app notifications
- ✅ External clients only receive email (no in-app)

### ✅ Client Portal Access Fixes

**Problem:** External clients couldn't access review portal due to Google Workspace domain restrictions and URL parameter handling issues.

**Solutions Implemented:**

1. **Updated Deployment URL** (v106)
   - Updated [ClientAuthService.js](ClientAuthService.js:144) with current deployment URL
   - Updated [Index.html](Index.html:2727) portal URL generation
   - New URL: `https://script.google.com/macros/s/AKfycbwiRbuwQTrj--xfmP7klfZ_TJratdAySuujz3oSZ3-31SgTY0KA5Zsz75BDLBU-sCCV/exec`

2. **Fixed File Reference** (v106)
   - Corrected [Code.js](Code.js:115) to reference 'client-portal' instead of 'ClientPortal'

3. **Server-Side Token Injection** (v108-109) - **CRITICAL FIX**
   - **Problem:** Apps Script HtmlService doesn't preserve URL parameters in window.location.search
   - **Solution:** Inject token as server-side template variable
   - Modified [Code.js](Code.js:111-112) to use `createTemplateFromFile()` and inject token
   - Modified [client-portal.html](client-portal.html:631) loadClientData to read injected token: `const token = '<?= accessToken ?>'`
   - Modified [client-portal.html](client-portal.html:1140) submitApprovalDecision to read injected token

**Testing Results:**
- ✅ External clients can access portal via token URL
- ✅ Portal loads posts correctly
- ✅ Approve button works
- ✅ Request Changes button works
- ✅ Comment submission saves to database

### ✅ URL Management Feature

**Implementation:**
- Added Access_URL column to [ClientAuthService.js](ClientAuthService.js:110-113)
- Stores full portal URL in Authorized_Clients sheet
- Modified [Code.js](Code.js:1640-1650) checkClientHasAccess to return accessUrl
- Updated [Index.html](Index.html:2727) to display stored URL with copy functionality

**Benefits:**
- Easy reference for support team
- No need to manually construct URLs
- Backwards compatible (constructs URL if not stored)

---

## Known Bugs (Requires Fixing)

### 🐛 Bug 1: Incorrect Carousel Detection
**Impact:** Medium
**Location:** [DataService.js](DataService.js:339)
**Issue:** Non-carousel images showing carousel badge (📸)
**Root Cause:** Carousel detection logic incorrectly identifying single images as carousels
```javascript
// Line 339 - Current logic may be flawed
String(mediaType).toLowerCase().indexOf('carousel') > -1
```
**User Feedback:** "Image isn't a carousel. See attached for image from agency side."

### 🐛 Bug 2: Comment Submission Changes Status to Draft
**Impact:** High
**Location:** [Code.js](Code.js:660-676) handleClientApproval function
**Issue:** Submitting a comment (without approval decision) changes post status to Draft
**Expected:** Comment-only submissions should not change post status
**User Feedback:** "Submit comment worked, but it changed it to draft."

### 🐛 Bug 3: Comments Not Displaying
**Impact:** High
**Location:** Comment loading functionality in both Index.html and client-portal.html
**Issue:** Comments saved to database but not visible in UI on either portal
**User Feedback:** "Can't see the revision request or general comment that I posted previously on the client side (don't see comments on either side)"
**Requires Investigation:**
- Comment retrieval functions
- Comment display rendering
- Database query correctness

### 🐛 Bug 4: Status Not Syncing Across Sheets
**Impact:** Critical
**Issue:** Status changes in Posts sheet not propagating to Post_Platforms and Post_Approvals sheets
**Affected Sheets:**
- Posts (primary)
- Post_Platforms (not syncing)
- Post_Approvals (not syncing)
**User Feedback:** "the status isn't changing across the different sheets in the database. We need to make sure all sheets are synching together"
**Requires Implementation:**
- Status update synchronization function
- Update all sheets when status changes

### 🐛 Enhancement Request: Show Box Link for Carousels
**Impact:** Low
**Issue:** When media is a carousel, modal should display the Box folder link
**User Feedback:** "if it is a carousel, on both the client and agency side - modal should show the Box link (but don't change the previews of images and videos)"
**Implementation Notes:**
- Add Box link display to post detail modal
- Show for carousel media types only
- Display on both internal and client portals

---

## Technical Learnings

### Server-Side Template Injection Pattern
**Critical Discovery:** Apps Script's HtmlService removes URL parameters when serving HTML files.

**Problem:**
```javascript
// This doesn't work - urlParams.get('token') returns null
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token'); // Always empty!
```

**Solution:**
```javascript
// Code.js - Inject server-side
const template = HtmlService.createTemplateFromFile('client-portal');
template.accessToken = token || '';
return template.evaluate()...

// client-portal.html - Read injected variable
const token = '<?= accessToken ?>' || urlParams.get('token');
```

**Key Takeaway:** Always use server-side template variables for passing data to Apps Script served HTML, not URL parameters.

### Non-Domain Email Access Restrictions
**Discovery:** Google Workspace web apps cannot be accessed by non-domain email addresses when served from internal URL.

**Workaround:** Use client portal pattern with token-based authentication via deployment URL with `?page=client&token=xxx` parameter.

---

## Files Modified This Session

1. **NotificationService.js** - New file (complete notification backend)
2. **ApprovalService.js** - Integrated notification triggers
3. **ClientAuthService.js** - Added Access_URL storage and updated deployment URL
4. **Code.js** - Client portal routing, token injection, accessUrl return
5. **Index.html** - Notification UI, JavaScript functions, URL management display
6. **client-portal.html** - Token injection reading for data and approval actions

---

## Deployment History

- **v100** - Previous session endpoint (approval workflow fixes)
- **v104** - In-app notification system implemented
- **v106** - Client portal file reference and URL fixes
- **v108** - Server-side token injection for data loading
- **v109** - Token injection for approval actions (current)

---

## Next Session Priorities

1. **Fix comment submission status bug** (Bug #2) - High priority
2. **Fix comment display** (Bug #3) - High priority
3. **Implement status synchronization** (Bug #4) - Critical priority
4. **Fix carousel detection** (Bug #1) - Medium priority
5. **Add Box link display for carousels** (Enhancement) - Low priority
6. **Complete end-to-end testing** - After all bugs fixed
7. **Create NOTIFICATION_DEPLOYMENT_GUIDE.md** - Document notification system deployment

---

## Testing Guide Reference

See [NOTIFICATION_TESTING_GUIDE.md](NOTIFICATION_TESTING_GUIDE.md) for complete testing procedures.

---

## Success Criteria Met This Session

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
✅ Client portal accessible via token URL
✅ Client approval actions functional
✅ URL management implemented

---

**End of Session Summary**
