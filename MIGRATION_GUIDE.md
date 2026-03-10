# Smartsheet to Social Media Planner Migration Guide

## Overview
This guide will help you migrate your HEMIC posts from Smartsheet into the Social Media Planner app.

---

## Before You Start

### Questions to Answer:

1. **What platforms are these posts for?**
   - LinkedIn? Facebook? Instagram? Twitter/X? All of them?
   - This determines the `Platforms` field

2. **What status should imported posts have?**
   - `Draft` - Posts that need work
   - `Internal_Review` - Ready for team approval
   - `Client_Review` - Ready for client approval
   - `Approved` - Approved and ready to schedule
   - `Scheduled` - Scheduled for publishing
   - `Published` - Already published

3. **Do you have subsidiaries for HEMIC?**
   - If yes, which subsidiary should these posts belong to?
   - If no, leave `Subsidiary_IDs` blank

4. **What's the "LinkedIn #" column in your Smartsheet?**
   - Is it hashtags?
   - Is it a LinkedIn-specific post ID?
   - We need to know where to map this data

5. **Week numbers → Actual dates**
   - Your Smartsheet shows "Week 1", "Week 2", "Week 3"
   - I see dates in the calendar grid (Dec 1-21)
   - Should I use the dates from the calendar grid?

---

## Step-by-Step Migration Process

### Step 1: Export from Smartsheet

1. Open your Smartsheet
2. Click **File** → **Export** → **Export to Excel** (or CSV)
3. Save the file to your Desktop

### Step 2: Prepare the Data

**Option A: I can build you an automated script** (Recommended)
- You export the Smartsheet as-is
- I write a Google Apps Script function that reads your export
- Script automatically maps columns and imports everything
- **Advantage:** Fast, accurate, handles all the mapping

**Option B: Manual CSV preparation** (More control)
- Open the exported file in Excel/Numbers/Google Sheets
- Use the template I created: `HEMIC_Import_Template.csv`
- Copy your data row by row, mapping columns
- **Advantage:** You control exactly what gets imported

### Step 3: Field Mapping Reference

| Smartsheet Column | Our Database Field | Notes |
|-------------------|-------------------|-------|
| Post Copy | `Post_Copy` | Direct copy |
| Visual | `Media_File_URL` | Box.com image URLs |
| Week # + Calendar Grid | `Scheduled_Date` | Format: YYYY-MM-DD (e.g., 2025-12-03) |
| Tammy Approved / To be Approved | `Status` | Map "APPROVED" → "Approved", empty → "Draft" |
| Client Approved / APPROVED / APPROVED with edit | `Status` | These override internal approval status |
| LinkedIn # | `Hashtags` or `Link_URL` | **Need clarification** |
| *Missing* | `Post_Title` | Use first 50 chars of Post_Copy |
| *Fixed* | `Client_ID` | Always "CLT-001" (HEMIC) |
| *Fixed* | `Created_By` | Your email: emmajean.karen@gmail.com |
| *Fixed* | `Created_At` | Today's date: 2025-12-20 |
| **To Determine** | `Platforms` | LinkedIn? Facebook? Instagram? |
| **To Determine** | `Subsidiary_IDs` | Which HEMIC subsidiary? |
| **To Determine** | `Content_Category` | Community Engagement? Brand Awareness? |

### Step 4: Status Logic

Based on your approval columns, here's my recommendation:

```
IF "Client Approved" = "APPROVED" → Status = "Approved"
ELSE IF "Client Approved" = "APPROVED with edit" → Status = "Approved"
ELSE IF "Client Approved" = "Need to repost this on HMF ASAP once a newer version of..."  → Status = "Draft"
ELSE IF "Tammy Approved" = "APPROVED" → Status = "Internal_Review" (ready for client)
ELSE IF "Tammy Approved" = "To Be Approved" → Status = "Draft"
ELSE → Status = "Draft"
```

---

## Option A: Automated Script (Recommended)

If you choose this option, I will:

1. **Create a Google Apps Script function** that:
   - Reads your Smartsheet export (CSV or Excel)
   - Automatically maps all columns
   - Generates unique Post IDs (POST-042, POST-043, etc.)
   - Creates entries in both Posts and Post_Platforms sheets
   - Handles date conversion from week numbers
   - Sets appropriate status based on approval columns

2. **You will:**
   - Export Smartsheet to CSV/Excel
   - Upload the file to Google Drive
   - Run the script once
   - Review imported posts in the app

**Time estimate:** 5 minutes for you, 20 minutes for me to build the script

---

## Option B: Manual CSV Import

If you choose this option:

1. **Open the template:** `HEMIC_Import_Template.csv`
2. **Open your Smartsheet export** side by side
3. **Copy data row by row**, mapping columns according to the table above
4. **For each row, fill in:**
   - Post_Title (first 50 chars of Post_Copy, or create a short title)
   - Post_Copy (direct copy from Smartsheet)
   - Scheduled_Date (look at calendar grid, format as YYYY-MM-DD)
   - Status (use logic above)
   - Client_ID (always CLT-001)
   - Subsidiary_IDs (if applicable)
   - Content_Category (you decide)
   - Campaign_Name (optional)
   - Hashtags (if LinkedIn # is hashtags)
   - Link_URL (if LinkedIn # is URLs)
   - Created_By (emmajean.karen@gmail.com)
   - Created_At (2025-12-20)
   - Platforms (comma-separated: "LinkedIn,Facebook")
   - Media_File_URL (Box.com image URLs from Visual column)

5. **Save the completed CSV**

6. **Import to Google Sheets:**
   - Open database: https://docs.google.com/spreadsheets/d/1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss/edit
   - Go to **Posts** sheet
   - Find the first empty row (after test data)
   - **File** → **Import** → Upload your CSV
   - Choose "Append to current sheet"
   - Choose "Comma" as separator

**Time estimate:** 1-2 hours depending on number of posts

---

## After Import

### Clean Up Test Data

Before importing production data, you may want to:

1. Open the Google Sheets database
2. Delete test posts (POST-001, POST-002, etc.) from the **Posts** sheet
3. Delete corresponding entries from **Post_Platforms** sheet
4. This gives you a clean slate for HEMIC's real data

### Verify Import

1. Open the Social Media Planner app
2. Refresh the calendar
3. Check that posts appear on correct dates
4. Click a post to verify all fields imported correctly
5. Check image previews are working (Box.com URLs)

---

## My Recommendation

**Use Option A (Automated Script)** because:

✅ Faster (5 minutes vs 1-2 hours)
✅ No manual errors
✅ Handles complex status logic automatically
✅ Auto-generates Post IDs
✅ Creates both Posts and Post_Platforms entries
✅ You can review everything before going live

**I just need from you:**

1. **Which platforms** are these posts for? (LinkedIn, Facebook, Instagram, etc.)
2. **What should the default status be?** (Probably "Draft" so team can review)
3. **Is there a subsidiary** for HEMIC these should belong to?
4. **What is "LinkedIn #"** in your Smartsheet - hashtags or URLs?
5. **Export your Smartsheet** to CSV or Excel and let me know when it's ready

Then I'll build the script in about 20 minutes and you can run it once to import everything!

---

## Questions?

Let me know which option you prefer and answers to the questions above, and we'll get started!
