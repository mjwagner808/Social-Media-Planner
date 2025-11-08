# UI Enhancements Plan for Client Approval Portal

## Overview
This document outlines the exact changes needed to make the client approval portal usable from the agency user's perspective.

## Changes Required

### 1. Modify `updatePostDetailActions()` Function (Index.html, line 1720)

**Current logic:**
- Draft → "Submit for Review" (changes status to Internal_Review)
- Internal_Review → "Approve" / "Request Changes"
- Client_Review → "Approve" / "Request Changes"
- Approved → "Schedule"

**New logic to add:**
- **Internal_Review** → Add "Submit for Client Review" button (if all internal approvals complete)
- **Client_Review** → Show client access management section

### 2. Add Client Access Section to Post Detail

**Insert BEFORE the Comments section in `displayPostDetail()` function (around line 1597):**

```html
<!-- Client Access Section (only for Client_Review status) -->
<div id="clientAccessSection" style="display: none;">
  <div class="detail-section" style="background: #e8f0fe; padding: 16px; border-radius: 4px;">
    <h4 style="color: #1a73e8;">🔗 Client Portal Access</h4>

    <!-- Token status -->
    <div id="clientTokenStatus">
      <p style="color: #5f6368;">Loading access status...</p>
    </div>

    <!-- Token generator (if no token exists) -->
    <div id="clientTokenGenerator" style="display: none;">
      <p style="margin-bottom: 12px;">This client doesn't have portal access yet.</p>
      <button class="btn btn-primary" onclick="generateClientToken()">Generate Access Token</button>
    </div>

    <!-- Portal URL (if token exists) -->
    <div id="clientPortalUrl" style="display: none;">
      <p style="margin-bottom: 8px;"><strong>Client Portal URL:</strong></p>
      <div style="background: white; padding: 12px; border-radius: 4px; border: 1px solid #dadce0; display: flex; gap: 8px; align-items: center;">
        <input
          type="text"
          id="portalUrlInput"
          readonly
          style="flex: 1; border: none; font-family: monospace; font-size: 12px; padding: 4px;"
          value="">
        <button class="btn btn-secondary" onclick="copyPortalUrl()">📋 Copy</button>
      </div>

      <p style="margin-top: 12px; color: #5f6368; font-size: 13px;">
        ℹ️ Share this URL with your client. No Google account required.
      </p>

      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <button class="btn btn-secondary" onclick="emailPortalLink()">📧 Email Link to Client</button>
        <button class="btn btn-warning" onclick="revokeClientToken()" style="background: #ea4335; color: white;">🔒 Revoke Access</button>
      </div>
    </div>
  </div>
</div>
```

### 3. Add JavaScript Functions

**Add these functions at the end of the script section:**

```javascript
// =====================================================
// CLIENT PORTAL ACCESS MANAGEMENT
// =====================================================

function checkClientAccess(post) {
  if (post.Status !== 'Client_Review') {
    document.getElementById('clientAccessSection').style.display = 'none';
    return;
  }

  document.getElementById('clientAccessSection').style.display = 'block';

  // Check if client already has access
  google.script.run
    .withSuccessHandler(function(result) {
      if (result.hasAccess) {
        // Show portal URL
        document.getElementById('clientTokenGenerator').style.display = 'none';
        document.getElementById('clientPortalUrl').style.display = 'block';

        const portalUrl = `https://mjwagner808.github.io/Social-Media-Planner/client-portal.html?token=${result.token}`;
        document.getElementById('portalUrlInput').value = portalUrl;

        document.getElementById('clientTokenStatus').innerHTML = `
          <p style="color: #34a853;">✅ Client has portal access</p>
          <p style="font-size: 13px; color: #5f6368;">Last login: ${result.lastLogin || 'Never'}</p>
        `;
      } else {
        // Show token generator
        document.getElementById('clientTokenGenerator').style.display = 'block';
        document.getElementById('clientPortalUrl').style.display = 'none';

        document.getElementById('clientTokenStatus').innerHTML = `
          <p style="color: #f9ab00;">⚠️ Client doesn't have portal access yet</p>
        `;
      }
    })
    .withFailureHandler(function(error) {
      document.getElementById('clientTokenStatus').innerHTML = `
        <p style="color: #ea4335;">❌ Error checking access: ${error.message}</p>
      `;
    })
    .checkClientHasAccess(post.Client_ID, post.Client_Approvers);
}

function generateClientToken() {
  const post = getCurrentPost(); // Helper to get current post data

  if (!confirm('Generate portal access for this client?')) {
    return;
  }

  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        alert('✅ Client access granted!\n\nToken: ' + result.token);
        // Refresh to show URL
        checkClientAccess(post);
      } else {
        alert('❌ Error: ' + (result.error || 'Failed to generate token'));
      }
    })
    .withFailureHandler(function(error) {
      alert('❌ Error: ' + error.message);
    })
    .grantClientAccessForPost(post.ID, post.Client_ID, post.Client_Approvers);
}

function copyPortalUrl() {
  const input = document.getElementById('portalUrlInput');
  input.select();
  document.execCommand('copy');

  // Show feedback
  const originalText = event.target.textContent;
  event.target.textContent = '✅ Copied!';
  event.target.style.background = '#34a853';

  setTimeout(function() {
    event.target.textContent = originalText;
    event.target.style.background = '';
  }, 2000);
}

function emailPortalLink() {
  const post = getCurrentPost();
  const portalUrl = document.getElementById('portalUrlInput').value;

  const emailTemplate = `Subject: Review Your Social Media Posts

Hi,

You can now review and approve your upcoming social media posts online!

Access your content calendar here:
${portalUrl}

Features:
✅ View all scheduled posts
✅ Approve or request changes
✅ Add comments and feedback
✅ No login required - just bookmark this link

Please keep this link private as it's unique to your account.

Questions? Just reply to this email.

Best regards,
${<?= userName ?>}`;

  if (confirm('Copy email template to clipboard?')) {
    const tempArea = document.createElement('textarea');
    tempArea.value = emailTemplate;
    document.body.appendChild(tempArea);
    tempArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempArea);

    alert('✅ Email template copied to clipboard!\n\nPaste into your email client and send to: ' + post.Client_Approvers);
  }
}

function revokeClientToken() {
  const post = getCurrentPost();

  if (!confirm('⚠️ Revoke client portal access?\n\nThe client will no longer be able to view or approve posts.')) {
    return;
  }

  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        alert('✅ Client access revoked');
        checkClientAccess(post);
      } else {
        alert('❌ Error: ' + (result.error || 'Failed to revoke access'));
      }
    })
    .withFailureHandler(function(error) {
      alert('❌ Error: ' + error.message);
    })
    .revokeClientAccessForClient(post.Client_ID);
}

function submitPostForClientReview(postId) {
  if (!confirm('Submit this post for client review?\n\nAn approval record will be created and the post status will change to Client Review.')) {
    return;
  }

  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        alert('✅ Post submitted for client review!\n\nApprover count: ' + result.approverCount);
        // Refresh post detail
        openPostDetail(postId);
        // Refresh calendar
        loadCalendarData();
      } else {
        alert('❌ Error: ' + (result.error || 'Failed to submit for review'));
      }
    })
    .withFailureHandler(function(error) {
      alert('❌ Error: ' + error.message);
    })
    .submitForClientReview(postId);
}

// Helper to get current post data
function getCurrentPost() {
  // This will be populated when displaying post detail
  return window.currentPostData;
}
```

### 4. Modify `displayPostDetail()` to Store Post Data

**Add at the beginning of the function:**

```javascript
// Store post data globally for client access functions
window.currentPostData = post;
```

**Add BEFORE loading comments (around line 1666):**

```javascript
// Check client access status if in Client_Review
checkClientAccess(post);
```

### 5. Modify `updatePostDetailActions()` to Add Client Review Button

**Add this condition in the appropriate place:**

```javascript
else if (post.Status === 'Internal_Review') {
  // Check if all internal approvals are complete
  html += ' <button class="btn btn-primary" type="button" onclick="submitPostForClientReview(\'' + post.ID + '\')">📤 Submit for Client Review</button>';
  html += ' <button class="btn btn-success" type="button" onclick="changePostStatus(\'' + post.ID + '\', \'Approved\')">Approve</button>';
  html += ' <button class="btn btn-warning" type="button" onclick="changePostStatus(\'' + post.ID + '\', \'Draft\')">Request Changes</button>';
}
```

## Backend Functions Needed

Add these to **Code.js**:

```javascript
/**
 * Check if a client has portal access
 */
function checkClientHasAccess(clientId, approverEmails) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Authorized_Clients');
  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return {hasAccess: false};
  }

  var headers = data[0];

  // Check for active token for this client
  for (var i = 1; i < data.length; i++) {
    var row = {};
    headers.forEach(function(header, idx) {
      row[header] = data[i][idx];
    });

    if (row.Client_ID === clientId && row.Status === 'Active') {
      return {
        hasAccess: true,
        token: row.Access_Token,
        lastLogin: row.Last_Login_Date ? new Date(row.Last_Login_Date).toLocaleString() : 'Never'
      };
    }
  }

  return {hasAccess: false};
}

/**
 * Grant client access for a specific post
 */
function grantClientAccessForPost(postId, clientId, approverEmails) {
  // Use the first email from the approverEmails list
  var email = approverEmails ? approverEmails.split(',')[0].trim() : '';

  if (!email) {
    return {success: false, error: 'No client approver email found'};
  }

  return grantClientAccess(clientId, email, 'Full');
}

/**
 * Revoke client access
 */
function revokeClientAccessForClient(clientId) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Authorized_Clients');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var clientIdIndex = headers.indexOf('Client_ID');
  var statusIndex = headers.indexOf('Status');

  for (var i = 1; i < data.length; i++) {
    if (data[i][clientIdIndex] === clientId) {
      sheet.getRange(i + 1, statusIndex + 1).setValue('Revoked');
      return {success: true};
    }
  }

  return {success: false, error: 'No access found for this client'};
}
```

## Testing Checklist

### Before Testing
- [ ] Deploy new version of Apps Script
- [ ] Open in incognito window

### Test Flow
1. [ ] Create new post with client approver
2. [ ] Submit for internal review (from modal or creation form)
3. [ ] Approve internally
4. [ ] Open post detail → Should see "Submit for Client Review" button
5. [ ] Click button → Status changes to Client_Review
6. [ ] Open post detail again → Should see client access section
7. [ ] Click "Generate Access Token" → Token created
8. [ ] Copy portal URL
9. [ ] Click "Email Link to Client" → Template copied
10. [ ] Open portal URL in new incognito tab
11. [ ] Verify client can see and approve posts
12. [ ] Verify status updates in main app

## Estimated Time
- Implementation: 1.5-2 hours
- Testing: 30-45 minutes
- **Total: 2-2.5 hours**
