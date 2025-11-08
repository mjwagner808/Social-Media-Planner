/**
 * ADMIN FUNCTION: Remove all data validation from Post_Approvals sheet
 * Run this once to clear any hidden validation rules
 */
function REMOVE_POST_APPROVALS_VALIDATION() {
  try {
    Logger.log('=== REMOVING POST_APPROVALS VALIDATION ===');

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Post_Approvals');

    if (!sheet) {
      Logger.log('❌ Post_Approvals sheet not found');
      return {success: false, error: 'Sheet not found'};
    }

    // Get the data range
    var dataRange = sheet.getDataRange();

    // Clear all validation rules
    dataRange.clearDataValidations();

    Logger.log('✅ All validation rules removed from Post_Approvals sheet');
    Logger.log('Range cleared: ' + dataRange.getA1Notation());

    return {success: true, message: 'Validation cleared'};

  } catch (e) {
    Logger.log('❌ Error: ' + e.message);
    Logger.log(e.stack);
    return {success: false, error: e.message};
  }
}

/**
 * ADMIN FUNCTION: Check what validation rules exist on Post_Approvals
 */
function CHECK_POST_APPROVALS_VALIDATION() {
  try {
    Logger.log('=== CHECKING POST_APPROVALS VALIDATION ===');

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Post_Approvals');

    if (!sheet) {
      Logger.log('❌ Post_Approvals sheet not found');
      return;
    }

    var dataRange = sheet.getDataRange();
    var validations = dataRange.getDataValidations();

    Logger.log('Checking range: ' + dataRange.getA1Notation());
    Logger.log('Rows: ' + validations.length);

    var foundValidation = false;

    for (var i = 0; i < validations.length; i++) {
      for (var j = 0; j < validations[i].length; j++) {
        if (validations[i][j] != null) {
          foundValidation = true;
          var cellAddress = sheet.getRange(i + 1, j + 1).getA1Notation();
          var rule = validations[i][j];
          var criteria = rule.getCriteriaType();
          var values = rule.getCriteriaValues();

          Logger.log('---');
          Logger.log('Cell: ' + cellAddress);
          Logger.log('Criteria Type: ' + criteria);
          Logger.log('Criteria Values: ' + JSON.stringify(values));
          Logger.log('Allow Invalid: ' + rule.getAllowInvalid());
        }
      }
    }

    if (!foundValidation) {
      Logger.log('No validation rules found');
    }

  } catch (e) {
    Logger.log('❌ Error: ' + e.message);
    Logger.log(e.stack);
  }
}
