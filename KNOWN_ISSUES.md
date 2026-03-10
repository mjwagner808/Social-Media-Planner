# Known Issues & Future Enhancements

**Version 1.0 | December 28, 2025**

This document tracks known limitations, bugs, and planned enhancements for the Social Media Planner application.

---

## Table of Contents

1. [Critical Issues](#critical-issues)
2. [High Priority Issues](#high-priority-issues)
3. [Medium Priority Issues](#medium-priority-issues)
4. [Low Priority Issues](#low-priority-issues)
5. [Feature Requests](#feature-requests)
6. [Future Enhancements](#future-enhancements)

---

## Critical Issues

### 🔴 1. Email Notifications Not Working

**Status**: OPEN | **Priority**: CRITICAL | **Impact**: All users - BLOCKING FEATURE

**Problem:**
Email notifications are **completely non-functional**. The system cannot send emails reliably to or from any domain.

**Test Results:**
- ❌ **Cannot send to @finnpartners.com addresses** (primary use case)
- ❌ **Cannot send from @finnpartners.com addresses** (sender domain)
- ✅ **ONE successful test**: Gmail → Yahoo (worked once, never again)
- ❌ **All subsequent attempts failed** (same Gmail → Yahoo test)
- ❌ **No emails received by intended recipients**
- ❌ **No emails in spam/junk folders**

**Root Cause (Suspected):**
- Google Apps Script `MailApp.sendEmail()` has strict quotas and limitations
- Possible authentication/permission issues with Google Workspace
- May be hitting daily email quota limits (even on first attempts)
- Apps Script may not be authorized to send emails on behalf of @finnpartners.com domain
- Google Workspace domain may require additional SPF/DKIM configuration
- App may be flagged for spam by Google's systems

**Impact:**
- **CRITICAL**: Approval workflows are broken
  - Approvers don't know when posts need review
  - Post creators don't know when posts are approved/rejected
- Manual email notifications required for ALL approvals
- Significantly slows down workflow
- Risk of missed deadlines
- Poor user experience

**Current Workaround:**
**⚠️ EMAIL NOTIFICATIONS DISABLED - Use these alternatives:**

1. **In-App Notifications (Primary Method)**
   - Click 🔔 bell icon in top-right corner
   - Check **📥 My Approvals** badge for pending approvals
   - Notifications appear immediately in-app

2. **Manual Email Notifications**
   - Content creators: Manually email approvers via regular email
   - Include post link: Copy from browser address bar
   - Example: "Please review post [Title] at [URL]"

3. **Daily Check-Ins**
   - Approvers: Check **📥 My Approvals** 2-3 times daily
   - Set calendar reminders to check for pending approvals

4. **Slack/Teams Integration** (if available)
   - Manually notify via team chat channels
   - Create dedicated approval channel

**Fix Required:**

**Immediate Investigation Needed:**
1. Check Apps Script execution logs for email errors
   - Open Apps Script Editor
   - View → Execution log
   - Look for `MailApp.sendEmail` failures

2. Verify Google Workspace email quotas
   - Check current quota usage
   - Standard limit: 100 emails/day for free accounts
   - G Suite: 1,500 emails/day

3. Check Apps Script permissions
   - Verify script has email sending permissions
   - Re-authorize if needed
   - Check OAuth scopes

4. Test basic email functionality
   - Create simple test function: `function testEmail() { MailApp.sendEmail('test@gmail.com', 'Test', 'Body'); }`
   - Run manually in Apps Script Editor
   - Check for errors in execution log

5. Google Workspace Admin Configuration
   - Verify Apps Script is enabled for domain
   - Check if domain blocks external email sending
   - Verify SPF records allow Apps Script emails
   - Configure DKIM signing if available

**Long-Term Solutions (Choose One):**

**Option A: Fix Apps Script Email (Recommended)**
- Work with Google Workspace admin
- Configure domain settings to allow Apps Script emails
- Add Apps Script to SPF records
- Test thoroughly with all domains (@finnpartners.com, Gmail, Yahoo, etc.)
- Estimated Time: 4-6 hours + admin support

**Option B: Third-Party Email Service**
- Integrate SendGrid, Mailgun, or AWS SES
- More reliable delivery
- Better tracking and analytics
- Requires API key setup
- Estimated Time: 8-10 hours

**Option C: Webhook to External System**
- Send notifications via webhook to Zapier/Make
- Zapier sends actual emails
- More complex but very flexible
- Estimated Time: 6-8 hours

**Files Affected:**
- `ApprovalService.js` (lines 42-65, 145-168 - email notification code)
- `NotificationService.js` (if exists)
- Need to add error handling and fallback logic

**Testing Checklist (After Fix):**
- [ ] Send to @finnpartners.com (internal)
- [ ] Send to @gmail.com (external)
- [ ] Send to @yahoo.com (external)
- [ ] Send to client domain (e.g., @clientcompany.com)
- [ ] Test 10+ emails in succession (check quota limits)
- [ ] Check spam folders
- [ ] Verify sender name displays correctly
- [ ] Test with CC and BCC
- [ ] Test HTML formatted emails

**Estimated Fix Time**: 4-10 hours depending on root cause and solution chosen

**Priority Level**: **URGENT** - This is a core feature that is currently non-functional

---

### 🔴 2. Box.com Auto-Upload Not Implemented

**Status**: OPEN | **Priority**: CRITICAL | **Impact**: All content creators

**Problem:**
- Users must manually upload images/videos to Box.com BEFORE creating posts
- Then copy shared link and paste into post creation form
- Time-consuming and error-prone workflow

**Current Workflow:**
1. Upload image to Box.com separately
2. Get shared link from Box
3. Copy link
4. Return to Social Media Planner
5. Paste link in media URL field
6. Repeat for each platform

**Desired Workflow:**
1. Click "Upload Image" in post creation form
2. Select file from computer
3. File auto-uploads to Box
4. Link auto-populates in form
5. Done!

**Why Not Implemented:**
- Requires Box.com API credentials
- FINN Partners has not provided Box API access yet
- Need Box Developer account and API keys

**Impact:**
- Slows down content creation significantly
- Increased chance of broken image links (copy/paste errors)
- Poor user experience

**Workaround:**
- Upload to Box first, then create post
- Use Box folder links for carousels
- Double-check links before submitting

**Fix Required:**
1. Obtain Box.com API credentials from FINN Partners IT
2. Create Box Developer app
3. Implement OAuth flow for Box authentication
4. Add file upload UI to post creation form
5. Handle upload to Box via API
6. Extract and store shared link
7. Test with various file types (images, videos, PDFs)

**Files to Create/Modify:**
- New: `BoxIntegrationService.js`
- Modify: `Index.html` (add upload UI)
- Modify: `DataService.js` (handle upload endpoint)

**Dependencies:**
- Box.com Developer account
- API client ID and secret
- OAuth redirect URI configuration

**Estimated Fix Time**: 6-8 hours (once API credentials available)

---

## High Priority Issues

### 🟠 3. Mobile UI Not Optimized

**Status**: OPEN | **Priority**: HIGH | **Impact**: Mobile users

**Problem:**
- App works on mobile browsers but layout not optimized
- Small text and buttons on phone screens
- Modals may extend beyond viewport
- Touch targets too small for fat fingers

**Impact:**
- Difficult to use on phones
- May require zooming and scrolling excessively
- Approval workflows harder on mobile

**Workaround:**
- Use on desktop/laptop when possible
- Use tablet for better experience
- Rotate phone to landscape for wider view

**Future Enhancement:**
- Responsive CSS improvements
- Larger touch targets
- Mobile-first modal designs
- Progressive Web App (PWA) for offline mode
- Native mobile app (iOS/Android)

**Estimated Fix Time**: 8-12 hours for responsive improvements

---

### 🟠 4. No Bulk Image Upload

**Status**: OPEN | **Priority**: HIGH | **Impact**: Multi-platform posts

**Problem:**
- Each platform's media URL must be entered individually
- If posting same image to 5 platforms = paste 5 times
- Time-consuming for multi-platform campaigns

**Current Workflow:**
- Select platforms (LinkedIn, Facebook, Instagram, Twitter, TikTok)
- Each platform section appears
- Paste Box link in each one individually

**Desired Workflow:**
- Upload images once
- Checkbox: "Use this image for all platforms"
- OR drag-and-drop to assign images to platforms

**Workaround:**
- Copy/paste link to each platform field
- Use Box folder link if all platforms use same images

**Future Enhancement:**
- Upload multiple images at once
- Drag-and-drop interface to assign images to platforms
- Preview how image will look on each platform

**Estimated Fix Time**: 4-5 hours

---

## Medium Priority Issues

### 🟡 5. No Calendar Export

**Status**: OPEN | **Priority**: MEDIUM | **Impact**: Planning workflows

**Problem:**
- Can't export calendar to Google Calendar
- Can't export to CSV/Excel for external sharing
- Can't print a nice monthly view

**Impact:**
- Difficult to share content calendar with stakeholders who don't have app access
- Can't integrate with other project management tools
- No backup of scheduled posts in external system

**Workaround:**
- Screenshot calendar for sharing
- Manually create external calendar entries
- Use Analytics dashboard export for data

**Future Enhancement:**
- **Google Calendar Sync**
  - One-click export to Google Calendar
  - Posts appear as calendar events
  - Updates sync automatically

- **CSV/Excel Export**
  - Export filtered posts to spreadsheet
  - Include all post details
  - Custom date range selection

- **Print View**
  - Print-friendly monthly layout
  - Shows post copy and images
  - Perfect for client presentations

**Estimated Fix Time**: 6-8 hours for all export features

---

### 🟡 6. No Undo for Bulk Delete

**Status**: OPEN | **Priority**: MEDIUM | **Impact**: Bulk operations

**Problem:**
- Bulk delete is permanent
- No undo or restore function
- Easy to accidentally delete wrong posts

**Impact:**
- High risk if wrong posts selected
- Lost work if mistake made
- No recovery option

**Workaround:**
- Double-check selection before deleting
- Use status filters to ensure correct posts selected
- Have admin restore from Google Sheets version history if needed

**Future Enhancement:**
- "Undo" button appears after bulk delete
- 30-second window to undo
- Soft delete (move to "Archived" status) instead of hard delete
- Trash bin to review deleted posts before permanent deletion

**Estimated Fix Time**: 3-4 hours

---

### 🟡 7. Limited Search Functionality

**Status**: OPEN | **Priority**: MEDIUM | **Impact**: Finding posts

**Problem:**
- Search only looks in post title and copy
- Can't search by client, platform, or date range
- No advanced filters

**Impact:**
- Hard to find specific posts in large calendars
- Must scroll to find posts from 6 months ago

**Workaround:**
- Use status filters to narrow down results
- Use browser Find (Ctrl+F) to search visible posts
- Navigate to specific month first

**Future Enhancement:**
- Advanced search with filters:
  - Client
  - Platform
  - Date range
  - Status
  - Category
  - Hashtags
- Save search filters as presets
- Recent searches dropdown

**Estimated Fix Time**: 4-5 hours

---

## Low Priority Issues

### 🟢 8. No Dark Mode

**Status**: OPEN | **Priority**: LOW | **Impact**: User preference

**Problem:**
- App only has light theme
- Bright white background
- Can cause eye strain in dark environments

**Impact:**
- Minor user comfort issue
- May prefer dark mode for evening work

**Workaround:**
- Use browser dark mode extensions
- Adjust screen brightness
- Use night light features on OS

**Future Enhancement:**
- Toggle between light and dark themes
- Remember user preference
- Auto-switch based on system theme

**Estimated Fix Time**: 4-6 hours

---

### 🟢 9. No Keyboard Shortcuts Help

**Status**: OPEN | **Priority**: LOW | **Impact**: Power users

**Problem:**
- Keyboard shortcuts exist but not documented in-app
- Users don't know shortcuts are available
- No cheat sheet or help overlay

**Current Shortcuts:**
- Arrow keys navigate months
- Esc closes modals
- Ctrl/Cmd+K for search (if implemented)

**Impact:**
- Users miss productivity features
- Slower workflow for power users

**Workaround:**
- See user guide for keyboard shortcuts
- Learn by trial and error

**Future Enhancement:**
- Press **?** to show keyboard shortcuts overlay
- Shortcuts section in help menu
- Tooltips showing keyboard shortcuts on hover

**Estimated Fix Time**: 2-3 hours

---

### 🟢 10. No Offline Mode

**Status**: OPEN | **Priority**: LOW | **Impact**: Limited connectivity scenarios

**Problem:**
- App requires internet connection
- Can't draft posts offline
- Can't view calendar without connection

**Impact:**
- Can't work during internet outages
- Travel scenarios with limited connectivity
- Minor inconvenience

**Workaround:**
- Ensure stable internet connection
- Draft posts in Google Docs offline, paste later
- Use mobile hotspot if needed

**Future Enhancement:**
- Progressive Web App (PWA) with service workers
- Cache posts for offline viewing
- Draft posts offline, sync when connection restored
- Offline indicator showing last sync time

**Estimated Fix Time**: 12-16 hours (complex feature)

---

## Feature Requests

These are user-requested features that would enhance the app but are not critical.

### 📝 11. Content Templates by Platform

**Requested by**: Content Creators | **Votes**: 3

**Description:**
- Templates optimized for each platform
- LinkedIn post template (professional tone, 140 chars)
- Instagram post template (casual tone, emoji-heavy, 30 hashtags)
- Twitter template (280 chars, short and punchy)

**Benefit:**
- Faster content creation
- Platform-appropriate tone
- Consistent brand voice per platform

**Estimated Time**: 3-4 hours

---

### 📝 12. Hashtag Suggestions

**Requested by**: Content Creators | **Votes**: 5

**Description:**
- AI-powered hashtag suggestions based on post content
- Show trending hashtags
- Show client's most-used hashtags
- Character count for hashtag compatibility per platform

**Benefit:**
- Discover relevant hashtags
- Maintain hashtag consistency
- Optimize for reach

**Estimated Time**: 8-10 hours (requires external API)

---

### 📝 13. Approval Delegation

**Requested by**: Approvers | **Votes**: 2

**Description:**
- Assign approvals to colleagues when on vacation
- Temporary delegation with date range
- Out-of-office auto-responder for approvals

**Benefit:**
- No approval bottlenecks during vacations
- Flexibility for team coverage
- Business continuity

**Estimated Time**: 5-6 hours

---

### 📝 14. Post Scheduling Recommendations

**Requested by**: Content Creators | **Votes**: 4

**Description:**
- Suggest optimal posting times based on platform and audience
- Show "Best time to post" badge on calendar
- Warn if scheduling multiple posts same day

**Benefit:**
- Optimize engagement
- Avoid post cannibalization
- Data-driven scheduling

**Estimated Time**: 6-8 hours (requires analytics integration)

---

### 📝 15. Client Activity Dashboard

**Requested by**: Account Managers | **Votes**: 3

**Description:**
- See when clients last logged in
- Track approval response times
- Identify clients who need follow-up

**Benefit:**
- Proactive client management
- Identify engagement issues
- Better client service

**Estimated Time**: 4-5 hours

---

## Future Enhancements

Long-term roadmap items for major features.

### 🚀 Phase 6: Advanced Analytics (Q1 2026)

**Features:**
- Engagement metrics (if integrated with social platforms)
- Best performing content analysis
- Sentiment analysis of post copy
- Competitive benchmarking
- Custom report builder
- Automated insights and recommendations

**Estimated Time**: 20-30 hours

**Dependencies:**
- Social media platform API access (LinkedIn, Facebook, etc.)
- Analytics data pipeline
- Machine learning models for insights

---

### 🚀 Phase 7: Workflow Automation (Q2 2026)

**Features:**
- Auto-assign approvers based on post type
- Scheduled post publication (auto-post to social media)
- Approval reminders (auto-escalate after X days)
- Recurring post templates (weekly/monthly auto-generation)
- Zapier/Make.com integration

**Estimated Time**: 30-40 hours

**Dependencies:**
- Social media publishing API credentials
- Workflow engine
- Integration platform connections

---

### 🚀 Phase 8: AI Content Assistant (Q3 2026)

**Features:**
- AI-powered copy suggestions
- Tone adjustment (professional, casual, urgent)
- Grammar and spell check
- Content optimization recommendations
- Image suggestions based on copy
- Translation for international posts

**Estimated Time**: 40-50 hours

**Dependencies:**
- OpenAI API or similar
- Image database/search API
- Translation API

---

### 🚀 Phase 9: Mobile Native App (Q4 2026)

**Features:**
- iOS and Android native apps
- Push notifications for approvals
- Offline draft creation
- Camera integration for direct photo upload
- Biometric authentication
- App Store and Play Store distribution

**Estimated Time**: 100-150 hours

**Dependencies:**
- React Native or Flutter framework
- Mobile development team
- App Store developer accounts
- Mobile backend infrastructure

---

## Reporting Bugs

**Found a bug?**

1. **Check if it's already listed above**
2. **Gather information:**
   - What were you trying to do?
   - What happened instead?
   - Browser and version
   - Screenshots of error
   - Console errors (F12 → Console tab)
3. **Report to:**
   - Email: [admin-email@finnpartners.com]
   - GitHub Issues: [repository-url]/issues (if using GitHub)
4. **Include:**
   - Steps to reproduce
   - Expected vs. actual behavior
   - Impact on your work
   - Urgency level

---

## Requesting Features

**Have an idea?**

1. **Check if it's already requested above**
2. **Describe:**
   - What problem does this solve?
   - How would you use this feature?
   - What benefit does it provide?
   - How urgent is it?
3. **Submit:**
   - Email: [admin-email@finnpartners.com]
   - Team feedback form: [feedback-url]
   - Monthly feature review meetings

**Feature Prioritization:**
- User votes
- Business impact
- Development effort
- Strategic alignment

---

## Version History

| Version | Date | Major Changes |
|---------|------|---------------|
| 1.0 | Dec 28, 2025 | Initial release - All 5 core phases complete + Evergreen Content Library |

---

**Document Version**: 1.0
**Last Updated**: December 28, 2025
**Next Review**: February 2026
**Maintained by**: Development Team
