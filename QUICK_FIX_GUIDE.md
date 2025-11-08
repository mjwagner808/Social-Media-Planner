# Quick Fix Guide - Copy-Paste Ready

## Issue 1: Client Modal Media (client-portal.html)

### Location
**File:** `client-portal.html`  
**Lines to replace:** 944-960

### Step-by-step:
1. Open `client-portal.html`
2. Find line 944 (starts with `// Image`)
3. Delete lines 944-960
4. Paste the code below at line 944

### Code to paste:

```javascript
      // Platforms & Media
      if (post.platforms && post.platforms.length > 0) {
        html += '<div class="modal-field">';
        html += '<div class="modal-field-label">Platforms & Media</div>';
        html += '<div style="display: grid; gap: 12px;">';

        post.platforms.forEach(function(platform) {
          html += '<div style="border: 1px solid #dadce0; padding: 12px; border-radius: 4px;">';
          html += '<p style="margin: 0 0 8px 0;"><strong>Platform:</strong> ' + escapeHtml(platform.Platform_Name || platform.Platform_ID) + '</p>';
          if (platform.Platform_Copy) {
            html += '<p style="margin: 0 0 8px 0;"><strong>Custom Copy:</strong> ' + escapeHtml(platform.Platform_Copy) + '</p>';
          }
          if (platform.Media_Type) {
            html += '<p style="margin: 0 0 8px 0;"><strong>Media Type:</strong> ' + escapeHtml(platform.Media_Type) + '</p>';
          }
          if (platform.Media_File_URL_Extracted) {
            var mediaType = (platform.Media_Type || '').toLowerCase();
            var isCarousel = mediaType.includes('carousel');

            html += '<div style="margin-top: 8px;">';
            if (isCarousel) {
              // For carousels, show the actual link as clickable text
              html += '<div style="background: #f8f9fa; padding: 12px; border-radius: 4px; border-left: 3px solid #1a73e8;">';
              html += '<p style="margin: 0 0 8px 0; font-size: 13px; color: #5f6368;">📸 Carousel (Multiple Images)</p>';
              html += '<a href="' + escapeHtml(platform.Media_File_URL_Extracted) + '" target="_blank" style="color: #1a73e8; text-decoration: none; font-size: 12px; word-break: break-all;">' + escapeHtml(platform.Media_File_URL_Extracted) + '</a>';
              html += '</div>';
            } else {
              // For single images/videos, try to display
              // Convert Box /s/ URLs to /shared/static/ for embedding
              var embedUrl = platform.Media_File_URL_Extracted.includes('box.com/s/')
                ? platform.Media_File_URL_Extracted.replace('/s/', '/shared/static/')
                : platform.Media_File_URL_Extracted;

              html += '<img src="' + escapeHtml(embedUrl) + '" style="max-width: 100%; max-height: 300px; border-radius: 4px;" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';" class="modal-image">';
              html += '<div style="display: none; background: #f8f9fa; padding: 12px; border-radius: 4px;">';
              html += '<p style="margin: 0 0 8px 0; color: #5f6368; font-size: 12px;">Image preview unavailable</p>';
              html += '<a href="' + escapeHtml(platform.Media_File_URL_Extracted) + '" target="_blank" style="color: #1a73e8; text-decoration: none; font-size: 13px;">View in Box →</a>';
              html += '</div>';
            }
            html += '</div>';
          }
          html += '</div>';
        });

        html += '</div>';
        html += '</div>';
      }
```

---

## Issue 4: Skip Internal Review Button (Index.html)

### Location
**File:** `Index.html`  
**Function:** `updatePostDetailActions`  
**Lines to replace:** 1807-1833

### Step-by-step:
1. Open `Index.html`
2. Find the `updatePostDetailActions` function (around line 1807)
3. Replace the entire function with the code below

### Code to paste:

```javascript
      function updatePostDetailActions(post) {
        const footer = document.getElementById('postDetailFooter');
        let html = '';

        // Always show Edit Post button (on the left)
        html += '<button class="btn btn-primary" type="button" onclick="editCurrentPost()">Edit Post</button>';

        // Add status change buttons based on current status
        if (post.Status === 'Draft') {
          html += ' <button class="btn btn-primary" type="button" onclick="submitPostForInternalReview(\'' + post.ID + '\')">Submit for Internal Review</button>';
        } else if (post.Status === 'Internal_Review') {
          html += ' <button class="btn btn-success" type="button" onclick="changePostStatus(\'' + post.ID + '\', \'Approved\')">Approve</button>';
          html += ' <button class="btn btn-warning" type="button" onclick="changePostStatus(\'' + post.ID + '\', \'Draft\')">Request Changes</button>';
        } else if (post.Status === 'Client_Review') {
          html += ' <button class="btn btn-success" type="button" onclick="changePostStatus(\'' + post.ID + '\', \'Approved\')">Approve</button>';
          html += ' <button class="btn btn-warning" type="button" onclick="changePostStatus(\'' + post.ID + '\', \'Draft\')">Request Changes</button>';
        } else if (post.Status === 'Approved') {
          html += ' <button class="btn btn-primary" type="button" onclick="changePostStatus(\'' + post.ID + '\', \'Scheduled\')">Schedule</button>';
        }

        // ALWAYS show "Submit for Client Review" for applicable statuses
        if (post.Status === 'Draft' || post.Status === 'Internal_Review' || post.Status === 'Client_Review') {
          html += ' <button class="btn btn-primary" type="button" onclick="submitPostForClientReview(\'' + post.ID + '\')">📤 Submit for Client Review (Skip Internal)</button>';
        }

        // Close button always on the right
        html += ' <button class="btn btn-secondary" type="button" onclick="closePostDetail()">Close</button>';

        footer.innerHTML = html;
      }
```

---

## Deployment Steps

After making the changes:

1. **Save both files**

2. **Push to Google Apps Script:**
   ```bash
   clasp push
   ```

3. **Deploy new version:**
   - Run `clasp open` or open Apps Script editor
   - Click **Deploy** → **Manage deployments**
   - Click ✏️ (pencil icon) next to active deployment
   - Select **Version** → **New version**
   - Add description: "Fix client modal media display and skip internal review button"
   - Click **Deploy**

4. **Test in Incognito window:**
   - Open new incognito window
   - Test client portal with a post that has multiple platforms
   - Test agency modal skip internal review button
   - Verify button shows for Draft, Internal_Review, and Client_Review statuses

---

## Verification Checklist

### Client Portal (client-portal.html)
- [ ] Open a post detail modal
- [ ] Verify "Platforms & Media" section appears
- [ ] Check that each platform shows its media
- [ ] Verify image previews load
- [ ] Check carousel posts show clickable Box link
- [ ] Test failed images show fallback Box link

### Agency Modal (Index.html)
- [ ] Create a Draft post and open detail modal
- [ ] Verify "Skip Internal Review" button shows
- [ ] Submit post for internal review
- [ ] Re-open detail modal
- [ ] Verify "Skip Internal Review" button STILL shows
- [ ] Submit post for client review
- [ ] Re-open detail modal
- [ ] Verify "Skip Internal Review" button STILL shows
- [ ] Approve the post
- [ ] Re-open detail modal
- [ ] Verify "Skip Internal Review" button does NOT show (correct)

---

## Troubleshooting

### If images don't show in client portal:
1. Check browser console for errors
2. Verify `post.platforms` array exists in data
3. Check that `platform.Media_File_URL_Extracted` has values
4. Test with a Box link directly in browser

### If skip button doesn't show:
1. Check browser console for JavaScript errors
2. Verify function was replaced correctly (no syntax errors)
3. Check that `post.Status` has expected value
4. Clear browser cache and test in incognito

### General deployment issues:
1. Make sure clasp push completed without errors
2. Verify new version was deployed (not just saved)
3. Always test in incognito window to avoid cache
4. Check Apps Script execution logs for backend errors

---

## What We're NOT Changing

### Issue 2: Comment History
- **Already implemented** in Index.html (lines 1682-1805)
- Backend function `getCommentsForPost()` exists in DataService.js
- Just needs test data to verify it works

### Issue 3: Notification Bell Mark as Read
- **Already implemented** in Index.html (lines 3023-3039)
- Backend function `markNotificationRead()` exists in NotificationService.js
- Just needs testing to verify it works

**If these features aren't working, it's a data/configuration issue, not missing code.**

---

## Time Estimate

- Issue 1 fix: **10 minutes**
- Issue 4 fix: **5 minutes**
- Deployment: **5 minutes**
- Testing: **10 minutes**

**Total: ~30 minutes**
