/**
 * Debug script to check Share_With_Client values in Post_Versions sheet
 * Run this from Apps Script editor to see actual values
 */
function debugShareWithClientValues() {
  var SPREADSHEET_ID = '1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss';
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Post_Versions');

  if (!sheet) {
    Logger.log('ERROR: Post_Versions sheet not found');
    return;
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  Logger.log('=== POST_VERSIONS DEBUG ===');
  Logger.log('Headers: ' + headers.join(' | '));

  // Find column indices
  var idCol = headers.indexOf('ID');
  var postIdCol = headers.indexOf('Post_ID');
  var changeTypeCol = headers.indexOf('Change_Type');
  var shareWithClientCol = headers.indexOf('Share_With_Client');

  Logger.log('\nColumn indices:');
  Logger.log('  ID: ' + idCol);
  Logger.log('  Post_ID: ' + postIdCol);
  Logger.log('  Change_Type: ' + changeTypeCol);
  Logger.log('  Share_With_Client: ' + shareWithClientCol);

  if (shareWithClientCol === -1) {
    Logger.log('\n❌ Share_With_Client column NOT FOUND in sheet');
    return;
  }

  Logger.log('\n=== ALL ROWS ===');
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = row[idCol];
    var postId = row[postIdCol];
    var changeType = row[changeTypeCol];
    var shareWithClient = row[shareWithClientCol];

    // Skip empty rows
    if (!id) continue;

    Logger.log('\nRow ' + (i + 1) + ':');
    Logger.log('  ID: ' + id);
    Logger.log('  Post_ID: ' + postId);
    Logger.log('  Change_Type: ' + changeType + ' (type: ' + typeof changeType + ')');
    Logger.log('  Share_With_Client: "' + shareWithClient + '" (type: ' + typeof shareWithClient + ')');
    Logger.log('  shareWithClient === "TRUE": ' + (shareWithClient === 'TRUE'));
    Logger.log('  shareWithClient === true: ' + (shareWithClient === true));
    Logger.log('  shareWithClient === "FALSE": ' + (shareWithClient === 'FALSE'));
    Logger.log('  shareWithClient === false: ' + (shareWithClient === false));
  }
}
