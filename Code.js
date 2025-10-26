/**
 * Social Media Planner - Main Server-Side Script
 *
 * FINAL VERSION: This version fixes the data serialization issue by
 * converting all Date objects from the spreadsheet into text strings
 * before sending them to the web app. This ensures the data can be
 * transmitted correctly.
 */

const SPREADSHEET_ID = '1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss';

/**
 * Include function for templates
 * Used to include external HTML/JS/CSS files
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(e) {
  try {
    Logger.log('=== doGet called ===');
    Logger.log('e: ' + JSON.stringify(e));
    Logger.log('e.parameter: ' + JSON.stringify(e.parameter));

    // Check if this is an API request (for external client portal)
    const action = e && e.parameter ? e.parameter.action : null;
    const token = e && e.parameter ? e.parameter.token : null;

    if (action === 'getClientData' && token) {
      // API endpoint - returns JSON data for external client portal
      Logger.log('API request for client data with token: ' + token);
      const validationResult = validateClientAccess(token);

      // Support JSONP for cross-origin requests
      const callback = e.parameter.callback || 'callback';
      const jsonOutput = JSON.stringify(validationResult);

      // Return JSONP response
      return ContentService
        .createTextOutput(callback + '(' + jsonOutput + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    // Check if this is a client portal request (legacy server-side rendering)
    const page = e && e.parameter ? e.parameter.page : null;

    Logger.log('page: ' + page);
    Logger.log('token: ' + token);

    if (page === 'client' && token) {
    // Client portal access - SERVER-SIDE RENDERING (no client JS due to CSP for anonymous users)
    Logger.log('Client portal access requested with token: ' + token);

    // Validate token on SERVER
    const validationResult = validateClientAccess(token);
    Logger.log('Validation result: ' + JSON.stringify(validationResult));

    // Create template and pass data to it
    const template = HtmlService.createTemplateFromFile('ClientPortal');

    if (validationResult.success) {
      // Pass data to template for server-side rendering
      template.clientInfo = validationResult.clientInfo;
      template.posts = validationResult.posts;
      template.validToken = true;
      template.errorMessage = null;
    } else {
      // Pass error to template
      template.clientInfo = null;
      template.posts = [];
      template.validToken = false;
      template.errorMessage = validationResult.error || 'Invalid access token';
    }

    return template.evaluate()
      .setTitle('Content Review Portal')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }

    // Internal user access (existing behavior)
    Logger.log('Not a client portal request, checking for authenticated user...');
    const user = Session.getActiveUser().getEmail();

    if (!user) {
      Logger.log('No authenticated user found');
      throw new Error('Access denied. Please use a valid access link or sign in.');
    }

    Logger.log('Authenticated user: ' + user);
    const template = HtmlService.createTemplateFromFile('Index');
    template.userEmail = user;
    template.userName = getUserFullName(user) || "Test User";
    template.userRole = getUserDefaultRole(user) || "Admin";

    return template.evaluate()
      .setTitle('Social Media Planner')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');

  } catch (error) {
    Logger.log('ERROR in doGet: ' + error.message);
    Logger.log('Stack: ' + error.stack);

    // Return error page
    return HtmlService.createHtmlOutput(
      '<html><body style="font-family: Arial; padding: 40px; text-align: center;">' +
      '<h1 style="color: #dc3545;">Access Error</h1>' +
      '<p>' + error.message + '</p>' +
      '<p style="color: #666; font-size: 14px;">Please contact support if this problem persists.</p>' +
      '</body></html>'
    );
  }
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

/**
 * TEST FUNCTION: Grant access to a client
 * Run this from Apps Script editor to generate a client access link
 * Using your personal email for testing
 */
function testGrantClientAccess() {
  // Test with HEMIC client and your personal email
  var clientId = 'CLT-001';
  var email = 'Aloha_Aina@icloud.com';

  var result = grantClientAccess(clientId, email, 'Full');

  if (result.success) {
    Logger.log('========================================');
    Logger.log('✅ CLIENT ACCESS GRANTED!');
    Logger.log('========================================');
    Logger.log('📧 Email: ' + email);
    Logger.log('🔑 Token: ' + result.token);
    Logger.log('');
    Logger.log('📋 FULL ACCESS URL (copy this):');
    Logger.log(result.url);
    Logger.log('');
    Logger.log('⚠️ IMPORTANT: Make sure you deployed the web app with:');
    Logger.log('   - Execute as: Me');
    Logger.log('   - Who has access: Anyone');
    Logger.log('========================================');
  } else {
    Logger.log('❌ Error: ' + result.error);
  }

  return result;
}

/**
 * Test validateClientAccess directly with the most recent token
 * Run this to verify the backend validation works
 */
function testValidateClientAccess() {
  // Use the token from the most recent testGrantClientAccess
  var token = 'U8lJBOmleVpKs4teoQq27f3HHKhqGxeT';

  Logger.log('========================================');
  Logger.log('🧪 TESTING TOKEN VALIDATION');
  Logger.log('========================================');
  Logger.log('Token: ' + token);
  Logger.log('');

  var result = validateClientAccess(token);

  Logger.log('');
  Logger.log('========================================');
  Logger.log('📊 VALIDATION RESULT:');
  Logger.log('========================================');
  Logger.log('Success: ' + result.success);

  if (result.success) {
    Logger.log('✅ Token is valid!');
    Logger.log('Client: ' + result.clientInfo.Client_Name);
    Logger.log('Client ID: ' + result.clientInfo.Client_ID);
    Logger.log('Number of posts: ' + result.posts.length);
    Logger.log('Access Level: ' + result.authorizedClient.Access_Level);
    Logger.log('');
    Logger.log('📋 Sample posts:');
    if (result.posts.length > 0) {
      for (var i = 0; i < Math.min(3, result.posts.length); i++) {
        Logger.log('  - ' + result.posts[i].Post_Title + ' (' + result.posts[i].Status + ')');
      }
    }
  } else {
    Logger.log('❌ Token validation failed!');
    Logger.log('Error: ' + result.error);
  }
  Logger.log('========================================');

  return result;
}

/**
 * Setup the Authorized_Clients sheet with proper structure
 * Run this ONCE to create the sheet with correct columns
 */
function setupAuthorizedClientsSheet() {
  Logger.log('========================================');
  Logger.log('🔧 SETTING UP AUTHORIZED_CLIENTS SHEET');
  Logger.log('========================================');

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Authorized_Clients');

    // If sheet exists, log warning
    if (sheet) {
      Logger.log('⚠️ Sheet already exists!');
      Logger.log('Current columns: ' + sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].join(', '));
      Logger.log('');
      Logger.log('Do you want to recreate it? If yes, manually delete the sheet first and run this again.');
      return;
    }

    // Create new sheet
    Logger.log('Creating new Authorized_Clients sheet...');
    sheet = ss.insertSheet('Authorized_Clients');

    // Define columns
    var headers = [
      'ID',
      'Client_ID',
      'Email',
      'Access_Token',
      'Access_Level',
      'Status',
      'Created_Date',
      'Created_By',
      'Last_Login',
      'Token_Expires'
    ];

    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');

    // Set column widths
    sheet.setColumnWidth(1, 150);  // ID
    sheet.setColumnWidth(2, 120);  // Client_ID
    sheet.setColumnWidth(3, 250);  // Email
    sheet.setColumnWidth(4, 350);  // Access_Token
    sheet.setColumnWidth(5, 120);  // Access_Level
    sheet.setColumnWidth(6, 100);  // Status
    sheet.setColumnWidth(7, 180);  // Created_Date
    sheet.setColumnWidth(8, 250);  // Created_By
    sheet.setColumnWidth(9, 180);  // Last_Login
    sheet.setColumnWidth(10, 180); // Token_Expires

    // Freeze header row
    sheet.setFrozenRows(1);

    Logger.log('✅ Sheet created successfully!');
    Logger.log('Columns: ' + headers.join(', '));
    Logger.log('');
    Logger.log('🎉 Now run testGrantClientAccess to create a client access token!');

  } catch (e) {
    Logger.log('❌ ERROR: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }

  Logger.log('========================================');
}

/**
 * Diagnostic: Check what's in the Authorized_Clients sheet
 */
function debugAuthorizedClientsSheet() {
  Logger.log('========================================');
  Logger.log('🔍 DEBUGGING AUTHORIZED_CLIENTS SHEET');
  Logger.log('========================================');

  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Authorized_Clients');

    if (!sheet) {
      Logger.log('❌ ERROR: Authorized_Clients sheet does not exist!');
      return;
    }

    var data = sheet.getDataRange().getValues();

    Logger.log('Sheet found. Rows: ' + data.length);
    Logger.log('');
    Logger.log('📋 HEADERS:');
    Logger.log(data[0].join(' | '));
    Logger.log('');

    if (data.length > 1) {
      Logger.log('📊 DATA ROWS:');
      for (var i = 1; i < data.length; i++) {
        Logger.log('');
        Logger.log('Row ' + i + ':');
        data[0].forEach(function(header, index) {
          Logger.log('  ' + header + ': ' + data[i][index]);
        });
      }
    } else {
      Logger.log('⚠️ No data rows found in sheet!');
    }

    Logger.log('');
    Logger.log('========================================');
    Logger.log('🔎 SEARCHING FOR TOKEN:');
    Logger.log('========================================');
    var targetToken = 'U8lJBOmleVpKs4teoQq27f3HHKhqGxeT';
    Logger.log('Looking for: ' + targetToken);
    Logger.log('');

    var tokenColIndex = data[0].indexOf('Access_Token');
    var statusColIndex = data[0].indexOf('Status');

    Logger.log('Access_Token column index: ' + tokenColIndex);
    Logger.log('Status column index: ' + statusColIndex);
    Logger.log('');

    var found = false;
    for (var i = 1; i < data.length; i++) {
      var rowToken = data[i][tokenColIndex];
      var rowStatus = data[i][statusColIndex];
      Logger.log('Row ' + i + ' - Token: ' + rowToken + ', Status: ' + rowStatus);
      if (rowToken === targetToken) {
        found = true;
        Logger.log('  ✅ FOUND! Status: ' + rowStatus);
      }
    }

    if (!found) {
      Logger.log('');
      Logger.log('❌ Token not found in sheet!');
    }

  } catch (e) {
    Logger.log('❌ ERROR: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }

  Logger.log('========================================');
}

/**
 * Validate client access and return their data
 * Called from ClientPortal.html
 */
function validateClientAccess(token) {
  try {
    Logger.log('========== VALIDATING CLIENT ACCESS ==========');
    Logger.log('Token received: ' + token);

    // Validate the token
    var authorizedClient = validateClientToken(token);
    Logger.log('Token validation result: ' + JSON.stringify(authorizedClient));

    if (!authorizedClient) {
      Logger.log('ERROR: Token validation failed - token not found or inactive');
      return {success: false, error: 'Invalid or expired access token'};
    }

    // Get client info
    Logger.log('Looking up client: ' + authorizedClient.Client_ID);
    var client = getClientById(authorizedClient.Client_ID);

    if (!client) {
      Logger.log('ERROR: Client not found: ' + authorizedClient.Client_ID);
      return {success: false, error: 'Client not found'};
    }

    Logger.log('Client found: ' + client.Client_Name);

    // Get posts for this client
    var posts = getClientPostsWithImages(authorizedClient.Client_ID);

    Logger.log('Client access validated. Returning ' + posts.length + ' posts for client: ' + client.Client_Name);

    return {
      success: true,
      clientInfo: client,
      authorizedClient: authorizedClient,
      posts: posts
    };

  } catch (e) {
    Logger.log('ERROR validating client access: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    return {success: false, error: 'An error occurred: ' + e.message};
  }
}

/**
 * SIMPLE TEST FUNCTION - Generate token for Aloha_Aina@icloud.com
 * Run this, then check Execution log for the URL
 */
function GENERATE_TOKEN_FOR_TESTING() {
  var result = grantClientAccess('CLT-001', 'Aloha_Aina@icloud.com', 'Full');

  Logger.log('=====================================');
  Logger.log('TOKEN: ' + result.token);
  Logger.log('');
  Logger.log('COPY THIS URL:');
  Logger.log('https://mjwagner808.github.io/Social-Media-Planner/client-portal.html?token=' + result.token);
  Logger.log('=====================================');

  return result;
}