/**
 * Test Helper Functions
 * Run these from Apps Script editor to test the client portal
 */

/**
 * Generate a test token for Aloha_Aina@icloud.com
 * Run this function in Apps Script, then check the Execution log for the token and URL
 */
function generateTestToken() {
  Logger.log('=== Generating Test Token ===');

  // Use your first client (adjust Client_ID if needed)
  var result = grantClientAccess('CLT-001', 'Aloha_Aina@icloud.com', 'Full');

  if (result.success) {
    Logger.log('Token generated successfully!');
    Logger.log('');
    Logger.log('Token: ' + result.token);
    Logger.log('');
    Logger.log('GitHub Pages URL:');
    Logger.log('https://mjwagner808.github.io/Social-Media-Planner/client-portal.html?token=' + result.token);
    Logger.log('');
    Logger.log('Apps Script URL (old):');
    Logger.log(result.url);
    Logger.log('');
    Logger.log('Copy the GitHub Pages URL above and test in an incognito window!');
  } else {
    Logger.log('Error: ' + result.error);
  }

  return result;
}

/**
 * Test the API endpoint directly
 * This simulates what the HTML page does
 */
function testApiEndpoint() {
  Logger.log('=== Testing API Endpoint ===');

  // Get the most recent token from Authorized_Clients sheet
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Authorized_Clients');
  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    Logger.log('❌ No authorized clients found. Run generateTestToken() first.');
    return;
  }

  // Get last row (most recent token)
  var lastRow = data[data.length - 1];
  var headers = data[0];
  var tokenIndex = headers.indexOf('Access_Token');
  var emailIndex = headers.indexOf('Email');

  var token = lastRow[tokenIndex];
  var email = lastRow[emailIndex];

  Logger.log('Testing with token for: ' + email);
  Logger.log('Token: ' + token);
  Logger.log('');

  // Test the validation function
  var result = validateClientAccess(token);

  if (result.success) {
    Logger.log('✅ API endpoint working!');
    Logger.log('Client: ' + result.clientInfo.Client_Name);
    Logger.log('Posts returned: ' + result.posts.length);
    Logger.log('');
    Logger.log('Sample post:');
    if (result.posts.length > 0) {
      var post = result.posts[0];
      Logger.log('  Title: ' + post.Post_Title);
      Logger.log('  Status: ' + post.Status);
      Logger.log('  Date: ' + post.Scheduled_Date);
    }
  } else {
    Logger.log('❌ Error: ' + result.error);
  }

  return result;
}

/**
 * List all authorized clients
 */
function listAuthorizedClients() {
  Logger.log('=== Authorized Clients ===');

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Authorized_Clients');
  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    Logger.log('No authorized clients found.');
    return;
  }

  var headers = data[0];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });

    Logger.log('');
    Logger.log('Client #' + i);
    Logger.log('  Email: ' + obj.Email);
    Logger.log('  Client ID: ' + obj.Client_ID);
    Logger.log('  Status: ' + obj.Status);
    Logger.log('  Token: ' + obj.Access_Token);
    Logger.log('  Created: ' + obj.Created_Date);
  }
}

/**
 * Revoke a token by email
 */
function revokeTokenByEmail(email) {
  Logger.log('=== Revoking Token ===');
  Logger.log('Email: ' + email);

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Authorized_Clients');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var emailIndex = headers.indexOf('Email');
  var statusIndex = headers.indexOf('Status');
  var idIndex = headers.indexOf('ID');

  var found = false;

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailIndex] === email) {
      var id = data[i][idIndex];
      var result = revokeClientAccess(id);

      if (result.success) {
        Logger.log('✅ Token revoked for: ' + email);
        found = true;
      } else {
        Logger.log('❌ Error: ' + result.error);
      }
    }
  }

  if (!found) {
    Logger.log('❌ No tokens found for email: ' + email);
  }
}
