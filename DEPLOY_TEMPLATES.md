# Quick Deployment Guide - Post Templates Feature

## 🚀 Ready to Deploy

The Post Templates feature has been pushed to Google Apps Script and is ready for deployment.

---

## Deployment Steps

### 1. Open Apps Script Editor
```bash
clasp open
```
Or visit: https://script.google.com/home/projects/YOUR_PROJECT_ID

### 2. Create New Deployment Version

1. Click **Deploy** → **Manage deployments**
2. Click the pencil icon ✏️ next to your active deployment
3. Under **Version**, click **New version**
4. Add description:
   ```
   Add Post Templates feature - save and reuse post configurations
   ```
5. Click **Deploy**

### 3. Test the Feature

**Open in Incognito Window** (to avoid cache):
- Your web app URL from deployment

**Quick Test Flow:**
1. Create a test post with sample data
2. Open post detail modal
3. Click "📋 Save as Template"
4. Enter name: "Test Template"
5. Click "📋 Templates" button in action bar
6. Verify template appears
7. Click "✏️ Use" button
8. Verify form populates with template data
9. Test template selector in "Create Post" form

---

## What's New?

### User-Visible Changes

**New Button in Action Bar:**
- "📋 Templates" - Opens template management interface

**New Section in Post Creation Form:**
- Template selector dropdown at top
- "🔄 Refresh" button to reload templates
- Help text explaining template usage

**New Button in Post Detail:**
- "📋 Save as Template" - Saves current post as reusable template

**New Modal - Template Manager:**
- View all saved templates
- Template cards with details (title, platforms, category, copy preview)
- "✏️ Use" button - Opens form with template pre-loaded
- "🗑️ Delete" button - Removes template

### Backend Changes

**New File:**
- `TemplateService.js` - Complete template management service

**New Google Sheet:**
- `Post_Templates` - Auto-created on first template save

**Modified Files:**
- `Index.html` - Template UI and functions

---

## Testing Checklist

After deployment, verify:

- [ ] "📋 Templates" button appears in action bar
- [ ] Clicking it opens template manager modal
- [ ] Template selector shows in post creation form
- [ ] "📋 Save as Template" appears in post detail modal
- [ ] Saving template creates Post_Templates sheet
- [ ] Template appears in manager and selector
- [ ] Using template populates form fields correctly
- [ ] Deleting template shows confirmation and removes it
- [ ] Template marked "Inactive" in sheet (not deleted)

---

## If Something Goes Wrong

### Template Manager shows error
- Check browser console (F12)
- Verify spreadsheet permissions
- Try refreshing page

### Template not saving
- Check Post_Templates sheet exists
- Check for duplicate template names (allowed, but confusing)
- Verify post ID is valid

### Form not populating from template
- Check console for errors
- Verify template has data in Post_Templates sheet
- Try clicking "🔄 Refresh" button

### Code not updating
- Make sure you deployed a **new version** (not same version)
- Clear browser cache or use incognito window
- Check execution logs in Apps Script

---

## Files Pushed to Apps Script

✅ TemplateService.js (NEW)
✅ Index.html (MODIFIED)
✅ All other service files (unchanged)

**Git Commit:** dbed442
**Branch:** main
**Status:** Pushed and ready

---

## Next Steps After Deployment

1. **User Training:**
   - Show team how to save templates
   - Demonstrate template manager
   - Explain what data is/isn't saved

2. **Create Common Templates:**
   - Weekly tips
   - Product spotlights
   - Holiday posts
   - Event announcements

3. **Monitor Usage:**
   - Check Post_Templates sheet for activity
   - Gather user feedback
   - Note any feature requests

4. **Future Enhancements:**
   - Template editing (currently must delete/recreate)
   - Template categories/tags
   - Template sharing controls
   - Default template selection

---

## Documentation

Complete feature documentation: [TEMPLATES_FEATURE_GUIDE.md](TEMPLATES_FEATURE_GUIDE.md)

**Feature Status:** ✅ Complete and ready for production
**Last Updated:** November 8, 2025
