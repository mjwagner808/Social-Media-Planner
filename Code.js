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
      Logger.log('✅ JSONP API ENDPOINT HIT');
      Logger.log('Token: ' + token);
      Logger.log('Callback: ' + (e.parameter.callback || 'callback'));

      const validationResult = validateClientAccess(token);
      Logger.log('Validation result: ' + JSON.stringify(validationResult));

      // Support JSONP for cross-origin requests
      const callback = e.parameter.callback || 'callback';
      const jsonOutput = JSON.stringify(validationResult);
      const response = callback + '(' + jsonOutput + ')';

      Logger.log('Response length: ' + response.length + ' chars');
      Logger.log('Response preview: ' + response.substring(0, 100));

      // Return JSONP response
      return ContentService
        .createTextOutput(response)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    // Get comments for a post endpoint
    if (action === 'getPostComments' && token) {
      Logger.log('✅ GET POST COMMENTS ENDPOINT HIT');
      Logger.log('Token: ' + token);
      Logger.log('Post ID: ' + e.parameter.postId);

      const result = getPostCommentsForClient(token, e.parameter.postId);

      const callback = e.parameter.callback || 'callback';
      const jsonOutput = JSON.stringify(result);
      const response = callback + '(' + jsonOutput + ')';

      return ContentService
        .createTextOutput(response)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    // Client approval submission endpoint
    Logger.log('Checking submitClientApproval: action=' + action + ', token=' + token);
    if (action === 'submitClientApproval' && token) {
      Logger.log('✅ CLIENT APPROVAL SUBMISSION ENDPOINT HIT');
      Logger.log('Token: ' + token);
      Logger.log('Post ID: ' + e.parameter.postId);
      Logger.log('Decision: ' + e.parameter.decision);
      Logger.log('Notes: ' + (e.parameter.notes || ''));

      const result = handleClientApproval(
        token,
        e.parameter.postId,
        e.parameter.decision,
        e.parameter.notes || '',
        e.parameter.commentType || ''
      );

      Logger.log('handleClientApproval returned: ' + JSON.stringify(result));

      const callback = e.parameter.callback || 'callback';
      const jsonOutput = JSON.stringify(result);
      const response = callback + '(' + jsonOutput + ')';

      Logger.log('Returning JSONP response with callback: ' + callback);

      return ContentService
        .createTextOutput(response)
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
 * Handle client approval submission from external portal
 * @param {string} token - Client access token
 * @param {string} postId - Post ID being reviewed
 * @param {string} decision - 'Approved' or 'Changes_Requested'
 * @param {string} notes - Client comments
 * @returns {Object} - {success: true/false, message: string}
 */
function handleClientApproval(token, postId, decision, notes, commentType) {
  try {
    Logger.log('=== HANDLING CLIENT APPROVAL ===');
    Logger.log('Token: ' + token);
    Logger.log('Post ID: ' + postId);
    Logger.log('Decision: ' + decision);
    Logger.log('Notes: ' + notes);
    Logger.log('Comment Type: ' + commentType);

    // Validate token
    const authorizedClient = validateClientToken(token);
    if (!authorizedClient) {
      return {success: false, error: 'Invalid or expired access token'};
    }

    Logger.log('Authorized client: ' + authorizedClient.Email + ', Client: ' + authorizedClient.Client_ID);

    // Get all posts accessible to this client (handles subsidiaries)
    const clientPosts = getClientPosts(authorizedClient.Client_ID);
    const post = clientPosts.find(function(p) { return p.ID === postId; });

    if (!post) {
      return {success: false, error: 'Post not found or you do not have access to this post'};
    }

    Logger.log('Post validated: ' + post.Post_Title + ', Client: ' + post.Client_ID);

    // Handle comment-only (no approval record needed for comments on non-Client_Review posts)
    if (decision === 'Comment') {
      Logger.log('Adding comment (no approval decision)');

      // Add comment to Comments sheet
      const commentResult = addComment(
        postId,
        authorizedClient.Email,
        'Client',
        notes,
        post,
        commentType
      );

      if (!commentResult.success) {
        Logger.log('Failed to add comment: ' + commentResult.error);
        return {success: false, error: 'Failed to save comment: ' + commentResult.error};
      }

      Logger.log('Comment saved with ID: ' + commentResult.commentId);

      // ALWAYS send email notification when client comments (regardless of approval record existence)
      Logger.log('========================================');
      Logger.log('CLIENT COMMENT RECEIVED');
      Logger.log('Post ID: ' + postId);
      Logger.log('Post Title: ' + post.Post_Title);
      Logger.log('Client: ' + authorizedClient.Client_ID + ' (' + authorizedClient.Email + ')');
      Logger.log('Comment: ' + notes);
      Logger.log('Timestamp: ' + new Date());
      Logger.log('========================================');

      // Send email notification to internal team
      var subject = 'Client Comment: ' + post.Post_Title;
      var body = 'A client has submitted a comment on a post:\n\n' +
                 'Post: ' + post.Post_Title + ' (ID: ' + postId + ')\n' +
                 'Client: ' + authorizedClient.Email + '\n' +
                 'Post Status: ' + post.Status + '\n' +
                 'Comment: ' + notes + '\n\n' +
                 'Please review the comment and follow up as needed.';

      // Get post creator to notify
      if (post.Created_By) {
        try {
          Logger.log('Sending email to post creator: ' + post.Created_By);
          MailApp.sendEmail(post.Created_By, subject, body);
          Logger.log('✅ Email sent successfully to: ' + post.Created_By);
        } catch (emailError) {
          Logger.log('❌ Failed to send email: ' + emailError.message);
          Logger.log('Stack: ' + emailError.stack);
        }
      } else {
        Logger.log('⚠️ No post creator email found - cannot send notification');
      }

      return {
        success: true,
        message: 'Comment submitted successfully. The team will review your feedback.'
      };
    }

    // Find the client approval record for this post (for Approve/Request Changes)
    // Accept both 'Client_Review' and 'Client' stage names for compatibility
    const approvals = _readSheetAsObjects_('Post_Approvals', {
      filterFn: function(a) {
        return a.Post_ID === postId && (a.Approval_Stage === 'Client_Review' || a.Approval_Stage === 'Client');
      }
    });

    if (!approvals || approvals.length === 0) {
      return {success: false, error: 'No client approval record found for this post. This post may not be in Client Review status.'};
    }

    // Update the approval record
    const approval = approvals[0];
    const approvalStatus = decision === 'Approved' ? 'Approved' : 'Changes_Requested';

    Logger.log('Updating approval record: ' + approval.ID + ' to status: ' + approvalStatus);
    Logger.log('Approver email: ' + authorizedClient.Email);

    const updateResult = recordApprovalDecision(approval.ID, approvalStatus, notes, authorizedClient.Email);

    if (!updateResult.success) {
      return {success: false, error: 'Failed to record approval decision'};
    }

    // Also save to Comments sheet for visibility
    if (notes && notes.trim()) {
      const commentResult = addComment(
        postId,
        authorizedClient.Email,
        'Client',
        notes,
        post,
        decision === 'Approved' ? 'Approval_Feedback' : 'Revision_Request'
      );
      Logger.log('Comment saved to Comments sheet: ' + (commentResult.success ? commentResult.commentId : commentResult.error));
    }

    Logger.log('✅ Client approval recorded successfully');

    return {
      success: true,
      message: decision === 'Approved' ? 'Post approved successfully' : 'Change request submitted successfully'
    };

  } catch (e) {
    Logger.log('ERROR handling client approval: ' + e.message);
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

/**
 * DIAGNOSTIC - Check why post status isn't updating after approval
 * Run this with a Post ID to see approval workflow state
 * Usage: DIAGNOSE_POST_STATUS('POST-012') or just DIAGNOSE_POST_STATUS() to use default
 */
function DIAGNOSE_POST_STATUS(postId) {
  // Default to POST-012 if no parameter provided
  if (!postId) {
    postId = 'POST-012';
    Logger.log('No Post ID provided, using default: ' + postId);
  }

  Logger.log('=== DIAGNOSING POST STATUS FOR: ' + postId + ' ===');

  // Get post current status
  var posts = _readSheetAsObjects_('Posts', {
    filterFn: function(p) { return p.ID === postId; }
  });

  if (posts.length === 0) {
    Logger.log('❌ Post not found: ' + postId);
    Logger.log('Make sure the Post ID is correct (e.g., POST-012)');
    Logger.log('Available posts can be found in the Posts sheet');
    return;
  }

  var post = posts[0];
  Logger.log('Current Post Status: ' + post.Status);

  // Get all approvals for this post
  var allApprovals = _readSheetAsObjects_('Post_Approvals', {
    filterFn: function(a) { return a.Post_ID === postId; }
  });

  Logger.log('Total approval records: ' + allApprovals.length);

  allApprovals.forEach(function(approval) {
    Logger.log('  - ' + approval.Approval_Stage + ': ' + approval.Approval_Status + ' (ID: ' + approval.ID + ')');
  });

  // Check internal approvals
  var internalApprovals = allApprovals.filter(function(a) {
    return a.Approval_Stage === 'Internal_Review' || a.Approval_Stage === 'Internal';
  });

  var clientApprovals = allApprovals.filter(function(a) {
    return a.Approval_Stage === 'Client_Review' || a.Approval_Stage === 'Client';
  });

  Logger.log('');
  Logger.log('Internal approvals: ' + internalApprovals.length);
  Logger.log('Client approvals: ' + clientApprovals.length);

  var allInternalApproved = internalApprovals.length > 0 && internalApprovals.every(function(a) {
    return a.Approval_Status === 'Approved';
  });

  var allClientApproved = clientApprovals.length > 0 && clientApprovals.every(function(a) {
    return a.Approval_Status === 'Approved';
  });

  Logger.log('All internal approved: ' + allInternalApproved);
  Logger.log('All client approved: ' + allClientApproved);

  Logger.log('');
  Logger.log('EXPECTED OUTCOME:');
  if (allInternalApproved && allClientApproved) {
    Logger.log('✅ Should update to: Approved');
  } else if (allInternalApproved && clientApprovals.length === 0) {
    Logger.log('⏳ Should remain: Internal_Review (waiting for client approval)');
  } else {
    Logger.log('⏳ Still awaiting approvals');
  }
}

/**
 * TEST FUNCTION - Simulate client comment submission
 * Run this directly in Apps Script to test the comment flow
 */
function TEST_COMMENT_SUBMISSION() {
  Logger.log('=== TESTING COMMENT SUBMISSION ===');

  // Use the active test token
  var token = 'dy3a4nNN8FsTZH1uEfVGJJauyjWoXMbR';
  var postId = 'POST-019'; // HIMI eblast: Marine...
  var decision = 'Comment';
  var notes = 'This is a test comment from the TEST_COMMENT_SUBMISSION function';

  Logger.log('Token: ' + token);
  Logger.log('Post ID: ' + postId);
  Logger.log('Decision: ' + decision);
  Logger.log('Notes: ' + notes);
  Logger.log('');

  var result = handleClientApproval(token, postId, decision, notes);

  Logger.log('');
  Logger.log('=== RESULT ===');
  Logger.log(JSON.stringify(result, null, 2));

  return result;
}

/**
 * SIMPLE EMAIL TEST - Test if MailApp is working at all
 * Run this to verify email functionality
 */
function TEST_SIMPLE_EMAIL() {
  Logger.log('=== TESTING EMAIL FUNCTIONALITY ===');

  var currentUser = Session.getActiveUser().getEmail();
  Logger.log('Script is running as: ' + currentUser);
  Logger.log('Effective user: ' + Session.getEffectiveUser().getEmail());

  // Check email quota
  var quotaRemaining = MailApp.getRemainingDailyQuota();
  Logger.log('Remaining daily email quota: ' + quotaRemaining);

  var recipient = 'mj.wagner@finnpartners.com';
  var subject = 'Test Email from Social Media Planner App';
  var body = 'This is a test email sent at ' + new Date() + '\n\n' +
             'If you receive this, email functionality is working.\n\n' +
             'Script running as: ' + currentUser;

  try {
    Logger.log('Attempting to send email to: ' + recipient);
    MailApp.sendEmail(recipient, subject, body);
    Logger.log('✅ Email sent successfully (according to MailApp)');
    Logger.log('Check your inbox at: ' + recipient);
    Logger.log('Also check spam/junk folders');
    Logger.log('Quota remaining after send: ' + MailApp.getRemainingDailyQuota());
    return {success: true, message: 'Email sent'};
  } catch (e) {
    Logger.log('❌ Error sending email: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    return {success: false, error: e.message};
  }
}

/**
 * TEST EMAIL TO EXTERNAL ADDRESS
 * Test sending to the client email (non-company address)
 */
function TEST_EMAIL_TO_CLIENT() {
  Logger.log('=== TESTING EMAIL TO EXTERNAL ADDRESS ===');

  var quotaRemaining = MailApp.getRemainingDailyQuota();
  Logger.log('Remaining daily email quota: ' + quotaRemaining);

  var recipient = 'Aloha_Aina@icloud.com';
  var subject = 'Test Email from Social Media Planner - Please Confirm Receipt';
  var body = 'This is a test email from your Social Media Planner app.\n\n' +
             'Sent at: ' + new Date() + '\n\n' +
             'If you receive this email, please let MJ know!\n\n' +
             'This confirms that email notifications are working correctly.';

  try {
    Logger.log('Attempting to send email to: ' + recipient);
    MailApp.sendEmail(recipient, subject, body);
    Logger.log('✅ Email sent successfully to external address');
    Logger.log('Quota remaining after send: ' + MailApp.getRemainingDailyQuota());
    return {success: true, message: 'Email sent to ' + recipient};
  } catch (e) {
    Logger.log('❌ Error sending email: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    return {success: false, error: e.message};
  }
}

/**
 * ADMIN FUNCTION - Create Comments sheet
 * Run this ONCE to create the Comments sheet with proper structure
 */
function CREATE_COMMENTS_SHEET() {
  Logger.log('=== CREATING COMMENTS SHEET ===');

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Check if Comments sheet already exists
    var existingSheet = ss.getSheetByName('Comments');
    if (existingSheet) {
      Logger.log('Comments sheet already exists');
      return {success: false, error: 'Comments sheet already exists. Delete it first if you want to recreate it.'};
    }

    // Create new sheet
    var sheet = ss.insertSheet('Comments');

    // Set up headers
    var headers = [
      'ID',              // Comment ID (COM-001, COM-002, etc.)
      'Post_ID',         // Link to Posts sheet
      'Commenter_Email', // Who made the comment
      'Commenter_Type',  // 'Client' or 'Internal'
      'Comment_Text',    // The actual comment
      'Created_Date',    // When the comment was made
      'Post_Title',      // Denormalized for easy viewing
      'Post_Status'      // Post status at time of comment
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff');

    // Set column widths
    sheet.setColumnWidth(1, 100);  // ID
    sheet.setColumnWidth(2, 100);  // Post_ID
    sheet.setColumnWidth(3, 200);  // Commenter_Email
    sheet.setColumnWidth(4, 100);  // Commenter_Type
    sheet.setColumnWidth(5, 400);  // Comment_Text
    sheet.setColumnWidth(6, 150);  // Created_Date
    sheet.setColumnWidth(7, 250);  // Post_Title
    sheet.setColumnWidth(8, 120);  // Post_Status

    // Freeze header row
    sheet.setFrozenRows(1);

    Logger.log('✅ Comments sheet created successfully');

    return {success: true, message: 'Comments sheet created'};

  } catch (e) {
    Logger.log('ERROR: ' + e.message);
    Logger.log(e.stack);
    return {success: false, error: e.message};
  }
}

/**
 * Get comments for a post (for client portal)
 * @param {string} token - Client access token
 * @param {string} postId - Post ID
 * @returns {Object} - {success: true, comments: [...]} or error
 */
function getPostCommentsForClient(token, postId) {
  try {
    // Validate token
    const authorizedClient = validateClientToken(token);
    if (!authorizedClient) {
      return {success: false, error: 'Invalid or expired access token'};
    }

    // Get all posts accessible to this client
    const clientPosts = getClientPosts(authorizedClient.Client_ID);
    const post = clientPosts.find(function(p) { return p.ID === postId; });

    if (!post) {
      return {success: false, error: 'Post not found or you do not have access'};
    }

    // Get comments for this post from Comments sheet
    const comments = _readSheetAsObjects_('Comments', {
      filterFn: function(c) {
        return c.Post_ID === postId;
      },
      sortFn: function(a, b) {
        var dateA = a.Created_Date ? new Date(a.Created_Date) : new Date(0);
        var dateB = b.Created_Date ? new Date(b.Created_Date) : new Date(0);
        return dateA - dateB; // Oldest first
      },
      coerceFn: function(c) {
        // Convert dates to ISO strings for JSON serialization
        if (c.Created_Date instanceof Date) {
          c.Created_Date = c.Created_Date.toISOString();
        }
        return c;
      }
    });

    return {success: true, comments: comments};

  } catch (e) {
    Logger.log('ERROR getting post comments: ' + e.message);
    Logger.log(e.stack);
    return {success: false, error: e.message};
  }
}

/**
 * Add a comment to the Comments sheet
 * @param {string} postId - Post ID
 * @param {string} commenterEmail - Email of person commenting
 * @param {string} commenterType - 'Client' or 'Internal'
 * @param {string} commentText - The comment
 * @param {Object} post - Post object (for denormalized fields)
 * @param {string} commentCategory - Optional comment category/type
 * @returns {Object} - {success: true, commentId: '...'} or error
 */
function addComment(postId, commenterEmail, commenterType, commentText, post, commentCategory) {
  try {
    Logger.log('Adding comment to Comments sheet');
    Logger.log('Post ID: ' + postId);
    Logger.log('Commenter: ' + commenterEmail + ' (' + commenterType + ')');
    Logger.log('Comment Category: ' + commentCategory);

    var sheet = _getSheet_('Comments');
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Generate comment ID
    var commentId = generateId('COM');

    // Prepare row data
    var rowData = [];
    headers.forEach(function(header) {
      switch(header) {
        case 'ID':
          rowData.push(commentId);
          break;
        case 'Post_ID':
          rowData.push(postId);
          break;
        case 'Commenter_Email':
          rowData.push(commenterEmail);
          break;
        case 'Commenter_Type':
          rowData.push(commenterType);
          break;
        case 'Comment_Text':
          rowData.push(commentText);
          break;
        case 'Created_Date':
          rowData.push(new Date());
          break;
        case 'Post_Title':
          rowData.push(post ? post.Post_Title : '');
          break;
        case 'Post_Status':
          rowData.push(post ? post.Status : '');
          break;
        case 'Comment_Type':
          rowData.push(commentCategory || '');
          break;
        case 'Status':
          rowData.push('Open'); // Use 'Open' to match dropdown validation
          break;
        default:
          rowData.push('');
      }
    });

    // Append to sheet
    sheet.appendRow(rowData);

    Logger.log('✅ Comment added: ' + commentId);

    return {success: true, commentId: commentId};

  } catch (e) {
    Logger.log('ERROR adding comment: ' + e.message);
    Logger.log(e.stack);
    return {success: false, error: e.message};
  }
}

/**
 * ADMIN FUNCTION - Create approval records for Client_Review posts
 * Run this to fix posts that have Client_Review status but no approval records
 * This allows Approve/Request Changes buttons to work
 */
function FIX_CLIENT_REVIEW_POSTS() {
  Logger.log('=== FIXING CLIENT_REVIEW POSTS ===');

  try {
    // Get all posts with Client_Review status
    var posts = _readSheetAsObjects_('Posts', {
      filterFn: function(p) {
        return p.Status === 'Client_Review' || p.Status === 'Client Review';
      }
    });

    Logger.log('Found ' + posts.length + ' posts with Client_Review status');

    if (posts.length === 0) {
      Logger.log('No posts to fix');
      return {success: true, message: 'No posts need fixing'};
    }

    var fixed = 0;
    var skipped = 0;

    posts.forEach(function(post) {
      Logger.log('Checking post: ' + post.ID + ' - ' + post.Post_Title);

      // Check if INTERNAL approval exists (required for workflow)
      var existingInternal = _readSheetAsObjects_('Post_Approvals', {
        filterFn: function(a) {
          return a.Post_ID === post.ID && (a.Approval_Stage === 'Internal_Review' || a.Approval_Stage === 'Internal');
        }
      });

      // Check if CLIENT approval record already exists (check both stage name variants)
      var existingClient = _readSheetAsObjects_('Post_Approvals', {
        filterFn: function(a) {
          return a.Post_ID === post.ID && (a.Approval_Stage === 'Client_Review' || a.Approval_Stage === 'Client');
        }
      });

      if (existingInternal.length > 0 && existingClient.length > 0) {
        Logger.log('  ⏭️  Already has both internal and client approval records, skipping');
        skipped++;
        return;
      }

      // Create missing approval records
      var sheet = _getSheet_('Post_Approvals');
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var currentUser = Session.getActiveUser().getEmail();

      // Create INTERNAL approval if missing (pre-approved since post is already in Client_Review)
      if (existingInternal.length === 0) {
        Logger.log('  ➕ Creating internal approval record (pre-approved)');
        var internalId = generateId('PA');
        var internalRow = [];
        headers.forEach(function(header) {
          switch(header) {
            case 'ID': internalRow.push(internalId); break;
            case 'Post_ID': internalRow.push(post.ID); break;
            case 'Approval_Stage': internalRow.push('Internal'); break;
            case 'Approver_Email': internalRow.push(currentUser); break;
            case 'Approval_Status': internalRow.push('Approved'); break;
            case 'Requested_Date': internalRow.push(new Date()); break;
            case 'Decision_Date': internalRow.push(new Date()); break;
            case 'Decision_Notes': internalRow.push('Auto-approved (post already in Client Review)'); break;
            case 'Created_By': internalRow.push(currentUser); break;
            default: internalRow.push('');
          }
        });
        sheet.appendRow(internalRow);
        Logger.log('    ✅ Created internal approval: ' + internalId);
        fixed++;
      }

      // Create CLIENT approval if missing
      if (existingClient.length === 0) {
        Logger.log('  ➕ Creating client approval record');

        // Get client approver emails
        var clientApprovers = '';
        if (post.Client_Approvers) {
          clientApprovers = post.Client_Approvers;
        } else {
          var client = getClientById(post.Client_ID);
          if (client && client.Client_Approver_Emails) {
            clientApprovers = client.Client_Approver_Emails;
          }
        }

        var clientId = generateId('PA');
        var clientRow = [];
        headers.forEach(function(header) {
          switch(header) {
            case 'ID': clientRow.push(clientId); break;
            case 'Post_ID': clientRow.push(post.ID); break;
            case 'Approval_Stage': clientRow.push('Client'); break;
            case 'Approver_Email': clientRow.push(clientApprovers); break;
            case 'Approval_Status': clientRow.push('Pending'); break;
            case 'Requested_Date': clientRow.push(new Date()); break;
            case 'Created_By': clientRow.push(currentUser); break;
            default: clientRow.push('');
          }
        });
        sheet.appendRow(clientRow);
        Logger.log('    ✅ Created client approval: ' + clientId);
        fixed++;
      }
    });

    Logger.log('');
    Logger.log('=== SUMMARY ===');
    Logger.log('Fixed: ' + fixed);
    Logger.log('Skipped (already had records): ' + skipped);
    Logger.log('Total: ' + posts.length);

    return {
      success: true,
      fixed: fixed,
      skipped: skipped,
      total: posts.length
    };

  } catch (e) {
    Logger.log('ERROR: ' + e.message);
    Logger.log(e.stack);
    return {success: false, error: e.message};
  }
}

/**
 * DIAGNOSTIC FUNCTION - Test JSONP endpoint locally
 * This simulates what happens when the external HTML calls the API
 * Run this to verify JSONP code works in Apps Script environment
 */
function TEST_JSONP_ENDPOINT() {
  Logger.log('=== TESTING JSONP ENDPOINT ===');

  // Use the existing test token
  var token = 'QJeLmNN8FzTZhiwEYGvJAuwyBwQNbR';

  // Simulate the request that comes from client-portal.html
  var mockRequest = {
    parameter: {
      action: 'getClientData',
      token: token,
      callback: 'testCallback'
    }
  };

  Logger.log('Simulating request with parameters:');
  Logger.log(JSON.stringify(mockRequest.parameter));

  // Call doGet with mock request
  var response = doGet(mockRequest);

  Logger.log('');
  Logger.log('Response type: ' + typeof response);
  Logger.log('Response MIME type: ' + (response.getMimeType ? response.getMimeType() : 'N/A'));

  // Get the actual content
  var content = response.getContent();
  Logger.log('');
  Logger.log('Response content length: ' + content.length + ' characters');
  Logger.log('');
  Logger.log('First 200 characters of response:');
  Logger.log(content.substring(0, 200));
  Logger.log('');

  // Check if it looks like valid JSONP
  if (content.indexOf('testCallback(') === 0) {
    Logger.log('✅ JSONP FORMAT CORRECT - Response starts with callback function');
  } else {
    Logger.log('❌ JSONP FORMAT INCORRECT - Response does not start with callback');
  }

  // Check MIME type
  if (response.getMimeType() === ContentService.MimeType.JAVASCRIPT) {
    Logger.log('✅ MIME TYPE CORRECT - Set to JavaScript');
  } else {
    Logger.log('❌ MIME TYPE INCORRECT - Not set to JavaScript');
  }

  Logger.log('');
  Logger.log('=== TEST COMPLETE ===');

  return {
    mimeType: response.getMimeType(),
    contentLength: content.length,
    preview: content.substring(0, 200),
    isValidJSONP: content.indexOf('testCallback(') === 0
  };
}

/**
 * FIX FUNCTION - Add missing internal approval for POST-012
 * This fixes posts that were moved to Client_Review without internal approval
 * Run this once to create the missing internal approval record
 */
function FIX_POST_012_INTERNAL_APPROVAL() {
  Logger.log('=== FIXING POST-012 INTERNAL APPROVAL ===');

  try {
    var postId = 'POST-012';

    // Check if internal approval already exists
    var existingInternal = _readSheetAsObjects_('Post_Approvals', {
      filterFn: function(a) {
        return a.Post_ID === postId && (a.Approval_Stage === 'Internal_Review' || a.Approval_Stage === 'Internal');
      }
    });

    if (existingInternal && existingInternal.length > 0) {
      Logger.log('⚠️  Internal approval already exists for POST-012, skipping');
      return {success: false, error: 'Internal approval already exists'};
    }

    // Get the post to find who created it
    var posts = _readSheetAsObjects_('Posts', {
      filterFn: function(p) { return p.ID === postId; }
    });

    if (posts.length === 0) {
      Logger.log('❌ Post not found: ' + postId);
      return {success: false, error: 'Post not found'};
    }

    var post = posts[0];
    Logger.log('Post found: ' + post.Post_Title);

    // Create internal approval record (pre-approved)
    var sheet = _getSheet_('Post_Approvals');
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var approvalId = generateId('PA');

    var currentUser = Session.getActiveUser().getEmail();

    var rowData = [];
    headers.forEach(function(header) {
      switch(header) {
        case 'ID':
          rowData.push(approvalId);
          break;
        case 'Post_ID':
          rowData.push(postId);
          break;
        case 'Approval_Stage':
          rowData.push('Internal_Review');
          break;
        case 'Approver_Email':
          rowData.push(currentUser);
          break;
        case 'Approval_Status':
          rowData.push('Approved');
          break;
        case 'Requested_Date':
          rowData.push(new Date());
          break;
        case 'Decision_Date':
          rowData.push(new Date());
          break;
        case 'Notes':
          rowData.push('Auto-approved to fix missing internal approval');
          break;
        case 'Created_By':
          rowData.push(currentUser);
          break;
        default:
          rowData.push('');
      }
    });

    sheet.appendRow(rowData);
    Logger.log('✅ Created internal approval record: ' + approvalId);

    // Now trigger status update check
    Logger.log('Checking if post status should update...');
    checkAndUpdatePostApprovalStatus(postId);

    Logger.log('✅ Fix complete! Check Posts sheet for updated status.');

    return {success: true, approvalId: approvalId};

  } catch (e) {
    Logger.log('❌ ERROR: ' + e.message);
    Logger.log(e.stack);
    return {success: false, error: e.message};
  }
}

/**
 * DIAGNOSTIC FUNCTION - Audit all client access tokens
 * Shows all tokens in Authorized_Clients sheet with their status
 * Use this to troubleshoot token issues before they affect real clients
 */
function AUDIT_CLIENT_TOKENS() {
  Logger.log('=== AUDITING CLIENT ACCESS TOKENS ===');
  Logger.log('');

  try {
    var sheet = _getSheet_('Authorized_Clients');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    Logger.log('Total records in Authorized_Clients sheet: ' + (data.length - 1));
    Logger.log('');
    Logger.log('Column headers: ' + headers.join(', '));
    Logger.log('');
    Logger.log('='.repeat(100));

    // Find column indices
    var idIndex = headers.indexOf('ID');
    var clientIdIndex = headers.indexOf('Client_ID');
    var emailIndex = headers.indexOf('Email');
    var tokenIndex = headers.indexOf('Access_Token');
    var statusIndex = headers.indexOf('Status');
    var createdDateIndex = headers.indexOf('Created_Date');
    var lastLoginIndex = headers.indexOf('Last_Login');
    var expiresIndex = headers.indexOf('Token_Expires');

    if (data.length === 1) {
      Logger.log('⚠️  NO TOKENS FOUND - Sheet is empty (only headers)');
      return {success: false, error: 'No tokens found'};
    }

    var activeCount = 0;
    var inactiveCount = 0;
    var expiredCount = 0;

    // Loop through all records
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var id = row[idIndex];
      var clientId = row[clientIdIndex];
      var email = row[emailIndex];
      var token = row[tokenIndex];
      var status = row[statusIndex];
      var createdDate = row[createdDateIndex];
      var lastLogin = row[lastLoginIndex];
      var expires = row[expiresIndex];

      Logger.log('Record #' + i);
      Logger.log('  ID: ' + id);
      Logger.log('  Client: ' + clientId);
      Logger.log('  Email: ' + email);
      Logger.log('  Token: ' + token);
      Logger.log('  Status: ' + status);
      Logger.log('  Created: ' + createdDate);
      Logger.log('  Last Login: ' + (lastLogin || 'Never'));
      Logger.log('  Expires: ' + (expires || 'No expiration'));

      // Check if expired
      var isExpired = false;
      if (expires) {
        var expiryDate = new Date(expires);
        if (expiryDate < new Date()) {
          isExpired = true;
          expiredCount++;
          Logger.log('  ⚠️  EXPIRED on ' + expiryDate);
        }
      }

      // Count by status
      if (status === 'Active') {
        if (!isExpired) {
          activeCount++;
          Logger.log('  ✅ VALID - Active and not expired');
        }
      } else {
        inactiveCount++;
        Logger.log('  ❌ INACTIVE - Status is not Active');
      }

      Logger.log('-'.repeat(100));
    }

    Logger.log('');
    Logger.log('=== SUMMARY ===');
    Logger.log('Total tokens: ' + (data.length - 1));
    Logger.log('✅ Active & Valid: ' + activeCount);
    Logger.log('❌ Inactive: ' + inactiveCount);
    Logger.log('⚠️  Expired: ' + expiredCount);
    Logger.log('');

    // Test the specific tokens we've been using
    Logger.log('=== TESTING SPECIFIC TOKENS ===');
    var testTokens = [
      'QJeLmNN8FzTZhiwEYGvJAuwyBwQNbR',  // Old token
      'dy3a4nNN8FsTZH1uEfVGJJauyjWoXMbR'  // New token
    ];

    testTokens.forEach(function(testToken) {
      Logger.log('');
      Logger.log('Testing token: ' + testToken);
      var found = false;

      for (var j = 1; j < data.length; j++) {
        if (data[j][tokenIndex] === testToken) {
          found = true;
          Logger.log('  ✅ FOUND in sheet');
          Logger.log('  Status: ' + data[j][statusIndex]);
          Logger.log('  Client: ' + data[j][clientIdIndex]);
          Logger.log('  Email: ' + data[j][emailIndex]);
          break;
        }
      }

      if (!found) {
        Logger.log('  ❌ NOT FOUND in Authorized_Clients sheet');
      }
    });

    Logger.log('');
    Logger.log('=== AUDIT COMPLETE ===');

    return {
      success: true,
      totalTokens: data.length - 1,
      active: activeCount,
      inactive: inactiveCount,
      expired: expiredCount
    };

  } catch (e) {
    Logger.log('❌ ERROR: ' + e.message);
    Logger.log(e.stack);
    return {success: false, error: e.message};
  }
}