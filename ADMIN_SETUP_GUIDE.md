# Social Media Planner - Admin Setup & Configuration Guide

**Version 1.0 | December 2025**

This guide is for system administrators responsible for deploying, configuring, and maintaining the Social Media Planner application.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Initial Deployment](#initial-deployment)
3. [Database Configuration](#database-configuration)
4. [User Management Setup](#user-management-setup)
5. [Client Configuration](#client-configuration)
6. [Email Notifications (Known Issue)](#email-notifications-known-issue)
7. [Ongoing Maintenance](#ongoing-maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Security & Permissions](#security--permissions)

---

## System Requirements

### Prerequisites

**Google Workspace:**
- G Suite/Google Workspace account
- Apps Script enabled
- Google Sheets access
- Sufficient Google Drive storage for database

**Development Tools:**
- Node.js (v14 or higher) for `clasp`
- `@google/clasp` npm package installed globally
- Git for version control

**Browser Requirements:**
- Chrome (recommended for testing)
- Edge or Safari (alternate testing)
- JavaScript enabled
- Cookies enabled

### Technical Stack

- **Platform**: Google Apps Script (V8 runtime)
- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks)
- **Database**: Google Sheets
- **Media Storage**: Box.com
- **Deployment**: Web App via Google Apps Script

---

## Initial Deployment

### Step 1: Clone the Repository

```bash
cd "/path/to/your/workspace"
git clone [repository-url]
cd "Social Media Planner"
```

### Step 2: Configure clasp

```bash
# Login to Google Apps Script
clasp login

# Create new Apps Script project (first time only)
clasp create --title "Social Media Planner" --type webapp

# Or link to existing project
clasp clone [SCRIPT_ID]
```

### Step 3: Update Configuration

**Edit Code.js:**

```javascript
// Line 6: Update with your Google Sheets database ID
var SPREADSHEET_ID = '1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss';
```

To find your Spreadsheet ID:
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
3. Copy the ID between `/d/` and `/edit`

### Step 4: Push Code to Apps Script

```bash
# Push all files
clasp push

# Verify files were pushed
clasp status
```

### Step 5: Deploy as Web App

**Option A: Via Command Line**
```bash
clasp deploy --description "Initial deployment"
```

**Option B: Via Apps Script Editor (Recommended)**

1. Open project in Apps Script:
   ```bash
   clasp open
   ```

2. In Apps Script Editor:
   - Click **Deploy** → **New deployment**
   - Type: **Web app**
   - Description: "Social Media Planner v1.0"
   - Execute as: **Me** (your admin account)
   - Who has access: **Anyone with Google account** (or specific domain)
   - Click **Deploy**

3. **Authorize the app:**
   - Click **Authorize access**
   - Select your Google account
   - Click **Advanced** → **Go to Social Media Planner**
   - Click **Allow**

4. **Copy the deployment URL:**
   - Format: `https://script.google.com/a/macros/finnpartners.com/s/{DEPLOYMENT_ID}/exec`
   - Save this URL - you'll give it to users

### Step 6: Test Deployment

1. Open deployment URL in Incognito window
2. Sign in with your @finnpartners.com account
3. Verify calendar loads
4. Create a test post
5. Check that data appears in Google Sheets

**✅ Deployment Checklist:**
- [ ] Calendar displays
- [ ] Can create posts
- [ ] Can edit posts
- [ ] Approvals work
- [ ] Templates load
- [ ] Analytics display
- [ ] Admin panel accessible
- [ ] Client portal works

---

## Database Configuration

### Google Sheets Structure

**Spreadsheet ID**: `1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss`

### Required Sheets

**1. Posts** - Main content table
- ID, Post_Title, Post_Copy, Scheduled_Date, Status, Client_ID, etc.

**2. Post_Platforms** - Platform-specific versions
- Post_ID, Platform, Media_File_URL, Media_Type

**3. Post_Approvals** - Approval workflow tracking
- Post_ID, Approval_Stage, Approver_Email, Approval_Status

**4. Post_Versions** - Change history
- Post_ID, Post_Copy_Old, Post_Copy_New, Changed_By, Changed_Date, Post_Status

**5. Clients** - Client accounts
- ID, Client_Name, Internal_Approver_Emails, Client_Approver_Emails

**6. Subsidiaries** - Client divisions
- ID, Subsidiary_Name, Client_ID, Status

**7. Users** - App users
- Email, Full_Name, Default_Role, Status, Created_Date

**8. Client_Access** - Client portal permissions
- Client_User_Email, Client_ID, Access_Level, Status

**9. Platforms** - Social media channels
- ID, Platform_Name, Icon, Status

**10. Content_Categories** - Post types
- ID, Category_Name, Description

**11. Strategy_Goals** - Strategic objectives
- ID, Goal_Name, Description

**12. Evergreen_Templates** - Post templates
- ID, Template_Name, Post_Copy, Hashtags, Platform_IDs, etc.

### Sheet Permissions

**Admin Access:**
- Full edit access to all sheets
- Can add/modify structure

**App Service Account:**
- Read access to all sheets
- Write access via Apps Script only

**Users:**
- No direct access to sheets (access via web app only)

---

## User Management Setup

### Adding Team Members

**Via Web Interface:**

1. Open the app as admin
2. Click **👥 Admin** → **Team Members**
3. Click **+ Add Team Member**
4. Enter:
   - Email (must be @finnpartners.com)
   - Full Name
   - Default Role:
     - **Admin** - Full access
     - **Content Creator** - Create and edit posts
     - **Approver** - Review and approve posts
5. Click **Add User**

**Direct in Google Sheets:**

1. Open **Users** sheet
2. Add new row:
   - Email: user@finnpartners.com
   - Full_Name: John Doe
   - Default_Role: Content Creator
   - Status: Active
   - Created_Date: (today's date)
   - Last_Login: (leave blank)

### User Roles Explained

**Admin:**
- All permissions
- User management
- Client access management
- Analytics access
- System configuration

**Content Creator:**
- Create posts
- Edit own posts
- Submit for review
- View analytics (read-only)
- Cannot manage users

**Approver:**
- Approve/reject posts
- Comment on posts
- View posts
- Cannot create/edit posts

### Deactivating Users

**Important**: Never delete users - set Status to "Inactive"

**Why?** Preserves:
- Approval history
- Post creation attribution
- Version history
- Audit trail

**How to Deactivate:**

1. Admin panel → Team Members
2. Find user
3. Click **Deactivate**
4. User can no longer log in
5. History remains intact

---

## Client Configuration

### Setting Up a New Client

**Step 1: Add Client Record**

1. Open **Clients** sheet in database
2. Add new row:
   - ID: Generate using format `CLT-###` (e.g., CLT-001, CLT-002)
   - Client_Name: Full company name
   - Internal_Approver_Emails: Comma-separated FINN Partners emails
   - Client_Approver_Emails: Comma-separated client emails
   - Status: Active
   - Created_Date: Today's date

**Step 2: Add Subsidiaries** (if applicable)

1. Open **Subsidiaries** sheet
2. For each subsidiary/brand:
   - ID: Generate using format `SUB-###`
   - Subsidiary_Name: Division or brand name
   - Client_ID: Link to client (e.g., CLT-001)
   - Status: Active

**Step 3: Grant Client Portal Access**

**Via Web Interface:**

1. Open app as admin
2. Click **👥 Admin** → **Client Access**
3. Click **+ Grant Access**
4. Enter:
   - Client email address
   - Select client from dropdown
   - Access level:
     - **View Only** - See posts and history
     - **Approve** - Can approve/reject
5. Click **Grant Access**

**Client receives:**
- Access to portal at same URL as agency
- Can only see their client's posts
- Email with login instructions

### Client Portal URL

Clients use the SAME URL as agency users:
- `https://script.google.com/a/macros/finnpartners.com/s/{DEPLOYMENT_ID}/exec`

The app automatically detects:
- Is this an agency user (@finnpartners.com) → Show full calendar
- Is this a client user (in Client_Access table) → Show client portal
- Unauthorized → Show error

### Revoking Client Access

**Important**: Soft delete only (preserves approval history)

1. Admin panel → Client Access
2. Find client user
3. Click **Revoke Access**
4. User can no longer log in
5. Approval history preserved

---

## Email Notifications (Known Issue)

### Current Status

**⚠️ CRITICAL KNOWN ISSUE**

Email notifications currently send from **@anthropic.com** instead of **@finnpartners.com**.

**Impact:**
- Emails may go to spam
- Users confused by sender domain
- Looks unprofessional

### Temporary Workaround

**Until Fixed:**
1. Notify users to check spam folders
2. Add @anthropic.com to safe senders list
3. Use in-app notifications as primary method
4. Manually notify via regular email for critical approvals

### Future Fix Required

**Location to Update:** `NotificationService.js` or `ApprovalService.js`

**Current Code:**
```javascript
function sendEmail(recipient, subject, body) {
  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: body,
    // name: 'FINN Partners Social Media'  // Add this
  });
}
```

**Needed:**
- Configure Google Workspace to allow Apps Script emails
- Update sender name to "FINN Partners Social Media"
- Verify SPF/DKIM records for deliverability
- Test with internal and external recipients

### Email Types Sent

1. **Approval Requests**
   - To: Designated approvers
   - When: Post submitted for review
   - Content: Post title, link to approve

2. **Approval Decisions**
   - To: Post creator
   - When: Approver approves or requests changes
   - Content: Decision, comments, link to post

3. **Comment Notifications**
   - To: Post stakeholders
   - When: Someone adds a comment
   - Content: Commenter, comment text, link to post

---

## Ongoing Maintenance

### Regular Tasks

**Daily:**
- Monitor for errors in Apps Script logs
- Check that approvals are processing

**Weekly:**
- Review new user requests
- Check client access requests
- Monitor analytics for unusual patterns

**Monthly:**
- Archive old drafts (Status = "Draft", created > 90 days ago)
- Review and update templates
- Check storage usage in Google Drive
- Update documentation if features changed

**Quarterly:**
- Audit user access (remove inactive users)
- Review client access permissions
- Check database performance
- Plan feature enhancements

### Deployment Updates

**When to Deploy New Version:**
- Bug fixes
- Feature additions
- UI improvements
- Performance enhancements

**How to Deploy Update:**

1. Make code changes locally
2. Test thoroughly in development

3. Push to Apps Script:
   ```bash
   clasp push
   ```

4. Create new deployment version:
   - Apps Script Editor → **Deploy** → **Manage deployments**
   - Click ✏️ next to active deployment
   - **New version** → Add description
   - Click **Deploy**

5. Test in Incognito window (bypasses cache)

6. Notify users of changes

**⚠️ Important:**
- Always test in Incognito after deployment (cache issues!)
- Don't deploy during business hours if possible
- Keep backup of previous version
- Have rollback plan

### Database Maintenance

**Backup Strategy:**

1. **Automated:**
   - Google Sheets auto-saves and version history
   - Can restore to any point in time

2. **Manual:**
   - Weekly: File → Make a copy → Name with date
   - Store in secure Drive folder
   - Keep 4 weeks of backups

**Performance:**
- Sheets perform well up to ~10,000 rows per sheet
- If approaching limit, consider archiving old data
- Posts: Archive published posts > 1 year old to separate sheet
- Approvals: Archive approved approvals > 6 months old

### Monitoring

**Apps Script Execution Logs:**

1. Open Apps Script Editor (clasp open)
2. **View** → **Execution log**
3. Look for errors or warnings
4. Check execution times (>30 seconds = potential issue)

**What to Monitor:**
- Error rates (should be <1%)
- Execution times (most functions <5 seconds)
- User authentication issues
- Database read/write errors

---

## Troubleshooting

### Common Admin Issues

**Issue: Users can't access app**

**Solutions:**
1. Verify deployment is set to "Anyone with Google account"
2. Check user email is in Users sheet with Status = "Active"
3. Ensure user is using @finnpartners.com email
4. Try Incognito window (clears auth cache)
5. Check Apps Script execution logs for auth errors

**Issue: Changes not appearing after deployment**

**Solutions:**
1. **Clear cache** - Critical step! Always test in Incognito
2. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Verify new version number in deployment
4. Check that correct deployment is active (can only have one)
5. Wait 2-3 minutes for Google's CDN to update

**Issue: Database not updating**

**Solutions:**
1. Check SPREADSHEET_ID in Code.js matches your sheet
2. Verify Apps Script has permissions to access sheet
3. Check execution logs for permission errors
4. Re-authorize the app (Deploy → Test deployments → Remove → Re-add)

**Issue: Approval emails not sending**

**Solutions:**
1. **Known Issue**: Check email notification section above
2. Verify recipient email is correct
3. Check Apps Script execution logs for MailApp errors
4. Ensure daily email quota not exceeded (100-1500/day depending on account)
5. Temporarily use in-app notifications only

**Issue: Images not loading**

**Solutions:**
1. Verify Box.com links are shared links (not private)
2. Check Box link format (should start with https://)
3. Test Box link in new browser tab
4. Ensure Box account is active

**Issue: Templates not loading**

**Solutions:**
1. Check if Evergreen_Templates sheet exists
2. Verify templates have Status = "Active"
3. Clear browser cache
4. Check console for JavaScript errors

---

## Security & Permissions

### Access Control

**Apps Script Project:**
- Owner: Admin account
- Editors: Development team only
- Viewers: None (keeps code private)

**Google Sheet Database:**
- Owner: Admin account or service account
- Editors: Admin only
- Viewers: Apps Script service account (automatic)
- Users: No direct access (app mediates all access)

### Data Privacy

**PII Handling:**
- User emails stored in Users and Client_Access sheets
- Post content may contain client confidential info
- All data stays within Google Workspace
- No data sent to third parties (except Box.com for images)

**GDPR Considerations:**
- Users can request data deletion (set Status = "Inactive")
- Export user data via Sheets download
- Audit trail preserved for legal requirements

### Authentication

**Agency Users:**
- Must sign in with @finnpartners.com Google account
- Single Sign-On (SSO) via Google Workspace
- No passwords stored in app

**Client Users:**
- Can use any email address
- Must be granted explicit access
- Listed in Client_Access sheet

### Best Practices

**✅ DO:**
- Use service account for deployment
- Enable 2FA on admin accounts
- Regularly audit user access
- Keep backups
- Monitor execution logs
- Test changes in development first

**❌ DON'T:**
- Share deployment URL publicly
- Give editor access to non-developers
- Directly edit database during business hours
- Delete users or posts (soft delete only)
- Deploy without testing

---

## Appendix: File Structure

### Apps Script Files

**Backend:**
- `Code.js` - Entry point, doGet(), shared utilities
- `DataService.js` - Data endpoints, CRUD operations
- `ApprovalService.js` - Approval workflow engine
- `NotificationService.js` - Email notifications
- `UserManagementService.js` - User and access management
- `Utils.js` - Helper functions

**Frontend:**
- `Index.html` - Main calendar dashboard (agency view)
- `client-portal.html` - Client portal view
- `ApprovalDashboard.html` - Approval interface

**Configuration:**
- `appsscript.json` - Apps Script manifest
- `.clasp.json` - Clasp configuration
- `.claspignore` - Files to exclude from push

**Documentation:**
- `CLAUDE.md` - Project instructions for AI assistance
- `Build Plan.md` - Development roadmap
- `AGENCY_USER_GUIDE.md` - User documentation
- `CLIENT_USER_GUIDE.md` - Client documentation
- `ADMIN_SETUP_GUIDE.md` - This file
- `KNOWN_ISSUES.md` - Bug tracker

### Database Sheets Reference

| Sheet Name | Purpose | Key Columns |
|------------|---------|-------------|
| Posts | Main post data | ID, Post_Copy, Scheduled_Date, Status, Client_ID |
| Post_Platforms | Platform-specific data | Post_ID, Platform, Media_File_URL |
| Post_Approvals | Approval records | Post_ID, Approver_Email, Approval_Status |
| Post_Versions | Change history | Post_ID, Changed_By, Changed_Date, Post_Status |
| Clients | Client accounts | ID, Client_Name, Internal_Approver_Emails |
| Subsidiaries | Client divisions | ID, Subsidiary_Name, Client_ID |
| Users | Agency users | Email, Full_Name, Default_Role, Status |
| Client_Access | Client portal access | Client_User_Email, Client_ID, Access_Level |
| Platforms | Social channels | ID, Platform_Name, Icon |
| Content_Categories | Post types | ID, Category_Name |
| Strategy_Goals | Strategic objectives | ID, Goal_Name |
| Evergreen_Templates | Post templates | ID, Template_Name, Post_Copy, Platform_IDs |

---

## Support & Resources

### Internal Resources

**Repository:** [Git repository URL]
**Documentation:** See markdown files in root directory
**Development Team:** [team contact]

### External Resources

- **Google Apps Script Docs**: https://developers.google.com/apps-script
- **Clasp CLI**: https://github.com/google/clasp
- **Google Sheets API**: https://developers.google.com/sheets/api

### Getting Help

**For Development:**
- Check CLAUDE.md for AI coding assistance guidelines
- Review Build Plan.md for architecture decisions
- Check git commit history for change context

**For Production Issues:**
- Review Apps Script execution logs first
- Check this troubleshooting section
- Contact development team with screenshots and error messages

---

**Document Version**: 1.0
**Last Updated**: December 28, 2025
**Maintained by**: FINN Partners Development Team
**Next Review**: March 2026
