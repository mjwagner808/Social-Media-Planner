/**
 * Diagnostic script to check Status column existence in related sheets
 * RUN THIS FIRST to understand the current schema
 */

function diagnoseStatusColumns() {
  Logger.log('========================================');
  Logger.log('STATUS COLUMN DIAGNOSTIC');
  Logger.log('========================================\n');

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Check Post_Platforms sheet
  Logger.log('--- POST_PLATFORMS SHEET ---');
  var platformsSheet = ss.getSheetByName('Post_Platforms');
  if (platformsSheet) {
    var platformsHeaders = platformsSheet.getRange(1, 1, 1, platformsSheet.getLastColumn()).getValues()[0];
    Logger.log('Current columns: ' + platformsHeaders.join(', '));
    Logger.log('Has "Status" column? ' + (platformsHeaders.indexOf('Status') >= 0 ? 'YES' : 'NO'));
    Logger.log('Total columns: ' + platformsHeaders.length);
  } else {
    Logger.log('⚠️ Sheet not found!');
  }

  Logger.log('');

  // Check Post_Approvals sheet
  Logger.log('--- POST_APPROVALS SHEET ---');
  var approvalsSheet = ss.getSheetByName('Post_Approvals');
  if (approvalsSheet) {
    var approvalsHeaders = approvalsSheet.getRange(1, 1, 1, approvalsSheet.getLastColumn()).getValues()[0];
    Logger.log('Current columns: ' + approvalsHeaders.join(', '));
    Logger.log('Has "Post_Status" column? ' + (approvalsHeaders.indexOf('Post_Status') >= 0 ? 'YES' : 'NO'));
    Logger.log('Has "Status" column? ' + (approvalsHeaders.indexOf('Status') >= 0 ? 'YES' : 'NO'));
    Logger.log('Total columns: ' + approvalsHeaders.length);
  } else {
    Logger.log('⚠️ Sheet not found!');
  }

  Logger.log('');
  Logger.log('========================================');
  Logger.log('RECOMMENDATION:');
  Logger.log('If columns are missing, add them manually or use addStatusColumns() function');
  Logger.log('========================================');
}

/**
 * Add Status columns to Post_Platforms and Post_Approvals sheets if missing
 * WARNING: Run diagnoseStatusColumns() first to see current state
 */
function addStatusColumns() {
  Logger.log('========================================');
  Logger.log('ADDING STATUS COLUMNS');
  Logger.log('========================================\n');

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var changes = [];

  // Add Status column to Post_Platforms
  Logger.log('--- POST_PLATFORMS SHEET ---');
  var platformsSheet = ss.getSheetByName('Post_Platforms');
  if (platformsSheet) {
    var platformsHeaders = platformsSheet.getRange(1, 1, 1, platformsSheet.getLastColumn()).getValues()[0];

    if (platformsHeaders.indexOf('Status') === -1) {
      // Add Status column
      var newCol = platformsSheet.getLastColumn() + 1;
      platformsSheet.getRange(1, newCol).setValue('Status');
      Logger.log('✅ Added "Status" column at position ' + newCol);
      changes.push('Post_Platforms: Added Status column');

      // Populate with Draft for existing rows
      var lastRow = platformsSheet.getLastRow();
      if (lastRow > 1) {
        var defaultValues = [];
        for (var i = 2; i <= lastRow; i++) {
          defaultValues.push(['Draft']);
        }
        platformsSheet.getRange(2, newCol, lastRow - 1, 1).setValues(defaultValues);
        Logger.log('✅ Set default "Draft" status for ' + (lastRow - 1) + ' existing rows');
      }
    } else {
      Logger.log('ℹ️  "Status" column already exists');
    }
  } else {
    Logger.log('⚠️ Sheet not found!');
  }

  Logger.log('');

  // Add Post_Status column to Post_Approvals
  Logger.log('--- POST_APPROVALS SHEET ---');
  var approvalsSheet = ss.getSheetByName('Post_Approvals');
  if (approvalsSheet) {
    var approvalsHeaders = approvalsSheet.getRange(1, 1, 1, approvalsSheet.getLastColumn()).getValues()[0];

    if (approvalsHeaders.indexOf('Post_Status') === -1) {
      // Add Post_Status column
      var newCol = approvalsSheet.getLastColumn() + 1;
      approvalsSheet.getRange(1, newCol).setValue('Post_Status');
      Logger.log('✅ Added "Post_Status" column at position ' + newCol);
      changes.push('Post_Approvals: Added Post_Status column');

      // Populate with status from Posts sheet for existing rows
      var lastRow = approvalsSheet.getLastRow();
      if (lastRow > 1) {
        Logger.log('ℹ️  Populating Post_Status for ' + (lastRow - 1) + ' existing approval records...');
        var postIdColIndex = approvalsHeaders.indexOf('Post_ID');
        var data = approvalsSheet.getRange(2, 1, lastRow - 1, approvalsSheet.getLastColumn()).getValues();

        // Get all posts
        var postsSheet = ss.getSheetByName('Posts');
        var postsData = postsSheet.getDataRange().getValues();
        var postsHeaders = postsData[0];
        var postIdIndex = postsHeaders.indexOf('ID');
        var statusIndex = postsHeaders.indexOf('Status');

        // Build a map of Post_ID -> Status
        var postStatusMap = {};
        for (var i = 1; i < postsData.length; i++) {
          postStatusMap[postsData[i][postIdIndex]] = postsData[i][statusIndex];
        }

        // Update each approval row
        var updates = [];
        for (var i = 0; i < data.length; i++) {
          var postId = data[i][postIdColIndex];
          var postStatus = postStatusMap[postId] || 'Draft';
          updates.push([postStatus]);
        }

        approvalsSheet.getRange(2, newCol, updates.length, 1).setValues(updates);
        Logger.log('✅ Populated Post_Status for existing rows');
      }
    } else {
      Logger.log('ℹ️  "Post_Status" column already exists');
    }
  } else {
    Logger.log('⚠️ Sheet not found!');
  }

  Logger.log('');
  Logger.log('========================================');
  Logger.log('SUMMARY');
  Logger.log('========================================');
  if (changes.length > 0) {
    Logger.log('✅ Changes made:');
    changes.forEach(function(change) {
      Logger.log('  - ' + change);
    });
  } else {
    Logger.log('ℹ️  No changes needed - all columns exist');
  }
  Logger.log('========================================');

  return {success: true, changes: changes};
}

/**
 * Test the updatePostStatus function after adding columns
 */
function testStatusSync() {
  Logger.log('========================================');
  Logger.log('TESTING STATUS SYNCHRONIZATION');
  Logger.log('========================================\n');

  // Find a test post
  var posts = _readSheetAsObjects_('Posts');
  if (posts.length === 0) {
    Logger.log('❌ No posts found to test with');
    return;
  }

  var testPost = posts[0];
  Logger.log('Using test post: ' + testPost.ID + ' (' + testPost.Post_Title + ')');
  Logger.log('Current status: ' + testPost.Status);
  Logger.log('');

  // Try updating to a different status
  var newStatus = testPost.Status === 'Draft' ? 'Internal_Review' : 'Draft';
  Logger.log('Updating status to: ' + newStatus);

  var result = updatePostStatus(testPost.ID, newStatus);

  if (result.success) {
    Logger.log('');
    Logger.log('✅ Update succeeded!');
    Logger.log('Posts updated: ' + result.sheetsUpdated.posts);
    Logger.log('Platforms updated: ' + result.sheetsUpdated.platforms);
    Logger.log('Approvals updated: ' + result.sheetsUpdated.approvals);
  } else {
    Logger.log('❌ Update failed: ' + result.error);
  }

  Logger.log('');
  Logger.log('========================================');
}
