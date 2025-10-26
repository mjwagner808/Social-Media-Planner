# Post Creation Form - Deployment Guide

## What's Been Built

**Post Creation Form (Phase 2)** - A comprehensive modal form that allows users to create new social media posts directly from the calendar interface.

### Features Implemented ✅

**Form Fields:**
- ✅ Client selection (required)
- ✅ Subsidiary multi-select (loads dynamically based on client)
- ✅ Post Title (required, max 100 chars)
- ✅ Post Copy (required, max 2000 chars with character counter)
- ✅ Scheduled Date (required)
- ✅ Scheduled Time (optional)
- ✅ Hashtags (required)
- ✅ Content Category (optional dropdown)
- ✅ Link URL (optional)
- ✅ Internal Notes (optional)

**Platform Selection:**
- ✅ Checkbox selection for multiple platforms
- ✅ Dynamic media URL input fields per selected platform
- ✅ Media type selector (Image/Video/Carousel) per platform

**Workflow Assignment:**
- ✅ Internal Approvers (multi-select, required)
- ✅ Client Approvers (comma-separated emails, optional)

**Form Behavior:**
- ✅ Two save options: "Save as Draft" or "Submit for Review"
- ✅ Real-time validation with error messages
- ✅ Character counter for post copy
- ✅ Auto-refresh calendar after successful creation
- ✅ Success/error notifications
- ✅ Mobile-responsive design

**Backend Functions Created:**
- ✅ `getFormOptions()` - Loads all dropdown data
- ✅ `getClientSubsidiaries(clientId)` - Loads subsidiaries for selected client
- ✅ `createPostFromUI(postData)` - Creates post record
- ✅ `createPostPlatforms(postId, platforms)` - Creates platform-specific records
- ✅ Auto-submits for internal review if "Submit for Review" is clicked

---

## Deployment Steps

### Step 1: Code Already Pushed ✅

The code has been pushed to your Apps Script project using `clasp push`. All files are updated:
- `DataService.js` - New backend functions
- `Index.html` - Post creation modal and JavaScript
- Other files unchanged

### Step 2: Deploy New Version

1. **Open Apps Script Editor:**
   - Go to https://script.google.com
   - Or run: `clasp open`

2. **Create New Deployment:**
   - Click **Deploy** → **Manage deployments**
   - Click the ✏️ (edit) icon next to your active deployment
   - Click **Version** → **New version**
   - Description: **"Post Creation Form v2.0"**
   - Click **Deploy**
   - Click **Done**

3. **Open Web App:**
   - Use the same web app URL
   - **Important:** Open in a **new Incognito window** to avoid caching

---

## Testing the Form

### Test 1: Open the Form

1. Click **"➕ Create Post"** button in action bar
2. Modal should slide in from center
3. All form fields should be visible
4. Dropdowns should populate with your data

**Expected Result:** Clean modal with all sections visible

### Test 2: Dynamic Field Population

1. Select a client from the dropdown
2. Subsidiaries should load (if that client has any)
3. Select one or more platforms (e.g., Instagram, Facebook)
4. Media URL fields should appear below for each selected platform

**Expected Result:** Form dynamically updates based on selections

### Test 3: Save as Draft

1. Fill in all **required** fields:
   - Client
   - Post Title
   - Post Copy
   - Hashtags
   - Scheduled Date
   - Select at least one platform
   - Select at least one internal approver

2. Click **"Save as Draft"**

**Expected Result:**
- "Post created successfully" message appears
- Modal closes after 1.5 seconds
- Calendar refreshes
- New post appears on calendar on the scheduled date with **Draft** status (gray)

### Test 4: Submit for Review

1. Fill in all required fields (same as Test 3)
2. Click **"Submit for Review"**

**Expected Result:**
- "Post created successfully" message appears
- Post appears on calendar with **Internal_Review** status (yellow/orange)
- Approval email should be sent to selected internal approvers

### Test 5: Validation

1. Click "➕ Create Post"
2. Click **"Save as Draft"** without filling anything
3. Should see error message listing all missing required fields

**Expected Result:** Red error box at top of form with bullet list of errors

---

## Known Limitations & Future Enhancements

### Current Implementation

**Media Upload:**
- Currently requires Box.com URLs to be pasted manually
- No direct file upload (would require Google Drive integration)
- Accepts Image/Video/Carousel designation per platform

**Campaigns:**
- Campaign field not included (no Campaigns reference data found in sheets)
- Can be added if needed

### Suggested Future Enhancements

1. **File Upload Integration:**
   - Add Google Drive picker for image/video upload
   - Auto-upload to Box.com via API
   - Generate Box.com share links automatically

2. **Rich Text Editor:**
   - Add formatting toolbar for post copy
   - Preview mode for formatted text

3. **Duplicate Post Function:**
   - Click existing post → "Duplicate" button
   - Pre-fills form with same data

4. **Draft Auto-Save:**
   - Save form data to localStorage
   - Resume if user accidentally closes modal

5. **Batch Post Creation:**
   - Create multiple posts at once
   - Useful for content calendars

---

## Troubleshooting

### Form Won't Open
- Check browser console (F12) for JavaScript errors
- Verify `openPostCreationForm` function exists
- Hard refresh page (Cmd+Shift+R)

### Dropdowns Are Empty
- Check `getFormOptions()` function in Apps Script
- Verify sheets exist: Clients, Platforms, Content_Categories, Users
- Check Execution Log in Apps Script for errors

### Post Not Saving
- Check browser console for errors
- Check Apps Script Execution Log
- Verify `createPostFromUI` function has permissions
- Check that Posts and Post_Platforms sheets exist with correct headers

### Subsidiaries Not Loading
- Verify Subsidiaries sheet exists
- Check that selected client has subsidiaries with Status = "Active"
- Check `getClientSubsidiaries()` function logs

### Post Created but Not Showing on Calendar
- Check that scheduled date is in the currently viewed month
- Check that post status is in the allowed list in `getAllPosts()`
- Refresh page manually if auto-refresh didn't work

---

## Data Flow

### When User Clicks "Create Post"

1. **Modal Opens** → `openPostCreationForm()`
2. **Load Form Options** → Calls `getFormOptions()`
   - Returns: clients, platforms, categories, users
3. **Populate Dropdowns** → `populateFormDropdowns()`
4. **User Selects Client** → `loadSubsidiaries()`
5. **User Selects Platforms** → `togglePlatformMedia()`
   - Creates media URL input for each platform
6. **User Fills Form** → Character counter updates
7. **User Clicks Save/Submit** → `validateForm()`
   - If valid → `collectFormData()`
   - Then → `submitPost()` → calls `createPostFromUI()`
8. **Backend Creates Post:**
   - Generates new POST-XXX ID
   - Inserts row into Posts sheet
   - Calls `createPostPlatforms()` for each platform
   - If "Submit for Review" → calls `submitForInternalReview()`
9. **Success:**
   - Shows success message
   - Closes modal after 1.5s
   - Reloads calendar
   - New post appears!

---

## Next Steps After Testing

Once you've tested the form and everything works:

**Immediate:**
- [ ] Create a few test posts to verify all workflows
- [ ] Test with different clients and platforms
- [ ] Verify approval emails are sent correctly
- [ ] Check that posts appear correctly on calendar

**Future Phases:**

**Phase 3: Post Detail View** (Next priority)
- Click a post on calendar → see full details modal
- View all platforms and media
- See comments
- Take approval actions

**Phase 4: Integration & Polish**
- Loading states and spinners
- Better error handling
- Performance optimization
- Mobile UX improvements

**Phase 5: Strategy Dashboard**
- Analytics and metrics
- Goal tracking
- Content distribution charts

---

## Questions & Feedback

When you test the form, please note:

1. **What works well?**
2. **What's confusing or could be improved?**
3. **Any missing fields or features?**
4. **Performance issues?**
5. **Mobile experience?**

This will help prioritize the next phase of development!

---

## Summary

✅ **Complete post creation workflow implemented**
✅ **Form validates all required fields**
✅ **Saves to both Posts and Post_Platforms sheets**
✅ **Integrates with existing approval workflow**
✅ **Calendar auto-refreshes with new posts**

**Ready to deploy and test!** 🚀
