/**
 * DIAGNOSTIC: Check Post_Approvals sheet structure
 */
function DIAGNOSE_POST_APPROVALS_STRUCTURE() {
  try {
    Logger.log('=== DIAGNOSING POST_APPROVALS STRUCTURE ===');

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Post_Approvals');

    if (!sheet) {
      Logger.log('❌ Post_Approvals sheet not found');
      return {success: false, error: 'Sheet not found'};
    }

    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    Logger.log('Total columns: ' + headers.length);
    Logger.log('Headers:');
    for (var i = 0; i < headers.length; i++) {
      var colLetter = String.fromCharCode(65 + i); // A=65
      Logger.log('  Column ' + colLetter + ' (' + (i+1) + '): ' + headers[i]);
    }

    // Check for validation on each column
    Logger.log('');
    Logger.log('Checking for validation rules...');
    var dataRange = sheet.getRange(1, 1, sheet.getMaxRows(), headers.length);
    var validations = dataRange.getDataValidations();

    var foundValidation = false;
    for (var row = 0; row < Math.min(50, validations.length); row++) {
      for (var col = 0; col < validations[row].length; col++) {
        if (validations[row][col] != null) {
          foundValidation = true;
          var colLetter = String.fromCharCode(65 + col);
          var cellRef = colLetter + (row + 1);
          Logger.log('  Validation found at: ' + cellRef);

          var rule = validations[row][col];
          try {
            var criteria = rule.getCriteriaType();
            var values = rule.getCriteriaValues();
            Logger.log('    Type: ' + criteria);
            Logger.log('    Values: ' + JSON.stringify(values));
          } catch (e) {
            Logger.log('    Cannot read validation details');
          }
        }
      }
    }

    if (!foundValidation) {
      Logger.log('  No validation rules found');
    }

    return {
      success: true,
      columnCount: headers.length,
      headers: headers
    };

  } catch (e) {
    Logger.log('❌ Error: ' + e.message);
    Logger.log(e.stack);
    return {success: false, error: e.message};
  }
}
