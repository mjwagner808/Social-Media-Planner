/**
 * DIAGNOSTIC: Check ALL columns in Post_Approvals including empty ones
 */
function CHECK_ALL_POST_APPROVALS_COLUMNS() {
  try {
    Logger.log('=== CHECKING ALL COLUMNS IN POST_APPROVALS ===');

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Post_Approvals');

    if (!sheet) {
      Logger.log('❌ Post_Approvals sheet not found');
      return {success: false, error: 'Sheet not found'};
    }

    var maxColumns = sheet.getMaxColumns();
    Logger.log('Sheet has ' + maxColumns + ' total columns');
    Logger.log('');

    // Get first row (headers)
    var headerRow = sheet.getRange(1, 1, 1, maxColumns).getValues()[0];

    Logger.log('ALL COLUMNS (including empty):');
    for (var i = 0; i < headerRow.length; i++) {
      var colLetter = getColumnLetter(i);
      var headerValue = headerRow[i];
      var display = headerValue === '' ? '(EMPTY)' : headerValue;
      Logger.log('  Column ' + colLetter + ' (' + (i+1) + '): ' + display);
    }

    // Now check validation on ALL columns including empty ones
    Logger.log('');
    Logger.log('Checking validation on row 40 (where error occurred):');
    var row40 = sheet.getRange(40, 1, 1, maxColumns);
    var validations = row40.getDataValidations()[0];

    for (var i = 0; i < validations.length; i++) {
      if (validations[i] != null) {
        var colLetter = getColumnLetter(i);
        Logger.log('  ⚠️ VALIDATION on column ' + colLetter + ' (' + headerRow[i] + ')');
        try {
          var rule = validations[i];
          var criteria = rule.getCriteriaType();
          var values = rule.getCriteriaValues();
          Logger.log('     Type: ' + criteria);
          Logger.log('     Values: ' + JSON.stringify(values));
        } catch (e) {
          Logger.log('     Cannot read details: ' + e.message);
        }
      }
    }

    return {success: true};

  } catch (e) {
    Logger.log('❌ Error: ' + e.message);
    Logger.log(e.stack);
    return {success: false, error: e.message};
  }
}

/**
 * Helper: Convert column index to letter (0=A, 1=B, etc.)
 */
function getColumnLetter(index) {
  var letter = '';
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}
