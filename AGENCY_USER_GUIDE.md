# Social Media Planner - Agency User Guide

**Version 1.0 | December 2025**

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Creating Posts](#creating-posts)
4. [Using Templates](#using-templates)
5. [Managing Approvals](#managing-approvals)
6. [Editing Posts](#editing-posts)
7. [Version History](#version-history)
8. [Analytics Dashboard](#analytics-dashboard)
9. [Admin Functions](#admin-functions)
10. [Tips & Best Practices](#tips--best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the App

1. Navigate to: `https://script.google.com/a/macros/finnpartners.com/s/[YOUR_DEPLOYMENT_ID]/exec`
2. Sign in with your @finnpartners.com Google account
3. You'll see the calendar dashboard upon login

### User Roles

- **Admin**: Full access to all features, user management, analytics
- **Content Creator**: Create and edit posts, submit for review
- **Approver**: Review and approve posts (internal or client)

Your role is displayed in the top-right corner next to your name.

---

## Dashboard Overview

### Calendar View

The main calendar shows all scheduled social media posts:

**Status Colors:**
- 🟦 **Blue (Scheduled)**: Approved and ready to post
- 🟪 **Purple (Published)**: Already posted
- 🟢 **Green (Approved)**: Client approved, ready to schedule
- 🔴 **Red (Client Review)**: Waiting for client approval
- 🟠 **Orange (Internal Review)**: Waiting for internal approval
- ⚪ **Gray (Draft)**: Not yet submitted for review

### Navigation Controls

**Top Bar:**
- **➕ Create Post** - Open post creation form
- **📋 Templates** - Manage post templates
- **👥 Admin** - User and client access management (Admins only)
- **📊 Analytics** - View performance metrics (Admins only)
- **🔄 Refresh** - Reload calendar data
- **⌨️ Shortcuts** - View keyboard shortcuts
- **🔔 Notifications** - View approval notifications
- **📥 My Approvals** - Quick access to pending approvals

**Calendar Controls:**
- **◀ ▶** - Navigate between months
- **Filter by Status** - Show only specific status types
- **Search** - Find posts by title, copy, or client name

### Post Display

Each post shows:
- Post title (first line of copy if no title)
- Client name
- Platform icons (LinkedIn, Facebook, etc.)
- 📸 Carousel indicator (if multiple images)
- Status color border
- Hover to preview images

---

## Creating Posts

### Step 1: Open the Form

Click **➕ Create Post** button in the top-left corner.

### Step 2: Choose a Template (Optional)

At the top of the form:
- Select a template from the **"Start from Template"** dropdown
- This pre-fills copy, hashtags, platforms, and category
- You can still edit everything after loading a template

### Step 3: Fill Out Basic Information

**Required Fields (marked with *):**

1. **Client** - Select the client this post is for
2. **Subsidiaries** - Check which client subsidiaries this post relates to (auto-loads based on client)
3. **Post Title** - Brief internal identifier (not shown to clients)
4. **Post Copy** - The actual social media content (2000 character limit)
5. **Scheduled Date** - When to publish
6. **Scheduled Time** - Time to publish (default: 12:30 PM)

**Optional Fields:**

7. **Hashtags** - Separate with spaces or commas
8. **Link URL** - Link to include in the post
9. **Content Category** - Type of content (News, Product, Event, etc.)
10. **Strategy Goal** - Align with strategic objectives
11. **Notes** - Internal notes for team (not visible to clients)
12. **Internal Notes** - Additional private notes

### Step 4: Select Platforms and Add Media

**For each platform you want to post to:**

1. Check the platform checkbox (LinkedIn, Facebook, Instagram, etc.)
2. A media section appears for that platform
3. **Media File URL** - Paste the Box.com shared link
   - **⚠️ IMPORTANT**: You must manually upload images to Box.com first
   - Copy the shared link and paste it here
   - **Known Issue**: Auto-upload to Box is not yet implemented
4. **Media Type** - Select "Image" or "Video"

**Multiple Images (Carousel):**
- For carousels, use a Box.com folder shared link
- The calendar will show a 📸 badge

### Step 5: Set Up Approvers (Optional)

By default, approvers come from client settings. To override:

1. **Internal Approvers** - Add specific @finnpartners.com emails (comma-separated)
2. **Client Approvers** - Add specific client emails (comma-separated)

Leave blank to use client-level defaults.

### Step 6: Share with Client (Important!)

**Share this change with client in change history**
- ✅ **Check this box** if you want the client to see this post creation in their change history
- ❌ **Leave unchecked** for internal drafts you don't want clients to see yet

### Step 7: Submit

Three options:

1. **Save as Draft** - Save without sending for review
2. **Submit for Internal Review** - Send to internal approvers
3. **Submit for Client Review** - Send directly to client (bypasses internal)

**Tips:**
- Use Draft for posts you're still working on
- Submit for Internal Review first for team feedback
- Only use Client Review if you're confident or it's already been internally approved

---

## Using Templates

Templates let you save commonly used post structures for faster content creation.

### Creating a Template

**From an Existing Post:**

1. Open any post detail view
2. Click **📋 Save as Template** button
3. Enter a template name (e.g., "Weekly Tip - LinkedIn", "Holiday Greeting")
4. Click OK

The template saves:
- Post copy
- Hashtags
- Platform selections
- Content category
- Link URL
- Client ID (makes it client-specific or global if left blank)

**What's NOT saved:**
- Scheduled date/time
- Specific approvers
- Media URLs (you'll add these when using the template)
- Status

### Using a Template

**Method 1: From Post Creation Form**

1. Click **➕ Create Post**
2. Select template from **"Start from Template"** dropdown
3. Form auto-fills with template data
4. Fill in date, client (if not already set), and media URLs
5. Submit normally

**Method 2: From Template Library**

1. Click **📋 Templates** button
2. Browse available templates
3. Click **✏️ Use** on the template you want
4. Post creation form opens with template pre-loaded

### Managing Templates

**View All Templates:**
- Click **📋 Templates** button
- See all active templates with details

**Each template shows:**
- Template name
- Description
- Created by and date
- Platforms
- Category
- Hashtags
- Copy preview
- Times used

**Delete a Template:**
1. Click **📋 Templates**
2. Click **🗑️ Delete** next to the template
3. Confirm deletion
4. Template is archived (soft delete - can be recovered by admin if needed)

**Template Tips:**
- Create templates for recurring content (holidays, weekly themes)
- Use descriptive names: "Product Launch - LinkedIn" not "Template 1"
- Create both client-specific and global templates
- Review and update templates quarterly

---

## Managing Approvals

### Viewing Your Pending Approvals

**Quick Access:**
- Click **📥 My Approvals** badge in top-right
- Shows count of pending approvals
- Opens approval dashboard

**Approval Dashboard shows:**
- Posts waiting for your approval
- Organized by Internal vs. Client Review
- Quick approve/reject buttons
- Filters by client

### Approving a Post

1. Click on the post to view details
2. Review:
   - Post copy
   - Scheduled date
   - Platforms and media
   - Change history (if edited)
3. Add comments (optional but recommended)
4. Click one of:
   - **✅ Approve** - Accept the post
   - **🔄 Request Changes** - Reject with feedback
   - **💬 Comment Only** - Add feedback without approving/rejecting

### What Happens After Approval?

**Internal Review:**
- If ALL internal approvers approve → Post moves to Client Review
- If ANY approver requests changes → Post returns to Draft

**Client Review:**
- If ALL client approvers approve → Post status becomes "Approved"
- If ANY approver requests changes → Post returns to Draft
- Agency gets notified and can make changes

### Approval Workflow Rules

**Draft → Internal Review → Client Review → Approved → Scheduled → Published**

**Important:**
- You can skip Internal Review and go straight to Client Review
- Internal approvers can edit posts in Draft or Internal Review status
- Once in Client Review, edits require client re-approval
- Use "Share with client" checkbox to control what clients see

---

## Editing Posts

### Opening a Post for Editing

**From Calendar:**
1. Click on any post
2. Post detail modal opens
3. Click **Edit Post** button

**From Approvals:**
1. Open post from approval dashboard
2. Click **Edit Post** button

### Making Edits

The edit form is identical to the create form. You can change:
- Post copy
- Hashtags
- Notes
- Scheduled date/time
- Platforms and media
- Approvers

**Share with Client Checkbox:**
- ✅ **Checked**: Client sees this change in their version history
- ❌ **Unchecked**: Internal edit, not visible to client

### Workflow-Aware Editing

**Editing in Different Statuses:**

1. **Draft** - Edit freely, no restrictions
2. **Internal Review** - You can edit and re-submit for internal review
3. **Client Review** - Edits create new version, may require re-approval
4. **Approved** - Edits return post to Draft for re-approval

### Submitting After Edit

**If post was in Draft:**
- Save as Draft
- Submit for Internal Review
- Submit for Client Review

**If post was in Internal Review:**
- Save changes and post stays in Internal Review
- OR Submit for Client Review

**If post was in Client Review or Approved:**
- Saving creates a new version
- Post returns to appropriate review stage

---

## Version History

Every post tracks all changes made over time. This is especially useful for client transparency.

### Viewing Version History

1. Open any post detail view
2. Scroll down to **"📜 Change History"** section
3. See all versions in reverse chronological order (newest first)

### What Each Version Shows

**Version Card Includes:**
- Date and time of change
- Who made the change
- Change type badge:
  - **Client Edit** - Change made by client
  - **Agency Edit** - Change made by agency
  - **Status Change** - Workflow status update
- Status at time of change
- **Old values** (red background) - what it was before
- **New values** (green background) - what it changed to

### Change Types

**Post_Copy**: Content changes
- Old copy shown in red
- New copy shown in green

**Hashtags**: Hashtag changes
**Notes**: Note changes
**Status**: Workflow progression

### Client Visibility

**What Clients See:**
- Only versions where "Share with client" was checked
- Status changes when post enters Client Review
- Final approved version

**What Clients DON'T See:**
- Internal drafts and edits
- Internal review iterations
- Any version marked as internal-only

**"Old" Values:**
- Clients never see "Old" values (intentionally hidden for privacy)
- They only see the NEW value of what was shared with them

---

## Analytics Dashboard

**⚠️ Admin Access Only**

### Accessing Analytics

1. Click **📊 Analytics** button in top navigation
2. Dashboard loads with metrics

### Overview Metrics

**Top Cards Show:**
- **Total Posts** - All posts in the system
- **Posts This Month** - Published this month
- **Approval Rate** - Percentage approved on first submission
- **Avg. Approval Time** - Days from submission to approval

### Posts by Status

Bar chart showing distribution:
- Draft
- Internal Review
- Client Review
- Approved
- Scheduled
- Published

### Posts by Client

**Top Clients Table:**
- Client name
- Total posts
- Published posts
- Approval rate
- Average approval time

**Subsidiary Breakdown:**
- Click client name to see subsidiary performance
- Shows which subsidiaries have most content

### Content Categories

**Category Distribution:**
- Pie chart of content types
- Helps track content mix
- Ensures balanced strategy

### Filters

**Filter by:**
- Date range (This Month, Last 30 Days, Last 90 Days, This Year, All Time)
- Specific client
- Status

**Export:**
- Click **Download Report** to export data to CSV

### Using Analytics for Strategy

**Monthly Check:**
- Are we hitting content targets?
- Which clients need more attention?
- Is approval rate declining? (may indicate quality issues)

**Quarterly Review:**
- Content category balance
- Client performance trends
- Approval time improvements

---

## Admin Functions

**⚠️ Admin Access Only**

### User Management

**Adding Team Members:**

1. Click **👥 Admin** button
2. Click **Team Members** tab
3. Click **+ Add Team Member**
4. Enter:
   - Email (must be @finnpartners.com)
   - Full name
   - Default role (Admin, Content Creator, Approver)
5. Click **Add User**

**Managing Users:**
- View all team members
- See last login dates
- Deactivate users (don't delete - preserves history)

### Client Access Management

**Granting Client Portal Access:**

1. Click **👥 Admin** → **Client Access** tab
2. Click **+ Grant Access**
3. Enter:
   - Client email address
   - Select client from dropdown
   - Choose access level:
     - **View Only** - See posts and history
     - **Approve** - Can approve/reject posts
4. Click **Grant Access**

**Managing Client Access:**
- View all client users
- Filter by client
- See last login
- Revoke access (soft delete)

**⚠️ Important Notes:**
- Client emails don't need to be specific domain
- Each client user sees ONLY their client's posts
- Access level can be changed later
- Revoking access preserves approval history

### System Configuration

**Client Settings:**
- Default internal approvers
- Default client approvers
- Active subsidiaries

**Platform Management:**
- Active platforms (managed in Platforms sheet)

**Categories & Goals:**
- Content categories (managed in Content_Categories sheet)
- Strategy goals (managed in Strategy_Goals sheet)

---

## Tips & Best Practices

### Content Creation

**✅ DO:**
- Use templates for recurring content
- Add descriptive post titles for easy searching
- Preview posts before submitting
- Include relevant hashtags
- Double-check scheduled dates
- Upload images to Box BEFORE creating post

**❌ DON'T:**
- Submit incomplete drafts for review
- Skip internal review for important posts
- Forget to select platforms
- Leave notes blank (use for context)

### Approval Workflow

**✅ DO:**
- Check approvals daily
- Leave constructive comments
- Approve quickly to meet deadlines
- Request changes with specific feedback
- Use version history to track edits

**❌ DON'T:**
- Approve without reviewing media
- Leave approvals pending indefinitely
- Approve posts with errors
- Request vague changes

### Client Communication

**✅ DO:**
- Share important edits with clients (check the box)
- Keep clients informed via comments
- Respond to client feedback promptly
- Mark internal iterations as internal-only

**❌ DON'T:**
- Share every minor internal tweak
- Make clients re-approve for typo fixes
- Forget to notify clients of deadline changes

### Organization

**✅ DO:**
- Use consistent naming for templates
- Archive old templates
- Keep calendar filters organized
- Review analytics monthly
- Clean up old drafts regularly

**❌ DON'T:**
- Create duplicate templates
- Let drafts pile up indefinitely
- Ignore declining approval rates

---

## Troubleshooting

### Common Issues

**Problem: Can't see the "Create Post" button**
- **Solution**: Check your user role. Only Admins and Content Creators can create posts.

**Problem: Template won't load in post creation form**
- **Solution**:
  1. Try clicking **🔄 Refresh** button next to template dropdown
  2. Close and reopen the post creation form
  3. Clear browser cache and reload page

**Problem: Images not showing in calendar**
- **Solution**:
  1. Ensure Box.com link is a shared link (not private)
  2. Check that Box link is correct (should start with `https://`)
  3. For carousels, use Box folder link, not individual file links
  4. Image preview on hover may take 2-3 seconds to load

**Problem: Approvals not showing in "My Approvals"**
- **Solution**:
  1. Refresh the page
  2. Check that you're listed as an approver on the post
  3. Verify email matches your login email exactly

**Problem: Client can't access portal**
- **Solution**:
  1. Verify access was granted in Admin → Client Access
  2. Check that client is using exact email that was granted access
  3. Ensure client is accessing the correct URL
  4. Try Incognito window (clears cache)

**Problem: Post stuck in "Loading..." on calendar**
- **Solution**:
  1. Click **🔄 Refresh** button
  2. Clear browser cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
  3. Open in Incognito window
  4. Contact admin if issue persists

**Problem: Changes not saving**
- **Solution**:
  1. Check internet connection
  2. Don't close form immediately after clicking Save
  3. Wait for success message before closing
  4. If error appears, screenshot and contact admin

**Problem: Email notifications not received**
- **Solution**:
  1. **Known Issue**: Email domain is currently set to @anthropic.com instead of @finnpartners.com
  2. Check spam folder
  3. Verify email in user profile is correct
  4. Contact admin to update email configuration

### Browser Compatibility

**Recommended Browsers:**
- ✅ Chrome (latest version)
- ✅ Edge (latest version)
- ✅ Safari (latest version)
- ⚠️ Firefox (mostly compatible, some visual glitches)

**Not Supported:**
- ❌ Internet Explorer

**Best Practice:**
- Use Chrome for best experience
- Always use latest browser version
- Enable JavaScript
- Allow cookies

### Performance Tips

**If app is slow:**
1. Close other browser tabs
2. Clear browser cache
3. Refresh the page
4. Use filters to reduce displayed posts
5. Disable browser extensions temporarily

**For large calendars (100+ posts):**
- Use date filters to show specific months
- Filter by specific clients
- Use search instead of scrolling

---

## Keyboard Shortcuts

Press **⌨️ Shortcuts** button in top navigation to view all shortcuts.

**Common Shortcuts:**
- **Ctrl/Cmd + K** - Quick search
- **Arrow Keys** - Navigate calendar months
- **Esc** - Close modal
- **Ctrl/Cmd + Enter** - Submit form
- **/** - Focus search

---

## Getting Help

**For Technical Issues:**
1. Check this guide's Troubleshooting section
2. Contact your system administrator
3. Email: [your-support-email@finnpartners.com]

**For Training:**
- Review this guide
- Watch training videos (if available)
- Request one-on-one walkthrough from admin

**For Feature Requests:**
- Submit via [feedback form/email]
- Discuss with team lead
- Regular feature review meetings

---

## Known Issues & Limitations

**⚠️ Features Not Yet Implemented:**

1. **Auto-Upload to Box.com**
   - **Current**: Must manually upload images to Box, then paste link
   - **Future**: Direct upload from post creation form
   - **Workaround**: Upload to Box first, copy shared link

2. **Email Notifications Domain**
   - **Current**: Emails send from @anthropic.com (test domain)
   - **Future**: Will send from @finnpartners.com
   - **Impact**: Some emails may go to spam

3. **Mobile App**
   - **Current**: Web app works on mobile but not optimized
   - **Future**: Native mobile app or PWA
   - **Workaround**: Use mobile browser, works but smaller interface

4. **Offline Mode**
   - **Current**: Requires internet connection
   - **Future**: Offline draft creation
   - **Impact**: Can't use without internet

5. **Bulk Image Upload**
   - **Current**: Must paste each platform's media URL individually
   - **Future**: Upload multiple images at once
   - **Workaround**: Use Box folders for carousels

6. **Calendar Export**
   - **Current**: No export to Google Calendar or CSV
   - **Future**: One-click export
   - **Workaround**: Manually add to calendar

**✅ Features Working Well:**
- Post creation and editing
- Approval workflows
- Version history
- Template library
- Analytics dashboard
- Client portal
- User management
- Notifications (within app)
- Search and filters

---

## Appendix: Glossary

**Terms:**
- **Post**: A piece of social media content
- **Platform**: Social media channel (LinkedIn, Facebook, etc.)
- **Client**: Customer account
- **Subsidiary**: Division or brand under a client
- **Approver**: Person who reviews and approves posts
- **Template**: Saved post structure for reuse
- **Version**: Historical record of post changes
- **Status**: Current stage in approval workflow
- **Carousel**: Multiple images in one post
- **Draft**: Post not yet submitted for review

---

**Document Version**: 1.0
**Last Updated**: December 28, 2025
**Prepared for**: FINN Partners Team
**Questions?** Contact [admin-email@finnpartners.com]
