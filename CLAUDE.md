# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Social Media Planner** - A Google Apps Script web application for managing social media content workflow across multiple clients, platforms, and approval stages. Built as a calendar-first interface with approval workflows, client filtering, and image management.

**Stack:** Google Apps Script (V8 runtime), vanilla HTML/CSS/JavaScript (no frameworks), Google Sheets as database, Box.com for media storage.

**Current Status:** Phase 2 complete (Post Creation Form). See `Build Plan.md` for roadmap and `POST_CREATION_DEPLOYMENT.md` for form deployment guide.

## Development Workflow

### Deployment Commands

```bash
# Push local code to Google Apps Script
clasp push

# Pull code from Google Apps Script
clasp pull

# Open project in Apps Script editor
clasp open
```

### Deployment Process

After pushing code with `clasp push`, you must deploy a new version in the Apps Script UI:

1. Open Apps Script editor (or run `clasp open`)
2. **Deploy** → **Manage deployments**
3. Click pencil icon ✏️ next to active deployment
4. **Version** → **New version** → Add description
5. Click **Deploy**

**Important:** Always test in a new Incognito window after deployment to avoid caching issues.

### File Extensions

- Local files use `.js` extensions (for clasp compatibility)
- Apps Script editor shows them as `.gs` files
- Both extensions are functionally identical
- HTML files remain `.html` in both environments

## Architecture

### Data Layer (Google Sheets as Database)

**Spreadsheet ID:** `1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss`

**Core Tables:**
- **Posts** - Main content table (ID, Post_Title, Post_Copy, Scheduled_Date, Status, Client_ID, Subsidiary_IDs)
- **Post_Platforms** - Platform-specific versions (Post_ID, Platform, Media_File_URL, Media_Type)
- **Post_Approvals** - Approval workflow tracking (Post_ID, Approval_Stage, Approver_Email, Approval_Status)
- **Clients** - Client accounts (ID, Client_Name, Internal_Approver_Emails, Client_Approver_Emails)
- **Users** - App users with roles (Email, Full_Name, Default_Role, Status)
- **Platforms, Content_Categories, Strategy_Goals** - Reference data

**Key Patterns:**
- IDs use format: `PREFIX-###` (e.g., `POST-001`, `CLT-001`)
- Multi-select fields stored as comma-separated strings
- Date fields converted to ISO strings for serialization (critical for web app communication)

### Backend Structure

**Code.js** - Entry point and shared utilities
- `doGet()` - Web app entry point, serves Index.html with user context
- `getDataAsObjects(sheetName)` - Core data reader, converts Date objects to ISO strings
- `SPREADSHEET_ID` constant - Single source of truth for database location

**DataService.js** - Data endpoints and post creation
- Prefix: `_getSheet_()`, `_readSheetAsObjects_()`, `_err_()`, `_toIso_()` (scoped helpers)
- Public functions: `getAllPosts()`, `getAllClients()`, `getAllUsers()`, `getPostById(postId)`
- `getAllPostsWithImages()` - Joins Posts with Post_Platforms, extracts image URLs from `=IMAGE()` formulas
- `getFormOptions()` - Returns clients, platforms, categories, users for post creation form
- `getClientSubsidiaries(clientId)` - Returns active subsidiaries for a client
- `createPostFromUI(postData)` - Creates new post, generates ID, saves to Posts sheet
- `createPostPlatforms(postId, platforms)` - Creates platform-specific entries
- Returns `[]` or `{success: false, error: string}` - never null/undefined

**ApprovalService.js** - Approval workflow engine
- `submitForInternalReview(postId)` - Creates approval records, sends emails
- `submitForClientReview(postId)` - Requires all internal approvals first
- `recordApprovalDecision(approvalId, decision, notes)` - Updates approval status
- `getMyPendingApprovals()` - Returns approvals for current user (used by badge)
- Status flow: Draft → Internal_Review → Client_Review → Approved

**Utils.js** - Helper functions
- `generateId(prefix)` - Auto-increment ID generator
- `parseIds(idString)` - Splits comma-separated IDs
- `getUserDefaultRole(email)`, `isAuthorizedUser(email)` - Auth helpers
- `formatDate()`, `sendEmail()` - Common utilities

### Frontend Structure

**Index.html** - Single-page calendar application with post creation modal
- Server-side templating: `<?= userName ?>`, `<?= userRole ?>`
- Client-side state: `allPosts`, `allClients`, `filteredPosts`, `currentMonth`, `currentYear`, `formOptions`, `selectedPlatforms`
- Main functions:
  - `loadCalendarData()` - Calls `getAllPostsWithImages()` and `getAllClients()`
  - `renderCalendar()` - Builds calendar HTML from filtered posts
  - `filterCalendar()` - Applies client/status filters
  - `setupImagePreview()` - Event delegation for hover previews
  - `openPostCreationForm()` - Opens modal, loads form options
  - `validateForm()` - Client-side validation before submit
  - `createPostFromUI(postData)` - Submits form to backend
  - `togglePlatformMedia()` - Dynamically adds/removes platform media fields
- Communication: `google.script.run.withSuccessHandler().withFailureHandler().functionName()`

**ApprovalDashboard.html** - Approval cards interface (secondary view)

### Status Color System

- **Draft** - Gray (#9aa0a6)
- **Internal_Review** - Yellow/Orange (#f9ab00)
- **Client_Review** - Red (#ea4335)
- **Approved** - Green (#34a853)
- **Scheduled** - Blue (#1a73e8)
- **Published** - Purple (#9334e9)

## Critical Implementation Details

### Date Serialization Issue

**Problem:** Google Apps Script cannot serialize Date objects to web app clients.

**Solution:** All functions that return data to the frontend MUST convert Date objects to ISO strings:
```javascript
if (value instanceof Date) {
  value = value.toISOString();
}
```

This is implemented in `getDataAsObjects()` and `getAllPostsWithImages()`.

### Image URL Extraction from Formulas

**Problem:** Sheets cells with `=IMAGE("url", 4, 100, 100)` formulas return `CellImage` objects when read with `getValues()`.

**Solution:** Use `getFormulas()` instead to get formula text, then parse with regex:
```javascript
var platformFormulas = dataRange.getFormulas();
var mediaUrl = platformFormulas[i][mediaUrlIndex] || platformData[i][mediaUrlIndex];
```

Function `extractUrlFromImageFormula()` handles both formula text and plain URLs.

### Box.com URLs

Images are stored in Box.com. Shared links work as direct image sources in `<img>` tags. Folder links (carousels) don't render - these show carousel badge (📸) instead.

### Event Delegation for Dynamic Content

Since calendar posts are dynamically rendered, event listeners must use delegation:
```javascript
calendarTable.addEventListener('mouseover', function(e) {
  const postItem = e.target.closest('.post-item[data-image-url]');
  // ...
});
```

Never use inline `onmousemove` handlers - they don't work reliably with dynamic HTML.

## Debugging

### Apps Script Execution Logs

View logs in Apps Script editor: **View** → **Logs** or **Execution log**

Use `Logger.log()` for debugging server-side code.

### Debug Functions

`debugPostPlatforms()` in DataService.js - Logs Post_Platforms data and URL extraction for first 3 rows.

### Browser Console

Frontend errors appear in browser console (F12). Check for:
- `google.script.run` availability (undefined in local preview)
- Serialization errors from backend
- Image loading failures (CORS, authentication)

## Next Development Phases

See `Build Plan.md` for complete roadmap.

**Phase 2: Post Creation Form** ✅ COMPLETE
- Modal form for creating posts from UI
- Platform selection with per-platform media URLs
- Backend: `createPostFromUI()` and `createPostPlatforms()` functions
- Dynamic subsidiary loading based on client selection
- Workflow assignment (internal/client approvers)
- See `POST_CREATION_DEPLOYMENT.md` for deployment guide

**Phase 3: Post Detail View** (6-8 hours) - NEXT
- Modal showing full post details on click
- Comments section
- Approval actions (approve, request changes)

**Phase 4: Integration & Polish** (4-6 hours)
- Connect approval dashboard to calendar
- Loading states, error handling
- Performance optimization

**Phase 5: Strategy Dashboard** (6-8 hours)
- Analytics and metrics
- Goal tracking vs. actual posts
- Content category distribution

1.	Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
2.	Add a review/rec section to the todo.md file with a summary of the changes you made and any relevant information.
3.	Do not be lazy. Never ever be lazy. If there is a bug find the root cause and fix it. No temporary fixes.
4.	Make all fixes and code changes as simple as humanly possible. They should only impact necessary code relevant to the task and nothing else. It should impact as little code as possible. Your goal is to not introduce any bugs. It’s all about simplicity.

CRITICAL: When debugging, you MUST trace through the ENTIRE code flow step by step.
No assumptions. No shortcuts.

