/**
 * Social Media Planner - Main Server-Side Script
 *
 * FINAL VERSION: This version fixes the data serialization issue by
 * converting all Date objects from the spreadsheet into text strings
 * before sending them to the web app. This ensures the data can be
 * transmitted correctly.
 */

const SPREADSHEET_ID = '1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss';


function doGet(e) {
  const user = Session.getActiveUser().getEmail();
  const template = HtmlService.createTemplateFromFile('Index');
  template.userEmail = user;
  template.userName = getUserFullName(user) || "Test User";
  template.userRole = getUserDefaultRole(user) || "Admin";

  return template.evaluate()
    .setTitle('Social Media Planner')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}


/**
 * Gets all data from a sheet and converts it to objects.
 * CRITICAL FIX: It now checks each cell for a Date object and converts
 * it to a standard ISO string if found.
 * @param {string} sheetName The name of the sheet to get data from.
 * @returns {Object[]} An array of objects representing the rows.
 */
function getDataAsObjects(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" was not found. Check for typos or extra spaces.`);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return []; 
  }

  const headers = data.shift();
  
  // Map the remaining rows to objects
  return data.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header) {
        let value = row[index];
        
        // ===============================================================
        // THE FIX IS HERE!
        // If the value from the sheet is a JavaScript Date object,
        // convert it to a universal, text-based string format (ISO 8601).
        // ===============================================================
        if (value instanceof Date) {
          value = value.toISOString();
        }
        
        obj[header] = value;
      }
    });
    return obj;
  });
}


function fetchDataWithHandling(sheetName, dataType) {
  try {
    return getDataAsObjects(sheetName);
  } catch (e) {
    const errorMessage = `Failed to get ${dataType}. Reason: ${e.message}`;
    Logger.log(errorMessage);
    throw new Error(errorMessage);
  }
}

// --- Public Functions Exposed to Client-Side JavaScript ---
function getAllClients() { return fetchDataWithHandling('Clients', 'Clients'); }
function getAllPosts() { return fetchDataWithHandling('Posts', 'Posts'); }
function getAllUsers() { return fetchDataWithHandling('Users', 'Users'); }


// --- Web App Diagnostics Function (for troubleshooting) ---
function getDebugInfoForWebApp() {
    // ... This function remains the same as the previous version ...
    const sheetNameToTest = 'Clients';
    let debugOutput = "--- Web App Diagnostics Report ---\n\n";
    try {
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        debugOutput += `✅ Successfully opened spreadsheet: "${spreadsheet.getName()}"\n\n`;
        const allSheetNames = spreadsheet.getSheets().map(s => `"${s.getName()}"`);
        debugOutput += `➡️ Available sheets are: [${allSheetNames.join(', ')}]\n\n`;
        const sheet = spreadsheet.getSheetByName(sheetNameToTest);
        if (!sheet) {
            debugOutput += `❌ ERROR: Could not find a sheet named "${sheetNameToTest}".\n`;
            return debugOutput;
        }
        debugOutput += `✅ Successfully found sheet: "${sheetNameToTest}"\n\n`;
        const dataRange = sheet.getDataRange();
        const numRows = dataRange.getNumRows();
        const values = dataRange.getValues();
        debugOutput += `➡️ The sheet has ${numRows} total rows.\n\n`;
        if (numRows <= 1) {
            debugOutput += `   WARNING: The script sees 1 row or less, indicating it's empty or has only a header.\n`;
        } else {
            debugOutput += `   Header row found: [${values[0].join(', ')}]\n\n`;
            debugOutput += `   First data row found: [${values[1].join(', ')}]\n`;
        }
        return debugOutput;
    } catch (e) {
        debugOutput += `❌ An unexpected error occurred: ${e.message}\n`;
        return debugOutput;
    }
}


// --- User Authorization and Helper Functions ---
function isAuthorizedUser(email) { return true; }
function getUserFullName(email) {
  try { return getDataAsObjects('Users').find(u => u.Email === email)?.Full_Name || 'Unknown User'; }
  catch (e) { return 'Unknown User'; }
}
function getUserDefaultRole(email) {
  try { return getDataAsObjects('Users').find(u => u.Email === email)?.Default_Role || 'Guest'; }
  catch (e) { return 'Guest'; }
}

function testEmailOnly() {
  Logger.log('Testing email for POST-999');
  
  var result = submitForInternalReview('POST-999');
  
  Logger.log('Result: ' + JSON.stringify(result));
  
  return result;
}

/**
 * Load the Approval Dashboard HTML
 */
function loadApprovalDashboard() {
  return HtmlService.createHtmlOutputFromFile('ApprovalDashboard').getContent();
}

function testGetMyPendingApprovals() {
  var approvals = getMyPendingApprovals();
  Logger.log('Found ' + approvals.length + ' pending approvals');
  Logger.log(JSON.stringify(approvals, null, 2));
  return approvals;
}
function testFullWorkflow() {
  // Make sure it's in Draft status first
  updatePostStatus('POST-999', 'Draft');
  
  // Submit for internal review
  var result = submitForInternalReview('POST-999');
  Logger.log('Submitted: ' + JSON.stringify(result));
}

function debugApprovals() {
  var currentUser = Session.getActiveUser().getEmail();
  Logger.log('Logged in as: ' + currentUser);
  
  var approvals = getMyPendingApprovals();
  Logger.log('Found ' + approvals.length + ' pending approvals');
  
  if (approvals.length > 0) {
    Logger.log('First approval: ' + JSON.stringify(approvals[0]));
  }
  
  // Also check what's in the sheet
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Approvals');
  var data = sheet.getDataRange().getValues();
  Logger.log('Total rows in Post_Approvals: ' + (data.length - 1));
  
  for (var i = 1; i < data.length; i++) {
    Logger.log('Row ' + i + ': Post=' + data[i][1] + ', Email=' + data[i][3] + ', Status=' + data[i][5]);
  }
}