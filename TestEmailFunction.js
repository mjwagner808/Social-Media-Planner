/**
 * TEST EMAIL FUNCTION - Run this from Apps Script editor to test email sending
 * This will send a test email to the specified address and log all details
 *
 * INSTRUCTIONS:
 * 1. In Apps Script editor, select "TEST_SEND_EMAIL" from function dropdown
 * 2. Click Run button
 * 3. Check execution log for detailed results
 */
function TEST_SEND_EMAIL() {
  Logger.log('=== TESTING EMAIL SYSTEM ===');

  // Test recipient - CHANGE THIS TO YOUR TEST EMAIL
  var testRecipient = 'mj.opala@gmail.com';

  Logger.log('Test recipient: ' + testRecipient);
  Logger.log('Current user: ' + Session.getActiveUser().getEmail());

  // Check email quota
  var quota = MailApp.getRemainingDailyQuota();
  Logger.log('Remaining daily email quota: ' + quota);

  if (quota === 0) {
    Logger.log('❌ ERROR: No email quota remaining!');
    return {success: false, error: 'No email quota remaining'};
  }

  // Try sending test email
  try {
    Logger.log('Attempting to send test email...');

    var subject = 'Test Email from Social Media Planner';
    var body = 'This is a test email sent at ' + new Date().toISOString() + '\n\n' +
               'If you received this, the email system is working correctly!';

    var result = sendEmail(testRecipient, subject, body);

    Logger.log('Send result: ' + JSON.stringify(result));

    if (result.success) {
      Logger.log('✅ SUCCESS: Test email sent to ' + testRecipient);
    } else {
      Logger.log('❌ FAILED: ' + result.error);
    }

    return result;

  } catch (e) {
    Logger.log('❌ EXCEPTION: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    return {success: false, error: e.message, stack: e.stack};
  }
}
