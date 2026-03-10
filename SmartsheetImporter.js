/**
 * Smartsheet to Social Media Planner Migration Script
 *
 * This script imports HEMIC posts from a Smartsheet export (Google Sheets) into the Social Media Planner database.
 *
 * HOW TO USE:
 * 1. Export your Smartsheet and open in Google Sheets (or upload to Google Drive)
 * 2. Copy the Google Sheets ID from the URL
 * 3. Update the SOURCE_SPREADSHEET_ID variable below with your file ID
 * 4. Update the SOURCE_SHEET_NAME if needed (default: first sheet)
 * 5. Run importSmartsheetData() function from Apps Script editor
 * 6. Check execution logs for results
 */

// ==================== CONFIGURATION ====================

// Social Media Planner database spreadsheet ID
var TARGET_SPREADSHEET_ID = '1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss';

// Your Smartsheet export Google Sheets ID
var SOURCE_SPREADSHEET_ID = '1SZw-sf0tTaYNn0Y4bGd-IaF0bgg-KA3wtZnebpH_x4s';

// Sheet name within your Smartsheet export (usually "Sheet1" or first tab name)
var SOURCE_SHEET_NAME = 'Sheet1'; // Change this if your sheet has a different name

// HEMIC Configuration
var HEMIC_CONFIG = {
  clientId: 'CLT-001',
  clientName: 'HEMIC',
  defaultPlatforms: 'LinkedIn,Facebook', // Import all posts for both platforms
  defaultStatus: 'Draft', // All posts start as Draft
  createdBy: 'mj.wagner@finnpartners.com',
  createdAt: new Date().toISOString().split('T')[0], // Today's date

  // Week start dates - UPDATE THESE to match your Smartsheet weeks
  // Format: YYYY-MM-DD for the MONDAY of each week
  // The script will calculate Tue-Sun automatically
  weekStartDates: [
    '2024-12-02',  // Week 1 starts Monday, December 2, 2024
    '2024-12-09',  // Week 2 starts Monday, December 9, 2024
    '2024-12-16',  // Week 3 starts Monday, December 16, 2024
    // Add more weeks as needed - one entry per "Post Copy" row in your Smartsheet
  ]
};

// ==================== DEBUG FUNCTIONS ====================

/**
 * Debug function to show actual column names in your Smartsheet
 * Run this FIRST to see what columns are available
 */
function debugShowColumns() {
  try {
    Logger.log('=== DEBUGGING COLUMN NAMES ===');
    var csvData = readGoogleSheet(SOURCE_SPREADSHEET_ID, SOURCE_SHEET_NAME);
    var headers = csvData[0];

    Logger.log('\nACTUAL COLUMN NAMES IN YOUR SHEET:');
    Logger.log('-----------------------------------');
    for (var i = 0; i < headers.length; i++) {
      Logger.log('Column ' + i + ': "' + headers[i] + '"');
    }
    Logger.log('-----------------------------------');
    Logger.log('Total columns: ' + headers.length);
    Logger.log('Total rows (including header): ' + csvData.length);

    return {
      success: true,
      columnCount: headers.length,
      rowCount: csvData.length,
      columns: headers
    };
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    throw error;
  }
}

/**
 * Debug function to show sample data from calendar grid
 * This helps us understand the data structure before importing
 */
function debugShowSampleData() {
  try {
    Logger.log('=== DEBUGGING CALENDAR GRID DATA ===');
    var data = readGoogleSheet(SOURCE_SPREADSHEET_ID, SOURCE_SHEET_NAME);

    // Find key rows
    var postCopyRowIndex = -1;
    var visualRowIndex = -1;

    for (var i = 0; i < data.length; i++) {
      var firstCell = data[i][0];
      if (firstCell === 'Post Copy') {
        postCopyRowIndex = i;
      }
      if (firstCell === 'Visual') {
        visualRowIndex = i;
      }
    }

    Logger.log('Post Copy row found at index: ' + postCopyRowIndex);
    Logger.log('Visual row found at index: ' + visualRowIndex);

    if (postCopyRowIndex >= 0) {
      Logger.log('\nSample Post Copy data (first 3 columns after Primary):');
      var postCopyRow = data[postCopyRowIndex];
      for (var col = 1; col <= 3 && col < postCopyRow.length; col++) {
        Logger.log('Column ' + col + ': ' + (postCopyRow[col] || '[empty]'));
      }
    }

    if (visualRowIndex >= 0) {
      Logger.log('\nSample Visual data (first 3 columns after Primary):');
      var visualRow = data[visualRowIndex];
      for (var col = 1; col <= 3 && col < visualRow.length; col++) {
        Logger.log('Column ' + col + ': ' + (visualRow[col] || '[empty]'));
      }
    }

    return {
      success: true,
      postCopyRow: postCopyRowIndex,
      visualRow: visualRowIndex
    };
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    throw error;
  }
}

/**
 * Debug function to show week header structure
 * This helps us understand how to parse dates
 */
function debugShowWeekHeaders() {
  try {
    Logger.log('=== DEBUGGING WEEK HEADERS ===');
    var data = readGoogleSheet(SOURCE_SPREADSHEET_ID, SOURCE_SHEET_NAME);

    // Find first Post Copy row
    var postCopyRowIndex = -1;
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === 'Post Copy') {
        postCopyRowIndex = i;
        break;
      }
    }

    if (postCopyRowIndex === -1) {
      Logger.log('No Post Copy row found');
      return;
    }

    Logger.log('Post Copy row at index: ' + postCopyRowIndex);
    Logger.log('\nLooking backwards for Week header:');

    // Look backwards up to 20 rows
    for (var i = postCopyRowIndex - 1; i >= Math.max(0, postCopyRowIndex - 20); i--) {
      var firstCell = data[i][0];
      var rowPreview = [];

      for (var col = 0; col <= 7; col++) {
        var cellValue = data[i][col];
        var cellType = typeof cellValue;
        var cellPreview = '';

        if (cellValue instanceof Date) {
          cellPreview = 'Date: ' + cellValue.toISOString();
        } else if (cellValue) {
          cellPreview = cellType + ': "' + String(cellValue).substring(0, 30) + '"';
        } else {
          cellPreview = '[empty]';
        }

        rowPreview.push('Col' + col + '=' + cellPreview);
      }

      Logger.log('Row ' + i + ' (' + (postCopyRowIndex - i) + ' rows above): ' + rowPreview.join(' | '));

      // Stop if we find a Week row
      if (firstCell && typeof firstCell === 'string' && firstCell.indexOf('Week') !== -1) {
        Logger.log('\n^^^ FOUND WEEK HEADER AT ROW ' + i + ' ^^^');
        break;
      }
    }

    return { success: true };
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    throw error;
  }
}

// ==================== MAIN IMPORT FUNCTION ====================

/**
 * Main function to import Smartsheet data
 * Run this from the Apps Script editor
 */
function importSmartsheetData() {
  try {
    Logger.log('=== STARTING SMARTSHEET IMPORT ===');
    Logger.log('Configuration: ' + JSON.stringify(HEMIC_CONFIG));

    // Step 1: Read data from Google Sheets
    Logger.log('\n1. Reading data from Google Sheets...');
    var csvData = readGoogleSheet(SOURCE_SPREADSHEET_ID, SOURCE_SHEET_NAME);
    Logger.log('Found ' + csvData.length + ' rows');

    // Step 2: Parse Smartsheet data
    Logger.log('\n2. Parsing Smartsheet data...');
    var parsedPosts = parseSmartsheetData(csvData);
    Logger.log('Parsed ' + parsedPosts.length + ' posts');

    // Step 3: Get current max Post ID to continue numbering
    Logger.log('\n3. Getting next Post ID...');
    var nextPostId = getNextPostId();
    Logger.log('Next Post ID will be: ' + nextPostId);

    // Step 4: Import posts to Posts sheet
    Logger.log('\n4. Importing posts to Posts sheet...');
    var importedPosts = importPosts(parsedPosts, nextPostId);
    Logger.log('Imported ' + importedPosts.length + ' posts');

    // Step 5: Import platform data to Post_Platforms sheet
    Logger.log('\n5. Importing platform data to Post_Platforms sheet...');
    var platformCount = importPlatforms(importedPosts);
    Logger.log('Imported ' + platformCount + ' platform entries');

    Logger.log('\n=== IMPORT COMPLETE ===');
    Logger.log('Successfully imported ' + importedPosts.length + ' posts with ' + platformCount + ' platform entries');

    return {
      success: true,
      postsImported: importedPosts.length,
      platformsImported: platformCount,
      message: 'Import completed successfully!'
    };

  } catch (error) {
    Logger.log('\n=== IMPORT FAILED ===');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Read data from Google Sheets
 */
function readGoogleSheet(spreadsheetId, sheetName) {
  try {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];

    if (!sheet) {
      throw new Error('Sheet "' + sheetName + '" not found. Available sheets: ' +
        ss.getSheets().map(function(s) { return s.getName(); }).join(', '));
    }

    Logger.log('Reading from sheet: ' + sheet.getName());

    var dataRange = sheet.getDataRange();
    var data = dataRange.getValues();

    return data;

  } catch (error) {
    Logger.log('Error reading Google Sheet: ' + error.toString());
    throw new Error('Failed to read Google Sheet. Make sure the spreadsheet ID is correct and you have access to it. Error: ' + error.toString());
  }
}

/**
 * Parse Smartsheet calendar grid data into post objects
 * This handles the calendar grid format where:
 * - Columns B-H are days of the week (Monday-Sunday)
 * - Rows contain post data (Post Copy, Visual, etc.)
 * - Multiple weeks in the sheet, each with its own "Post Copy" row
 * - Date headers appear above each week section
 */
function parseSmartsheetData(csvData) {
  var posts = [];

  // Find ALL Post Copy rows (one per week)
  var postCopyRows = [];

  for (var i = 0; i < csvData.length; i++) {
    var firstCell = csvData[i][0];
    if (firstCell === 'Post Copy') {
      postCopyRows.push(i);
    }
  }

  if (postCopyRows.length === 0) {
    throw new Error('Could not find any "Post Copy" rows in Smartsheet');
  }

  Logger.log('Found ' + postCopyRows.length + ' Post Copy rows (weeks) at indices: ' + postCopyRows.join(', '));

  // Column headers: Primary Column, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
  var dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Process each Post Copy row (each week)
  for (var weekIndex = 0; weekIndex < postCopyRows.length; weekIndex++) {
    var postCopyRowIndex = postCopyRows[weekIndex];
    var postCopyRow = csvData[postCopyRowIndex];

    // Visual row is typically one row above Post Copy row
    var visualRowIndex = postCopyRowIndex - 1;
    var visualRow = visualRowIndex >= 0 ? csvData[visualRowIndex] : [];

    // Calculate week dates from configuration
    var weekDates = calculateWeekDates(weekIndex);

    Logger.log('Processing week ' + (weekIndex + 1) + ' - Post Copy row: ' + postCopyRowIndex + ', Visual row: ' + visualRowIndex);
    Logger.log('Week dates calculated: ' + JSON.stringify(weekDates));

    // Process each column (skip column 0 which is the "Primary Column")
    for (var col = 1; col < postCopyRow.length && col <= 7; col++) {
      var postCopy = postCopyRow[col];

      // Skip empty cells
      if (!postCopy || postCopy.trim() === '') {
        continue;
      }

      // Get corresponding visual URL
      var visual = '';
      if (visualRow.length > col) {
        visual = visualRow[col] || '';
      }

      // Generate post title (first 50 chars of post copy)
      var postTitle = postCopy.substring(0, 50).trim();
      if (postCopy.length > 50) {
        postTitle += '...';
      }

      // Calculate scheduled date from week dates
      var scheduledDate = '';
      if (weekDates.length > 0 && weekDates[col - 1]) {
        scheduledDate = weekDates[col - 1];
      }

      // Create post object
      var post = {
        postTitle: postTitle,
        postCopy: postCopy,
        scheduledDate: scheduledDate,
        status: HEMIC_CONFIG.defaultStatus,
        clientId: HEMIC_CONFIG.clientId,
        subsidiaryIds: '', // Leave blank - will assign manually later
        contentCategory: '', // Leave blank
        campaignName: '', // Leave blank
        hashtags: '', // Not in current data structure
        linkUrl: '', // Leave blank
        createdBy: HEMIC_CONFIG.createdBy,
        createdAt: HEMIC_CONFIG.createdAt,
        platforms: HEMIC_CONFIG.defaultPlatforms,
        mediaFileUrl: visual,
        dayOfWeek: dayNames[col - 1], // Store which day this was scheduled for
        weekNumber: weekIndex + 1 // Track which week this post belongs to
      };

      posts.push(post);
    }
  }

  return posts;
}

/**
 * Calculate week dates from configuration
 * Takes the Monday start date and calculates Tue-Sun
 */
function calculateWeekDates(weekIndex) {
  var weekDates = [];

  // Check if we have a start date configured for this week
  if (weekIndex >= HEMIC_CONFIG.weekStartDates.length) {
    Logger.log('WARNING: No start date configured for week ' + (weekIndex + 1) + '. Please add more dates to weekStartDates array.');
    return ['', '', '', '', '', '', '']; // Return empty dates
  }

  var mondayDateStr = HEMIC_CONFIG.weekStartDates[weekIndex];

  try {
    // Parse the Monday date
    var monday = new Date(mondayDateStr);

    if (isNaN(monday.getTime())) {
      Logger.log('ERROR: Invalid date format for week ' + (weekIndex + 1) + ': "' + mondayDateStr + '"');
      return ['', '', '', '', '', '', ''];
    }

    // Calculate Monday through Sunday
    for (var dayOffset = 0; dayOffset < 7; dayOffset++) {
      var currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + dayOffset);
      weekDates.push(formatDateAsYYYYMMDD(currentDate));
    }

    return weekDates;

  } catch (e) {
    Logger.log('ERROR calculating dates for week ' + (weekIndex + 1) + ': ' + e.toString());
    return ['', '', '', '', '', '', ''];
  }
}

/**
 * Parse date from week header
 * Handles various date formats from Smartsheet
 */
function parseWeekHeaderDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  try {
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return formatDateAsYYYYMMDD(dateValue);
    }

    // If it's a string, try to parse it
    var dateStr = String(dateValue).trim();

    // Handle formats like "December 2", "9", "16", "21"
    // These are just day numbers - need to combine with month/year

    // Try to parse as JavaScript Date
    var date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return formatDateAsYYYYMMDD(date);
    }

    Logger.log('Warning: Could not parse date "' + dateStr + '", leaving blank');
    return '';

  } catch (e) {
    Logger.log('Warning: Error parsing date "' + dateValue + '": ' + e.toString());
    return '';
  }
}

/**
 * Format Date object as YYYY-MM-DD
 */
function formatDateAsYYYYMMDD(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

/**
 * Find column index by header name (case-insensitive, partial match)
 */
function findColumnIndex(headers, searchTerm) {
  searchTerm = searchTerm.toLowerCase();
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] && headers[i].toLowerCase().indexOf(searchTerm) !== -1) {
      return i;
    }
  }
  return -1; // Not found
}

/**
 * Parse scheduled date from various formats
 */
function parseScheduledDate(dateString) {
  if (!dateString || dateString.trim() === '') {
    return ''; // No date
  }

  try {
    // Try to parse as JavaScript Date
    var date = new Date(dateString);
    if (isNaN(date.getTime())) {
      Logger.log('Warning: Could not parse date "' + dateString + '", leaving blank');
      return '';
    }

    // Format as YYYY-MM-DD
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;

  } catch (e) {
    Logger.log('Warning: Error parsing date "' + dateString + '": ' + e.toString());
    return '';
  }
}

/**
 * Get next available Post ID
 */
function getNextPostId() {
  var ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  var postsSheet = ss.getSheetByName('Posts');
  var data = postsSheet.getDataRange().getValues();

  var maxNum = 0;
  for (var i = 1; i < data.length; i++) {
    var id = data[i][0]; // ID column
    if (id && typeof id === 'string' && id.startsWith('POST-')) {
      var num = parseInt(id.split('-')[1]);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  return maxNum + 1;
}

/**
 * Import posts to Posts sheet
 */
function importPosts(posts, startingId) {
  var ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  var postsSheet = ss.getSheetByName('Posts');

  // Get headers to map columns
  var headers = postsSheet.getRange(1, 1, 1, postsSheet.getLastColumn()).getValues()[0];
  var colMap = {};
  for (var i = 0; i < headers.length; i++) {
    colMap[headers[i]] = i;
  }

  var importedPosts = [];
  var rowsToAdd = [];

  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    var postId = 'POST-' + String(startingId + i).padStart(3, '0');

    // Create row array matching sheet columns
    var row = new Array(headers.length).fill('');
    row[colMap['ID']] = postId;
    row[colMap['Post_Title']] = post.postTitle;
    row[colMap['Post_Copy']] = post.postCopy;
    row[colMap['Scheduled_Date']] = post.scheduledDate;
    row[colMap['Status']] = post.status;
    row[colMap['Client_ID']] = post.clientId;
    row[colMap['Subsidiary_IDs']] = post.subsidiaryIds;
    row[colMap['Content_Category']] = post.contentCategory;
    row[colMap['Campaign_Name']] = post.campaignName;
    row[colMap['Hashtags']] = post.hashtags;
    row[colMap['Link_URL']] = post.linkUrl;
    row[colMap['Created_By']] = post.createdBy;
    row[colMap['Created_At']] = post.createdAt;

    rowsToAdd.push(row);

    // Save post with ID for platform import
    post.id = postId;
    importedPosts.push(post);
  }

  // Append all rows at once
  if (rowsToAdd.length > 0) {
    postsSheet.getRange(postsSheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
  }

  return importedPosts;
}

/**
 * Import platform data to Post_Platforms sheet
 */
function importPlatforms(posts) {
  var ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  var platformsSheet = ss.getSheetByName('Post_Platforms');

  var rowsToAdd = [];
  var count = 0;

  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    var platforms = post.platforms.split(',');

    for (var j = 0; j < platforms.length; j++) {
      var platform = platforms[j].trim();

      // Create platform row: [Post_ID, Platform, Media_File_URL, Media_Type, Notes]
      var row = [
        post.id,
        platform,
        post.mediaFileUrl,
        'Image', // Default to Image
        ''
      ];

      rowsToAdd.push(row);
      count++;
    }
  }

  // Append all rows at once
  if (rowsToAdd.length > 0) {
    platformsSheet.getRange(platformsSheet.getLastRow() + 1, 1, rowsToAdd.length, 5).setValues(rowsToAdd);
  }

  return count;
}

/**
 * Helper: Pad string with zeros
 */
String.prototype.padStart = String.prototype.padStart || function(targetLength, padString) {
  targetLength = targetLength >> 0;
  padString = String(padString || ' ');
  if (this.length >= targetLength) {
    return String(this);
  }
  targetLength = targetLength - this.length;
  if (targetLength > padString.length) {
    padString += padString.repeat(targetLength / padString.length);
  }
  return padString.slice(0, targetLength) + String(this);
};
