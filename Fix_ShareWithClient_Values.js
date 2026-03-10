/**
 * One-time migration script to fix Share_With_Client values
 * Converts string 'TRUE'/'FALSE' to boolean true/false
 * Run this once after deploying the fix
 */
function fixShareWithClientValues() {
  var SPREADSHEET_ID = '1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss';
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Post_Versions');

  if (!sheet) {
    Logger.log('ERROR: Post_Versions sheet not found');
    return;
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Find Share_With_Client column
  var shareWithClientCol = headers.indexOf('Share_With_Client');

  if (shareWithClientCol === -1) {
    Logger.log('ERROR: Share_With_Client column not found');
    return;
  }

  Logger.log('=== FIXING SHARE_WITH_CLIENT VALUES ===');
  Logger.log('Found Share_With_Client at column index: ' + shareWithClientCol);

  var updatedCount = 0;

  // Start from row 2 (skip header)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var currentValue = row[shareWithClientCol];

    // Skip empty rows
    if (!row[0]) continue;

    var newValue = null;

    // Convert string 'TRUE'/'FALSE' to boolean
    if (currentValue === 'TRUE' || currentValue === true) {
      newValue = true;
    } else if (currentValue === 'FALSE' || currentValue === false || currentValue === '' || !currentValue) {
      newValue = false;
    }

    if (newValue !== null) {
      sheet.getRange(i + 1, shareWithClientCol + 1).setValue(newValue);
      updatedCount++;
      Logger.log('Row ' + (i + 1) + ': Updated "' + currentValue + '" to ' + newValue);
    }
  }

  Logger.log('\n=== MIGRATION COMPLETE ===');
  Logger.log('Updated ' + updatedCount + ' rows');
}
