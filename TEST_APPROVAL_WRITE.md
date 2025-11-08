# Test: Manually Create Approval Record

Based on the diagnostic, the Post_Approvals sheet has the correct structure (10 columns).

## Next Step: Test Writing Data Directly

Let's test if we can write to the Post_Approvals sheet directly to see if the error occurs.

Run this test function in Apps Script:

```javascript
function TEST_WRITE_TO_POST_APPROVALS() {
  try {
    Logger.log('=== TESTING WRITE TO POST_APPROVALS ===');

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Post_Approvals');

    var testData = [
      'TEST-001',           // ID
      'POST-021',           // Post_ID
      'Client',             // Approval_Stage
      'test@example.com',   // Approver_Email
      'Test User',          // Approver_Name
      'Pending',            // Approval_Status
      '',                   // Decision_Date (empty)
      '',                   // Decision_Notes (empty)
      new Date(),           // Email_Sent_Date
      new Date()            // Created_Date
    ];

    Logger.log('Attempting to append row with ' + testData.length + ' values');
    Logger.log('Data: ' + JSON.stringify(testData));

    sheet.appendRow(testData);

    Logger.log('✅ SUCCESS - Row appended');

    // Now try to delete the test row
    var lastRow = sheet.getLastRow();
    sheet.deleteRow(lastRow);
    Logger.log('✅ Test row deleted');

    return {success: true};

  } catch (e) {
    Logger.log('❌ ERROR: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    return {success: false, error: e.message, stack: e.stack};
  }
}
```

This will tell us if the issue is with writing data to the Post_Approvals sheet or something else.
