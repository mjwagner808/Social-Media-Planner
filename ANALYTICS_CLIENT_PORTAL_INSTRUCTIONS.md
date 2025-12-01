# Client Portal Analytics - Implementation Instructions

**Status:** Backend complete,  frontend requires manual additions to client-portal.html

---

## Changes Already Made ✅

### 1. DataService.js - Backend Complete

**Lines 1775-1800:** Updated `calculatePostsBySubsidiary()` to use subsidiary names
- Reads from Subsidiaries sheet
- Maps IDs to names using `Subsidiary_Name` field
- Fallback to ID if name not found

**Lines 1806-1834:** Updated `calculatePostsByCategory()` to use category names
- Reads from Content_Categories sheet
- Maps IDs to names using `Category_Name` field
- Fallback to ID if name not found

**Lines 1621-1636:** Added `getClientAnalyticsData(token)` function
- Validates client access token
- Calls `getAnalyticsData({clientId: authorizedClient.Client_ID})`
- Returns analytics filtered by client

**Code pushed to Apps Script:** ✅ Yes (via `clasp push`)

---

## Remaining Changes Needed - client-portal.html

### Change 1: Analytics Button (Already Done ✅)

**Line 533-536:** Added Analytics button next to Manage Reviewers
```html
<button id="analyticsBtn" onclick="openClientAnalytics()"
        style="display: none; padding: 8px 16px; background: #9334e9; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;">
  📊 Analytics
</button>
```

**Line 704:** Show button for client admins (Already Done ✅)
```javascript
document.getElementById('analyticsBtn').style.display = 'block';
```

### Change 2: Add Analytics Modal HTML

**Add after line 662 (after Manage Reviewers Modal):**

```html
  <!-- Analytics Dashboard Modal -->
  <div id="analyticsModal" class="modal-overlay" onclick="closeClientAnalytics(event)">
    <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 1200px;">
      <div class="modal-header">
        <h2>📊 Your Analytics</h2>
        <button type="button" class="modal-close" onclick="closeClientAnalytics()">&times;</button>
      </div>
      <div class="modal-body" id="analyticsContent">
        <div style="text-align: center; padding: 60px 20px; color: #9aa0a6;">
          <div class="spinner"></div>
          <p style="margin-top: 24px;">Loading analytics...</p>
        </div>
      </div>
    </div>
  </div>
```

### Change 3: Add Analytics JavaScript Functions

**Add before the closing `</script>` tag (after line ~1620):**

```javascript
    /**
     * Open Client Analytics
     */
    function openClientAnalytics() {
      const modal = document.getElementById('analyticsModal');
      modal.classList.add('active');

      // Get token
      const urlParams = new URLSearchParams(window.location.search);
      const token = '<?= accessToken ?>' || urlParams.get('token');

      // Load analytics using JSONP
      const callbackName = 'analyticsCallback_' + Date.now();
      window[callbackName] = function(data) {
        if (data.success) {
          renderClientAnalytics(data.metrics);
        } else {
          document.getElementById('analyticsContent').innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #ea4335;">
              <p style="font-size: 18px; margin-bottom: 12px;">❌ Error loading analytics</p>
              <p style="color: #5f6368;">${data.error || 'Unknown error'}</p>
            </div>
          `;
        }
        delete window[callbackName];
      };

      const script = document.createElement('script');
      script.src = API_URL + '?action=getClientAnalyticsData&token=' + encodeURIComponent(token) + '&callback=' + callbackName;
      script.onerror = function() {
        document.getElementById('analyticsContent').innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: #ea4335;">
            <p style="font-size: 18px; margin-bottom: 12px;">❌ Connection error</p>
            <p style="color: #5f6368;">Failed to load analytics. Please try again.</p>
          </div>
        `;
        delete window[callbackName];
      };
      document.head.appendChild(script);
    }

    /**
     * Close Client Analytics
     */
    function closeClientAnalytics(event) {
      if (event && event.target !== event.currentTarget) return;
      const modal = document.getElementById('analyticsModal');
      modal.classList.remove('active');
    }

    /**
     * Render Client Analytics (uses same rendering as main app)
     */
    function renderClientAnalytics(metrics) {
      const content = document.getElementById('analyticsContent');

      // Note: This uses the exact same rendering code from Index.html renderAnalytics()
      // Copy the entire renderAnalytics function body from Index.html lines 3649-3877
      // and paste it here, replacing only the const declarations with var

      var html = '<div style="padding: 0;">';

      // Summary Cards Row
      html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">';

      // Total Posts Card
      html += `
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #1a73e8;">
          <div style="color: #5f6368; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Total Posts</div>
          <div style="font-size: 32px; font-weight: 500; color: #202124;">${metrics.totalPosts}</div>
        </div>
      `;

      // Published Posts Card
      html += `
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #9334e9;">
          <div style="color: #5f6368; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Published</div>
          <div style="font-size: 32px; font-weight: 500; color: #202124;">${metrics.publishingMetrics.published}</div>
        </div>
      `;

      // Approval Rate Card
      html += `
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #34a853;">
          <div style="color: #5f6368; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Approval Rate</div>
          <div style="font-size: 32px; font-weight: 500; color: #202124;">${metrics.approvalMetrics.approvalRate}%</div>
        </div>
      `;

      // On-Time Publishing Card
      html += `
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #f9ab00;">
          <div style="color: #5f6368; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">On-Time Rate</div>
          <div style="font-size: 32px; font-weight: 500; color: #202124;">${metrics.publishingMetrics.onTimeRate}%</div>
        </div>
      `;

      html += '</div>';

      // [TRUNCATED FOR BREVITY - COPY FULL RENDERING CODE FROM INDEX.HTML]
      // Copy lines 3688-3877 from Index.html renderAnalytics function
      // Just replace "const" with "var"

      content.innerHTML = html;
    }
```

---

## Code.js - Add Analytics Action Handler

**Find the doGet() function and add analytics action:**

```javascript
// In Code.js doGet() function, add this case after other actions:
else if (action === 'getClientAnalyticsData') {
  var token = e.parameter.token;
  var callback = e.parameter.callback;
  var analyticsData = getClientAnalyticsData(token);

  var output = callback + '(' + JSON.stringify(analyticsData) + ')';
  return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
```

---

## Summary

**✅ Completed:**
1. Backend functions updated to use subsidiary/category names instead of IDs
2. New `getClientAnalyticsData(token)` function for client portal
3. Analytics button added to client-portal.html
4. Button visibility logic updated

**⏳ Remaining:**
1. Add analytics modal HTML to client-portal.html (after line 662)
2. Add JavaScript functions to client-portal.html (before closing </script>)
3. Add analytics action handler in Code.js doGet() function
4. Copy full renderAnalytics rendering code from Index.html

**Files to modify manually:**
- [client-portal.html](client-portal.html) - Add modal HTML and JS functions
- [Code.js](Code.js) - Add analytics action handler

Once these additions are made, client admins will be able to view their own analytics filtered to their client's data only.
