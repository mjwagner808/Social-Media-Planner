# Build Plan: Complete Social Media Planner

## Overview

Now that the calendar view is ready, here's the roadmap to complete the system.

---

## Phase 1: Calendar Foundation ✅ COMPLETE

**Status:** DONE
**Files:** CalendarDashboard.html ready for deployment

**Features Delivered:**
- ✅ Monthly calendar view
- ✅ Posts displayed on scheduled dates
- ✅ Status color-coding
- ✅ Client and status filtering
- ✅ Month navigation
- ✅ Approval badge counter
- ✅ Responsive design

**Time Invested:** ~2-3 hours

---

## Phase 2: Post Creation Form

**Goal:** Let users create new posts through the UI

**Estimated Time:** 6-8 hours

### Features to Build

1. **Create Post Button Modal**
   - Opens modal/slide-in form
   - Full-screen on mobile
   - Close button

2. **Form Fields**
   - Client dropdown (populated from Clients sheet)
   - Subsidiaries checkboxes
   - Post title input
   - Post copy textarea (with character counter)
   - Scheduled date picker
   - Scheduled time picker
   - Content category dropdown
   - Campaign dropdown (optional)
   - Hashtags input
   - Link URL input
   - Notes textarea

3. **Platform Selection**
   - Checkboxes for each platform
   - Per-platform image upload
   - Media type selector (Image/Video)
   - Preview thumbnails

4. **Validation**
   - Required fields marked
   - Client-side validation
   - Error messages
   - Confirm before submit

5. **Backend Integration**
   - Create new `createPostFromUI()` function
   - Generate post ID
   - Insert into Posts sheet
   - Insert into Post_Platforms sheet (for each platform)
   - Return success/error

6. **After Submit**
   - Success message
   - Clear form
   - Refresh calendar
   - Option to submit for review immediately

### Files to Create/Modify

**New Files:**
- `PostCreationForm.html` (included in Index.html)

**Modified Files:**
- `Index.html` (add modal and form)
- `DataService.gs` (add createPostFromUI function)

### Success Criteria

- [ ] User can open form from "Create Post" button
- [ ] All form fields work correctly
- [ ] Validation prevents invalid submissions
- [ ] Post saves to Posts sheet
- [ ] Platforms save to Post_Platforms sheet
- [ ] Calendar refreshes and shows new post
- [ ] Form clears after successful creation

---

## Phase 3: Post Detail View

**Goal:** Show full post details when clicked

**Estimated Time:** 6-8 hours

### Features to Build

1. **Post Detail Modal**
   - Opens when post clicked
   - Shows all post metadata
   - Close button

2. **Content Display**
   - Post title (large)
   - Client and subsidiary names
   - Scheduled date and time
   - Status badge
   - Content category
   - Campaign (if set)
   - Full post copy
   - Hashtags
   - Link URL (clickable)

3. **Platform Versions**
   - Tabs for each platform
   - Platform-specific images
   - Image preview/download
   - Media type indicator

4. **Comments Section**
   - Show all comments chronologically
   - User name and timestamp for each
   - Add new comment form
   - Submit button

5. **Approval History**
   - Timeline of approval actions
   - Who approved/rejected
   - When
   - Any notes

6. **Action Buttons**
   - Edit (for creators)
   - Submit for Review (if Draft)
   - Approve (if pending approval)
   - Request Changes (if pending approval)
   - Delete (for admins)

### Backend Functions Needed

**New Functions:**
- `getPostDetails(postId)` - Get full post with platforms
- `addComment(postId, comment)` - Add comment to post
- `getPostComments(postId)` - Get all comments
- `getApprovalHistory(postId)` - Get approval timeline

### Files to Create/Modify

**New Files:**
- `PostDetail.html` (included in Index.html)

**Modified Files:**
- `Index.html` (add modal and detail view)
- `DataService.gs` (add new functions)

### Success Criteria

- [ ] Clicking post opens detail modal
- [ ] All post data displays correctly
- [ ] Platform tabs work
- [ ] Images display with previews
- [ ] Comments section shows all comments
- [ ] User can add new comments
- [ ] Approval history displays correctly
- [ ] Action buttons show based on role and status
- [ ] Actions work (approve, request changes, etc.)

---

## Phase 4: Integration & Polish

**Goal:** Connect all pieces and improve UX

**Estimated Time:** 4-6 hours

### Features to Build

1. **Approval Dashboard Integration**
   - Link from "My Approvals" badge
   - Show in modal or separate view
   - Keep existing approval cards
   - Add "View Post" button that opens detail modal

2. **Calendar Enhancements**
   - Add "more posts" indicator when >4 posts in a day
   - Click day to see all posts for that day
   - Add week numbers (optional)
   - Add quick actions menu (right-click)

3. **Navigation Improvements**
   - Breadcrumbs
   - Back button functionality
   - Keyboard shortcuts (arrow keys for navigation)

4. **Loading States**
   - Skeleton screens
   - Progress indicators
   - Optimistic UI updates

5. **Error Handling**
   - User-friendly error messages
   - Retry mechanisms
   - Fallback states

6. **Performance**
   - Cache frequently accessed data
   - Lazy load images
   - Debounce filter changes

### Success Criteria

- [ ] Approval dashboard accessible from calendar
- [ ] All components work together seamlessly
- [ ] No broken links or dead-ends
- [ ] Smooth transitions between views
- [ ] Fast load times
- [ ] Graceful error handling
- [ ] Works on mobile devices

---

## Phase 5: Strategy Dashboard

**Goal:** Track performance against goals

**Estimated Time:** 6-8 hours

### Features to Build

1. **Overview Metrics**
   - Posts this week vs. planned
   - Posts this month vs. planned
   - Approval rate
   - Average approval time

2. **Content Category Distribution**
   - Chart showing planned vs. actual
   - By category
   - Month-over-month trends

3. **Client Performance**
   - Posts by client
   - On-time percentage
   - Approval success rate

4. **Goal Tracking**
   - List of strategy goals from Strategy_Goals sheet
   - Progress bars
   - Status indicators

5. **Charts**
   - Bar charts for distribution
   - Line charts for trends
   - Pie charts for categories
   - Use Chart.js or similar

### Backend Functions Needed

**New Functions:**
- `getStrategyMetrics(month, year)` - Calculate metrics
- `getGoalProgress()` - Compare actual vs. planned
- `getCategoryDistribution()` - Calculate category %

### Files to Create/Modify

**New Files:**
- `StrategyDashboard.html` (included in Index.html)

**Modified Files:**
- `Index.html` (add dashboard view)
- `DataService.gs` (add analytics functions)

### Success Criteria

- [ ] Metrics calculate correctly
- [ ] Charts display properly
- [ ] Data updates in real-time
- [ ] Can filter by date range
- [ ] Can filter by client
- [ ] Export functionality works

---

## Development Timeline

### Week 1 (Now)
**Days 1-2:**
- ✅ Calendar view (DONE)
- Deploy and test calendar

**Days 3-4:**
- Build post creation form
- Backend integration
- Testing

**Day 5:**
- Build post detail view
- Basic comment functionality

### Week 2
**Days 1-2:**
- Complete post detail view
- Approval integration
- Comments system

**Days 3-4:**
- Polish and integration
- Bug fixes
- User testing

**Day 5:**
- Strategy dashboard basics
- Final testing
- Documentation

### Week 3 (Optional Enhancement)
- Advanced features
- Performance optimization
- Additional integrations

---

## Build Order Rationale

### Why This Order?

**1. Calendar First**
- Main interface users need
- Shows existing content
- Navigation hub for everything else

**2. Post Creation Second**
- Users need to create content
- Feeds data to calendar
- Enables testing full workflow

**3. Post Detail Third**
- Natural click target from calendar
- Combines viewing + actions
- Comments integrated here

**4. Integration Fourth**
- Connects all pieces
- Polish existing features
- Improve UX

**5. Strategy Last**
- Reporting on existing data
- Nice-to-have analytics
- Doesn't block core workflow

---

## Technical Stack

### Frontend
- HTML5
- CSS3 (no frameworks, custom design)
- Vanilla JavaScript (no dependencies)
- Google Apps Script client-side API

### Backend
- Google Apps Script (JavaScript ES5)
- Google Sheets as database
- Gmail API for notifications

### No External Dependencies
- No npm packages
- No CDN libraries
- Pure Google Workspace stack

---

## Key Design Principles

### 1. Calendar-Centric
Every feature connects to the calendar as the central hub.

### 2. Progressive Disclosure
Show basic info by default, details on demand.

### 3. Status-Driven
Visual status indicators everywhere for quick scanning.

### 4. Mobile-First
Responsive design, works on phones and tablets.

### 5. Fast & Simple
Minimal clicks, clear actions, instant feedback.

---

## Feature Checklist

### Core Features
- [x] Calendar view with posts
- [x] Status color-coding
- [x] Filtering (client, status)
- [x] Month navigation
- [ ] Post creation form
- [ ] Post detail view
- [ ] Comments system
- [ ] Approval workflow UI
- [ ] Strategy dashboard

### Workflow Features
- [x] Submit for review
- [x] Approve posts
- [x] Request changes
- [x] Email notifications
- [ ] Edit posts
- [ ] Delete posts
- [ ] Bulk actions

### User Experience
- [x] Loading states
- [x] Error handling
- [ ] Keyboard shortcuts
- [ ] Mobile optimization
- [ ] Print-friendly views
- [ ] Export functionality

---

## Success Metrics

### Phase 2 Complete When:
- Users can create posts through UI
- Posts appear on calendar immediately
- All required fields validate correctly

### Phase 3 Complete When:
- Users can view full post details
- Users can add comments
- Users can approve/reject from detail view

### Phase 4 Complete When:
- All features work together
- No broken navigation
- Smooth user experience

### Phase 5 Complete When:
- Strategy metrics display accurately
- Goals tracked automatically
- Reports can be generated

---

## Next Steps

**Right Now:**
1. Deploy calendar dashboard
2. Test with real data
3. Gather user feedback

**This Week:**
1. Build post creation form
2. Build post detail view
3. Test end-to-end workflow

**Next Week:**
1. Polish and integrate
2. Add strategy dashboard
3. Final testing and launch

---

## Questions to Consider

### Before Starting Phase 2:
1. What fields are absolutely required for post creation?
2. Should images be required or optional?
3. Can users create posts for any client or only their assigned clients?
4. Should draft posts appear on the calendar?

### Before Starting Phase 3:
1. Who can edit posts after creation?
2. Can comments be edited/deleted?
3. Should approval history be collapsible?
4. What actions are available in each status?

### Before Starting Phase 5:
1. What metrics are most important?
2. How far back should historical data go?
3. Who can see strategy dashboard?
4. What export formats are needed?

---

## Risk Mitigation

### Potential Issues:
1. **Large datasets** - Calendar may slow with 100+ posts per month
   - *Solution:* Paginate, cache, optimize queries

2. **Image uploads** - Google Drive integration complexity
   - *Solution:* Use base64 for small images, Drive for large

3. **Date parsing** - Different date formats cause issues
   - *Solution:* Standardize format, add parsing helpers

4. **Browser compatibility** - Older browsers may break
   - *Solution:* Test on IE11, Safari, mobile browsers

5. **Permission errors** - Users may not have spreadsheet access
   - *Solution:* Better error messages, onboarding guide

---

## Documentation Needed

### For Developers:
- [x] Deployment guide
- [ ] API documentation
- [ ] Code style guide
- [ ] Testing procedures

### For Users:
- [ ] User guide
- [ ] Quick start tutorial
- [ ] FAQ
- [ ] Video walkthrough

### For Admins:
- [ ] Setup guide
- [ ] Troubleshooting guide
- [ ] Maintenance procedures
- [ ] Backup/restore process

---

## Summary

**Current State:** Calendar dashboard ready
**Next Build:** Post creation form (6-8 hours)
**After That:** Post detail view (6-8 hours)
**Timeline:** 2-3 weeks to complete system
**Effort:** ~30-40 hours total development time

**You're 30% complete with core features!**

The calendar foundation is solid. Now we build the content creation and detail views that users need to actually USE the calendar effectively.

Ready to build the post creation form next?
