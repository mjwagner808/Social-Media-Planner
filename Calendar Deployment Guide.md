# Calendar Dashboard - Deployment Guide

## What You're Getting

A production-ready **calendar-first dashboard** that shows all your social media posts on a monthly calendar view with:

✅ Monthly calendar with posts displayed on scheduled dates
✅ Color-coded status indicators (Draft, In Review, Approved, etc.)
✅ Client and status filtering
✅ Navigation (previous/next month, today button)
✅ Pending approval badge in header
✅ Click posts to view details (placeholder for next phase)
✅ Mobile-responsive design
✅ Professional UI matching Google Workspace style

---

## Deployment Steps

### Step 1: Back Up Current Code

1. In Apps Script editor, go to **Index.html**
2. Select all and copy to a safe place (just in case)
3. Label it "Index_OLD.html" in a text file

### Step 2: Replace Index.html

1. Open **CalendarDashboard.html** from outputs
2. Copy ALL the content
3. In Apps Script editor, open **Index.html**
4. Delete all existing content
5. Paste the new calendar dashboard code
6. Click **Save** (Ctrl+S / Cmd+S)

### Step 3: Verify Backend Functions

Make sure these functions exist in your Apps Script files (they should already):

**Required in DataService.gs:**
- `getAllPosts()` ✓
- `getAllClients()` ✓
- `getPostById()` ✓

**Required in ApprovalService.gs:**
- `getMyPendingApprovals()` ✓

**Required in Code.gs:**
- `doGet()` ✓

All these functions already exist, so no changes needed!

### Step 4: Deploy New Version

1. In Apps Script editor, click **Deploy** → **Manage deployments**
2. Click the pencil icon (✏️) next to your current deployment
3. Click **Version** → **New version**
4. Add description: "Calendar View v1.0"
5. Click **Deploy**
6. Copy the new web app URL (it will be the same)
7. Click **Done**

### Step 5: Test the Calendar

1. Open your web app URL
2. You should see:
   - Monthly calendar (default: current month)
   - Posts from your database displayed on their scheduled dates
   - Color-coded by status
   - Filter dropdowns (client, status)
   - Navigation arrows and "Today" button
   - "My Approvals" button with count badge
   - Legend showing status colors

3. Test these features:
   - ✅ Click previous/next month arrows
   - ✅ Click "Today" to return to current month
   - ✅ Select a client from dropdown (should filter posts)
   - ✅ Select a status from dropdown (should filter posts)
   - ✅ Click a post (shows "coming soon" message)
   - ✅ Click "My Approvals" badge

---

## What's Different

### Before (Old Dashboard)
```
Login → Basic dashboard
  ├── Data dump buttons
  ├── Submit post by ID
  └── View approvals
```

### After (New Calendar Dashboard)
```
Login → Calendar view (main interface)
  ├── Monthly calendar with posts
  ├── Filter by client/status
  ├── Navigate months
  ├── Click posts (placeholder)
  └── View approvals (badge)
```

---

## Features Breakdown

### 1. Calendar Grid
- Shows current month by default
- Posts appear on their scheduled dates
- Today's date highlighted in blue
- Empty dates shown in gray
- Each cell shows up to ~4 posts (scrollable)

### 2. Status Color-Coding
| Status | Color | Visual |
|--------|-------|--------|
| Draft | Gray | ⚫ |
| Internal Review | Yellow/Orange | 🟡 |
| Client Review | Red | 🔴 |
| Approved | Green | 🟢 |
| Scheduled | Blue | 🔵 |
| Published | Light Blue | 🔵 |

### 3. Filtering
- **Client Filter:** Shows only posts for selected client
- **Status Filter:** Shows only posts with selected status
- **Combined:** Both filters work together
- **Clear:** Select "All" to reset

### 4. Navigation
- **Previous/Next Arrows:** Move between months
- **Today Button:** Jump back to current month
- **Month/Year Display:** Shows which month you're viewing

### 5. Post Items
- Show post title (truncated to 20 chars)
- Color-coded by status
- Dot indicator matching status color
- Click to view details (Phase 2 feature)
- Hover shows full title

### 6. Approval Badge
- Shows count of pending approvals
- Updates on page load
- Red badge for visibility
- Click to view approvals (integration coming)

---

## How It Works (Technical)

### Data Flow
```
1. Page loads → calls getAllPosts() and getAllClients()
2. Posts and clients stored in JavaScript variables
3. Calendar renders posts on their scheduled dates
4. Filters update JavaScript, re-render calendar
5. Navigation changes month, re-render calendar
```

### Date Matching
The calendar matches posts to dates by:
1. Reading post's `Scheduled_Date` field
2. Parsing to JavaScript Date object
3. Comparing day, month, year to calendar date
4. Displaying post if matches

### Status Detection
Post status comes from `Status` column in Posts sheet:
- Draft
- Internal_Review
- Client_Review
- Approved
- Scheduled
- Published

**Important:** Status must match exactly (case-sensitive, underscores matter)

---

## Troubleshooting

### Issue: Calendar is blank
**Causes:**
1. No posts in database
2. Posts missing `Scheduled_Date`
3. Posts scheduled in different month

**Solutions:**
1. Add test posts to Posts sheet
2. Ensure Scheduled_Date column has dates
3. Navigate to correct month
4. Check browser console for errors

### Issue: Posts not appearing on correct dates
**Cause:** Date format mismatch

**Solution:**
1. Check Scheduled_Date format in Posts sheet
2. Should be: `MM/DD/YYYY` or `YYYY-MM-DD`
3. Ensure column is formatted as Date in Sheets

### Issue: Filter dropdown empty
**Cause:** No clients in Clients sheet or loading error

**Solution:**
1. Verify Clients sheet has data
2. Check browser console for errors
3. Verify `getAllClients()` function works

### Issue: "Error loading calendar data"
**Causes:**
1. Spreadsheet ID incorrect
2. Backend function errors
3. Permission issues

**Solutions:**
1. Check SPREADSHEET_ID in Code.gs
2. Run backend functions in Script Editor to test
3. Verify spreadsheet sharing permissions

### Issue: Approval badge always shows 0
**Cause:** getMyPendingApprovals() returning empty or error

**Solution:**
1. Check Post_Approvals sheet has data
2. Verify your email matches Approver_Email column
3. Ensure Status is "Pending"
4. Check browser console for errors

---

## Next Phase Features (Coming Soon)

### Phase 2A: Post Detail View
- Click post → Open modal with full details
- Show all fields (title, copy, platforms, images)
- Display comments
- Show approval history
- Action buttons (Edit, Submit, Approve)

### Phase 2B: Post Creation Form
- "Create Post" button → Opens form modal
- All post fields
- Platform selector
- Image upload
- Save as draft or submit for review

### Phase 2C: Comments Integration
- Add comments to posts
- View comment history
- Threaded discussions
- Notification on new comments

### Phase 2D: Strategy Dashboard
- Performance vs. goals
- Content category distribution
- Posting cadence tracking
- Client performance metrics

---

## Customization Options

### Change Calendar Colors

Edit the CSS in CalendarDashboard.html:

```css
/* Draft posts */
.post-item.Draft {
  background: #YOUR_COLOR;
  color: #YOUR_TEXT_COLOR;
  border-left: 3px solid #YOUR_BORDER_COLOR;
}
```

### Change Calendar Height

```css
.calendar td {
  height: 120px; /* Change this value */
}
```

### Change Default Month View

In the JavaScript section:
```javascript
// Show next month by default instead of current
let currentMonth = new Date().getMonth() + 1;
```

---

## Testing Checklist

After deployment, verify:

- [ ] Calendar loads without errors
- [ ] Current month displays by default
- [ ] Today's date is highlighted
- [ ] Posts appear on correct dates
- [ ] Post titles are visible
- [ ] Status colors are correct
- [ ] Previous/next month navigation works
- [ ] "Today" button returns to current month
- [ ] Client filter populates with clients
- [ ] Status filter works
- [ ] Combined filtering works
- [ ] Approval badge shows correct count
- [ ] Clicking post shows "coming soon" message
- [ ] Mobile view is responsive
- [ ] No console errors

---

## Data Requirements

For calendar to work properly, your Posts sheet needs:

**Required Columns:**
- `ID` - Post identifier (POST-001, etc.)
- `Post_Title` - Post title/name
- `Scheduled_Date` - When post should publish (DATE format)
- `Status` - Current status (Draft, Internal_Review, etc.)
- `Client_ID` - Which client (CLT-001, etc.)

**Optional but Recommended:**
- `Post_Copy` - Post content
- `Created_By` - Who created it
- `Created_Date` - When created

**Sample Data Format:**
```
| ID | Post_Title | Scheduled_Date | Status | Client_ID |
|----|------------|----------------|--------|-----------|
| POST-001 | HEMIC Crepes | 10/15/2025 | Draft | CLT-001 |
| POST-002 | Q3 Update | 10/20/2025 | Approved | CLT-001 |
```

---

## Files You'll Need

From `/mnt/user-data/outputs/`:

1. **CalendarDashboard.html** - The new calendar view (deploy as Index.html)
2. **This deployment guide** - Reference documentation

**Keep your existing backend files:**
- Code.gs
- DataService.gs
- ApprovalService.gs
- Utils.gs

**No changes needed to backend!**

---

## Support

If you encounter issues:

1. **Check browser console** (F12 → Console tab)
2. **Check Apps Script logs** (View → Logs in Script Editor)
3. **Test backend functions** (Run in Script Editor)
4. **Verify spreadsheet data** (Check Posts and Clients sheets)
5. **Verify permissions** (Spreadsheet shared with users)

---

## Quick Start Summary

```bash
1. Copy CalendarDashboard.html content
2. Paste into Index.html in Apps Script
3. Save
4. Deploy → New version
5. Open web app URL
6. See your calendar! 🎉
```

**That's it!** You now have a calendar-first dashboard ready for your content planning workflow.

---

## What's Next

**This Week:**
- ✅ Calendar view deployed
- 🔄 Build post creation form
- 🔄 Build post detail view

**Next Week:**
- 🔄 Integrate approval dashboard
- 🔄 Add comments UI
- 🔄 Polish and test

**Timeline:** Working system with all core features in 2 weeks

---

Your calendar dashboard is ready to deploy! Follow the steps above and you'll have your main interface up and running in 10 minutes.
