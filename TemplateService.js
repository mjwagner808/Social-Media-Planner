/****************************************************
 * TemplateService.js - Post Template Management
 * Handles saving, loading, and managing post templates
 ****************************************************/

/**
 * Save a post as a template
 * @param {string} postId - Post ID to save as template
 * @param {string} templateName - Name for the template
 * @returns {Object} Success/failure result
 */
function savePostAsTemplate(postId, templateName) {
  try {
    Logger.log('Saving post as template: ' + postId);
    Logger.log('Template name: ' + templateName);

    // Validate inputs
    if (!postId || !templateName) {
      return {success: false, error: 'Post ID and template name are required'};
    }

    // Get the post
    var post = getPostById(postId);
    if (!post || !post.success) {
      return {success: false, error: 'Post not found'};
    }

    var postData = post.post;
    var currentUser = Session.getActiveUser().getEmail();
    var timestamp = new Date();

    // Get or create Post_Templates sheet
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Templates');
    if (!sheet) {
      Logger.log('Creating Post_Templates sheet...');
      sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet('Post_Templates');
      sheet.appendRow([
        'ID',
        'Template_Name',
        'Post_Title',
        'Post_Copy',
        'Platforms',
        'Content_Category',
        'Strategy_Goals',
        'Hashtags',
        'Link_URL',
        'Internal_Notes',
        'Created_By',
        'Created_Date',
        'Status'
      ]);
      Logger.log('Post_Templates sheet created');
    }

    // Generate template ID
    var templateId = generateId('TPL');

    // Get platform data for this post
    var platforms = [];
    var platformSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Platforms');
    if (platformSheet) {
      var platformData = platformSheet.getDataRange().getValues();
      var headers = platformData[0];
      var postIdIndex = headers.indexOf('Post_ID');
      var platformIndex = headers.indexOf('Platform');

      for (var i = 1; i < platformData.length; i++) {
        if (platformData[i][postIdIndex] === postId) {
          platforms.push(platformData[i][platformIndex]);
        }
      }
    }

    // Append template row
    sheet.appendRow([
      templateId,
      templateName,
      postData.Post_Title || '',
      postData.Post_Copy || '',
      platforms.join(', '),
      postData.Content_Category || '',
      postData.Strategy_Goals || '',
      postData.Hashtags || '',
      postData.Link_URL || '',
      postData.Internal_Notes || '',
      currentUser,
      timestamp,
      'Active'
    ]);

    Logger.log('✅ Template saved: ' + templateId);
    return {
      success: true,
      templateId: templateId,
      message: 'Template saved successfully'
    };

  } catch (e) {
    Logger.log('Error saving template: ' + e.message);
    return {success: false, error: e.message};
  }
}

/**
 * Get all active templates
 * @returns {Array} Array of template objects
 */
function getAllTemplates() {
  try {
    Logger.log('Getting all templates...');

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Templates');
    if (!sheet) {
      Logger.log('Post_Templates sheet does not exist yet');
      return [];
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      Logger.log('No templates found');
      return [];
    }

    var headers = data[0];
    var templates = [];

    for (var i = 1; i < data.length; i++) {
      var template = {};
      for (var j = 0; j < headers.length; j++) {
        var value = data[i][j];
        // Convert dates to ISO strings
        if (value instanceof Date) {
          value = value.toISOString();
        }
        template[headers[j]] = value;
      }

      // Only return active templates
      if (template.Status === 'Active') {
        templates.push(template);
      }
    }

    Logger.log('Found ' + templates.length + ' active templates');
    return templates;

  } catch (e) {
    Logger.log('Error getting templates: ' + e.message);
    return [];
  }
}

/**
 * Get a template by ID
 * @param {string} templateId - Template ID
 * @returns {Object} Template data or error
 */
function getTemplateById(templateId) {
  try {
    Logger.log('Getting template: ' + templateId);

    var templates = getAllTemplates();
    var template = templates.find(function(t) {
      return t.ID === templateId;
    });

    if (!template) {
      return {success: false, error: 'Template not found'};
    }

    return {success: true, template: template};

  } catch (e) {
    Logger.log('Error getting template: ' + e.message);
    return {success: false, error: e.message};
  }
}

/**
 * Delete a template
 * @param {string} templateId - Template ID to delete
 * @returns {Object} Success/failure result
 */
function deleteTemplate(templateId) {
  try {
    Logger.log('Deleting template: ' + templateId);

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Templates');
    if (!sheet) {
      return {success: false, error: 'Post_Templates sheet not found'};
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIndex = headers.indexOf('ID');
    var statusIndex = headers.indexOf('Status');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === templateId) {
        // Mark as inactive instead of deleting
        sheet.getRange(i + 1, statusIndex + 1).setValue('Inactive');
        Logger.log('✅ Template marked as inactive');
        return {success: true, message: 'Template deleted successfully'};
      }
    }

    return {success: false, error: 'Template not found'};

  } catch (e) {
    Logger.log('Error deleting template: ' + e.message);
    return {success: false, error: e.message};
  }
}
