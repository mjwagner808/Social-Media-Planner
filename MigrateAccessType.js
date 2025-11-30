/**
 * Migration Script: Add Access_Type Column to Authorized_Clients Sheet
 *
 * This script:
 * 1. Adds Access_Type column if it doesn't exist
 * 2. Migrates existing data:
 *    - If Post_IDs is empty → Access_Type = "Full"
 *    - If Post_IDs has values → Access_Type = "Restricted"
 *
 * RUN THIS ONCE after deploying the Post_IDs bug fix
 */

function migrateAccessType() {
  try {
    Logger.log('========== STARTING ACCESS_TYPE MIGRATION ==========');

    const SPREADSHEET_ID = '1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Authorized_Clients');

    if (!sheet) {
      Logger.log('❌ ERROR: Authorized_Clients sheet not found');
      return;
    }

    // Get headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('Current headers: ' + headers.join(', '));

    // Check if Access_Type column already exists
    const accessTypeIndex = headers.indexOf('Access_Type');

    if (accessTypeIndex === -1) {
      // Column doesn't exist - add it after Post_IDs
      const postIdsIndex = headers.indexOf('Post_IDs');

      if (postIdsIndex === -1) {
        Logger.log('❌ ERROR: Post_IDs column not found');
        return;
      }

      // Insert new column after Post_IDs
      const newColumnIndex = postIdsIndex + 2; // +1 for 1-based index, +1 for after
      sheet.insertColumnAfter(postIdsIndex + 1);
      sheet.getRange(1, newColumnIndex).setValue('Access_Type');

      Logger.log('✅ Added Access_Type column at position ' + newColumnIndex);
    } else {
      Logger.log('ℹ️ Access_Type column already exists at position ' + (accessTypeIndex + 1));
    }

    // Refresh headers after potential insertion
    const updatedHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const updatedAccessTypeIndex = updatedHeaders.indexOf('Access_Type');
    const updatedPostIdsIndex = updatedHeaders.indexOf('Post_IDs');

    // Get all data
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();

    Logger.log('Total rows: ' + (data.length - 1)); // Exclude header

    // Migrate existing records
    let migratedCount = 0;
    let fullAccessCount = 0;
    let restrictedAccessCount = 0;

    for (let i = 1; i < data.length; i++) {
      const postIds = data[i][updatedPostIdsIndex];
      const currentAccessType = data[i][updatedAccessTypeIndex];

      // Only update if Access_Type is empty
      if (!currentAccessType || currentAccessType === '') {
        let newAccessType;

        if (!postIds || postIds === '') {
          // Empty Post_IDs = Full access
          newAccessType = 'Full';
          fullAccessCount++;
        } else {
          // Has Post_IDs = Restricted access
          newAccessType = 'Restricted';
          restrictedAccessCount++;
        }

        sheet.getRange(i + 1, updatedAccessTypeIndex + 1).setValue(newAccessType);
        migratedCount++;

        Logger.log('Row ' + (i + 1) + ': Post_IDs="' + postIds + '" → Access_Type="' + newAccessType + '"');
      }
    }

    Logger.log('========== MIGRATION COMPLETE ==========');
    Logger.log('✅ Migrated ' + migratedCount + ' records');
    Logger.log('   - Full Access: ' + fullAccessCount);
    Logger.log('   - Restricted Access: ' + restrictedAccessCount);
    Logger.log('==========================================');

    return {
      success: true,
      migratedCount: migratedCount,
      fullAccessCount: fullAccessCount,
      restrictedAccessCount: restrictedAccessCount
    };

  } catch (e) {
    Logger.log('❌ ERROR during migration: ' + e.message);
    Logger.log('Stack trace: ' + e.stack);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Test function to verify migration worked correctly
 */
function testAccessTypeMigration() {
  try {
    const SPREADSHEET_ID = '1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Authorized_Clients');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const accessTypeIndex = headers.indexOf('Access_Type');
    const postIdsIndex = headers.indexOf('Post_IDs');
    const emailIndex = headers.indexOf('Email');

    Logger.log('========== VERIFICATION TEST ==========');
    Logger.log('Checking all records have Access_Type...\n');

    let missingCount = 0;
    let fullCount = 0;
    let restrictedCount = 0;

    for (let i = 1; i < data.length; i++) {
      const email = data[i][emailIndex];
      const postIds = data[i][postIdsIndex];
      const accessType = data[i][accessTypeIndex];

      if (!accessType || accessType === '') {
        Logger.log('❌ Row ' + (i + 1) + ' (' + email + '): Missing Access_Type');
        missingCount++;
      } else {
        if (accessType === 'Full') fullCount++;
        if (accessType === 'Restricted') restrictedCount++;

        // Verify logic is correct
        if (accessType === 'Full' && postIds && postIds !== '') {
          Logger.log('⚠️ Row ' + (i + 1) + ' (' + email + '): Has Full access but also has Post_IDs = "' + postIds + '"');
        }
        if (accessType === 'Restricted' && (!postIds || postIds === '')) {
          Logger.log('⚠️ Row ' + (i + 1) + ' (' + email + '): Has Restricted access but Post_IDs is empty');
        }
      }
    }

    Logger.log('\n========== RESULTS ==========');
    Logger.log('Total records: ' + (data.length - 1));
    Logger.log('Full Access: ' + fullCount);
    Logger.log('Restricted Access: ' + restrictedCount);
    Logger.log('Missing Access_Type: ' + missingCount);

    if (missingCount === 0) {
      Logger.log('✅ ALL RECORDS HAVE ACCESS_TYPE');
    } else {
      Logger.log('❌ SOME RECORDS MISSING ACCESS_TYPE - RUN MIGRATION AGAIN');
    }

    Logger.log('================================');

  } catch (e) {
    Logger.log('❌ ERROR during test: ' + e.message);
  }
}
