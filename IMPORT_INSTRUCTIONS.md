# How to Import HEMIC Posts from Smartsheet

## Quick Overview

This process will import all your HEMIC posts from Smartsheet into the Social Media Planner app in about 5 minutes.

---

## Step 1: Export Smartsheet to CSV

1. Open your Smartsheet
2. Click **File** → **Export** → **Export to Excel** or **Export to CSV**
3. Save the file to your Desktop (name it something like `HEMIC_Posts_Export.csv`)

---

## Step 2: Upload CSV to Google Drive

1. Go to [Google Drive](https://drive.google.com)
2. Click **New** → **File upload**
3. Select your exported CSV file
4. Wait for upload to complete
5. **Right-click** on the uploaded file → **Get link** → **Copy link**
6. Your link will look like: `https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing`
7. **Copy just the ID part**: `1ABC123xyz456` (the part between `/d/` and `/view`)

---

## Step 3: Configure the Import Script

1. Open your Apps Script editor: https://script.google.com/home/projects/1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss/edit

2. You should see a new file called **SmartsheetImporter.js** (I just created it)

3. Find this line near the top (around line 20):
   ```javascript
   var CSV_FILE_ID = 'YOUR_CSV_FILE_ID_HERE';
   ```

4. Replace `YOUR_CSV_FILE_ID_HERE` with your actual file ID:
   ```javascript
   var CSV_FILE_ID = '1ABC123xyz456'; // Your actual ID here
   ```

5. **Save** the file (Ctrl+S or Cmd+S)

---

## Step 4: Run the Import

1. In the Apps Script editor, make sure **SmartsheetImporter.js** is selected

2. At the top, find the function dropdown (it might say "Select function")

3. Click it and select **importSmartsheetData**

4. Click the **Run** button (▶️ play icon)

5. **First time only**: Google will ask for permissions:
   - Click **Review permissions**
   - Select your Google account
   - Click **Advanced** → **Go to Social Media Planner (unsafe)**
   - Click **Allow**

6. Wait for the script to run (watch the "Executing" message at bottom)

7. When it's done, click **View** → **Logs** to see the results

---

## Step 5: Verify Import

1. Open your Google Sheets database: https://docs.google.com/spreadsheets/d/1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss/edit

2. Go to the **Posts** tab

3. Scroll to the bottom - you should see your HEMIC posts starting at POST-042 (or whatever number was next)

4. Check a few posts to make sure:
   - ✅ Post_Copy is correct
   - ✅ Scheduled_Date is correct
   - ✅ Hashtags are in the Hashtags column
   - ✅ Client_ID = CLT-001
   - ✅ Status = Draft

5. Go to the **Post_Platforms** tab

6. Check that each post has entries for LinkedIn and Facebook

---

## Step 6: Clean Up (Optional)

After successful import, you can:

1. **Delete test posts** if you want a clean slate:
   - In Posts sheet, delete rows for POST-001, POST-002, etc.
   - In Post_Platforms sheet, delete corresponding platform entries

2. **Assign subsidiaries** using the app's bulk actions:
   - Open the Social Media Planner app
   - Filter to show HEMIC posts
   - Select posts that belong to a specific subsidiary
   - Use bulk actions (when implemented) or edit each post individually

---

## What Gets Imported

### Fields Populated Automatically:
- ✅ **Post_Title** - First 50 characters of Post_Copy
- ✅ **Post_Copy** - From "Post Copy" column in Smartsheet
- ✅ **Scheduled_Date** - From "Scheduled Date" column (or calendar dates)
- ✅ **Status** - All set to "Draft"
- ✅ **Client_ID** - CLT-001 (HEMIC)
- ✅ **Hashtags** - From "LinkedIn #" column
- ✅ **Created_By** - emmajean.karen@gmail.com
- ✅ **Created_At** - Today's date
- ✅ **Platforms** - LinkedIn,Facebook (both)
- ✅ **Media_File_URL** - From "Visual" column (Box.com URLs)

### Fields Left Blank (To Fill Later):
- ⬜ **Subsidiary_IDs** - You'll assign these manually
- ⬜ **Content_Category** - Optional
- ⬜ **Campaign_Name** - Optional
- ⬜ **Link_URL** - Optional

---

## Troubleshooting

### "CSV_FILE_ID not updated" error
- Make sure you replaced `YOUR_CSV_FILE_ID_HERE` with your actual file ID from Google Drive

### "File not found" error
- Make sure the CSV file is uploaded to Google Drive
- Make sure you copied the correct file ID
- Make sure the file is shared with your Google account

### "Column not found" error
- Your Smartsheet might have different column names
- Open the script and check the `findColumnIndex()` calls around line 90
- Update the column names to match your Smartsheet headers

### Posts not showing in app
- Refresh the calendar in the app
- Check that Status is set to "Draft"
- Check that Client_ID = CLT-001
- Check execution logs for any errors

### Dates look wrong
- Smartsheet dates might be in a different format
- Check the `parseScheduledDate()` function
- You can manually fix dates in the Google Sheets if needed

---

## Expected Results

After successful import, you should see:

✅ **In Execution Logs:**
```
=== IMPORT COMPLETE ===
Successfully imported 15 posts with 30 platform entries
```
(Numbers will vary based on your data)

✅ **In Posts Sheet:**
- New rows starting at POST-042 (or next available number)
- All posts have Client_ID = CLT-001
- All posts have Status = Draft
- Scheduled dates populated from your Smartsheet

✅ **In Post_Platforms Sheet:**
- Two entries per post (one for LinkedIn, one for Facebook)
- Media_File_URL has Box.com image URLs
- Platform column shows "LinkedIn" or "Facebook"

✅ **In Social Media Planner App:**
- Posts appear on calendar on their scheduled dates
- Clicking a post shows post details
- Can edit posts to assign subsidiaries
- Can change status to Internal_Review when ready

---

## Next Steps After Import

1. **Assign Subsidiaries**:
   - Open each post and select which HEMIC subsidiary it belongs to
   - Options: HEMIC FOC, EPIC, HIMI, HEMIC Foundation
   - Or leave blank if it's general HEMIC content

2. **Review Posts**:
   - Check that post copy looks correct
   - Verify scheduled dates
   - Add any missing information (categories, campaigns, etc.)

3. **Update Statuses**:
   - Move posts from Draft → Internal_Review when ready for team review
   - Use bulk actions to update multiple posts at once

4. **Delete Test Data**:
   - Clean up any test posts (POST-001, POST-002, etc.)
   - This gives you a clean slate for production

---

## Need Help?

If you encounter any issues:

1. Check the execution logs (View → Logs in Apps Script editor)
2. Look for error messages - they usually tell you what's wrong
3. Check that your CSV has the expected column names
4. Verify the file ID is correct
5. Make sure the file is accessible to your Google account

Feel free to ask me if you get stuck!
