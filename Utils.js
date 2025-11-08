/**
 * Social Media Planner - Utility Functions
 * Utils.gs
 * 
 * Helper functions for ID generation, authentication, and common operations
 */

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate unique ID with prefix
 * @param {string} prefix - ID prefix (e.g., 'POST', 'CLT', 'USR')
 * @returns {string} - Unique ID like 'POST-001'
 */
function generateId(prefix) {
  // Get the appropriate sheet based on prefix
  var sheetName;
  switch(prefix) {
    case 'CLT': sheetName = 'Clients'; break;
    case 'SUB': sheetName = 'Subsidiaries'; break;
    case 'USR': sheetName = 'Users'; break;
    case 'UC': sheetName = 'User_Clients'; break;
    case 'POST': sheetName = 'Posts'; break;
    case 'PP': sheetName = 'Post_Platforms'; break;
    case 'PA': sheetName = 'Post_Approvals'; break;  // FIX: was 'APR', should be 'PA'
    case 'APR': sheetName = 'Post_Approvals'; break; // Keep for backwards compatibility
    case 'COM': sheetName = 'Comments'; break;       // FIX: was 'CMT', should be 'COM'
    case 'CMT': sheetName = 'Comments'; break;       // Keep for backwards compatibility
    case 'AC': sheetName = 'Authorized_Clients'; break;
    case 'LIB': sheetName = 'Content_Library'; break;
    case 'PLT': sheetName = 'Platforms'; break;
    case 'CAT': sheetName = 'Content_Categories'; break;
    case 'STR': sheetName = 'Strategy_Goals'; break;
    case 'CMP': sheetName = 'Campaigns'; break;
    default: sheetName = 'Posts';
  }
  
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  // Find highest existing ID number for this prefix
  var maxNum = 0;
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0]);
    if (id.indexOf(prefix) === 0) {
      var num = parseInt(id.split('-')[1]);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }
  
  // Generate new ID
  var newNum = maxNum + 1;
  var paddedNum = ('000' + newNum).slice(-3);
  return prefix + '-' + paddedNum;
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

/**
 * Check if user is authorized to access the app
 * @param {string} email - User email
 * @returns {boolean}
 */
function isAuthorizedUser(email) {
  if (!email) return false;
  
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === email && data[i][4] === 'Active') {
      return true;
    }
  }
  
  return false;
}

/**
 * Get user's default role
 * @param {string} email - User email
 * @returns {string} - Role name
 */
function getUserDefaultRole(email) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      return data[i][3]; // Default_Role column
    }
  }
  
  return null;
}

/**
 * Get user's full name
 * @param {string} email - User email
 * @returns {string} - Full name
 */
function getUserFullName(email) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      return data[i][2]; // Full_Name column
    }
  }
  
  return email;
}

/**
 * Check if user is admin
 * @param {string} email - User email
 * @returns {boolean}
 */
function isAdmin(email) {
  var role = getUserDefaultRole(email);
  return role === 'Admin';
}

/**
 * Check if user can approve for a specific client
 * @param {string} email - User email
 * @param {string} clientId - Client ID
 * @returns {boolean}
 */
function canUserApprove(email, clientId) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('User_Clients');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === email && data[i][2] === clientId && data[i][4] === true) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// DATA HELPERS
// ============================================================================

/**
 * Get column index by header name
 * @param {Array} headers - Array of header names
 * @param {string} columnName - Name to find
 * @returns {number} - Column index (0-based)
 */
function getColumnIndexByName(headers, columnName) {
  return headers.indexOf(columnName);
}

/**
 * Convert sheet data to array of objects
 * @param {Array} data - 2D array from sheet
 * @returns {Array} - Array of objects
 */
function dataToObjects(data) {
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var rows = data.slice(1);
  
  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Parse comma-separated IDs into array
 * @param {string} idString - Comma-separated IDs
 * @returns {Array} - Array of IDs
 */
function parseIds(idString) {
  if (!idString || idString === '') return [];
  return idString.split(',').map(function(id) {
    return id.trim();
  });
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  if (!date) return '';
  var d = new Date(date);
  var month = '' + (d.getMonth() + 1);
  var day = '' + d.getDate();
  var year = d.getFullYear();
  
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  
  return [year, month, day].join('-');
}

/**
 * Format date and time for display
 * @param {Date} date - Date object
 * @returns {string} - Formatted datetime string
 */
function formatDateTime(date) {
  if (!date) return '';
  var d = new Date(date);
  return d.toLocaleString();
}

// ============================================================================
// CALENDAR HELPERS
// ============================================================================

/**
 * Get posts for a specific month
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (1-12)
 * @param {string} clientId - Optional client filter
 * @returns {Array} - Posts in that month
 */
function getPostsForMonth(year, month, clientId) {
  var startDate = new Date(year, month - 1, 1);
  var endDate = new Date(year, month, 0);
  
  return getPostsByDateRange(startDate, endDate, clientId);
}

/**
 * Get posts for a specific week
 * @param {Date} startDate - Start of week
 * @returns {Array} - Posts in that week
 */
function getPostsForWeek(startDate) {
  var endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  return getPostsByDateRange(startDate, endDate);
}

/**
 * Group posts by date
 * @param {Array} posts - Array of post objects
 * @returns {Object} - Posts grouped by date key (YYYY-MM-DD)
 */
function groupPostsByDate(posts) {
  var grouped = {};
  
  posts.forEach(function(post) {
    if (post.Scheduled_Date) {
      var dateKey = formatDate(post.Scheduled_Date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(post);
    }
  });
  
  return grouped;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate required fields for post creation
 * @param {Object} postData - Post data object
 * @returns {Object} - {valid: boolean, errors: Array}
 */
function validatePostData(postData) {
  var errors = [];
  
  if (!postData.clientId) {
    errors.push('Client is required');
  }
  
  if (!postData.title || postData.title.trim() === '') {
    errors.push('Post title is required');
  }
  
  if (!postData.copy || postData.copy.trim() === '') {
    errors.push('Post copy is required');
  }
  
  if (postData.copy && postData.copy.length < 10) {
    errors.push('Post copy must be at least 10 characters');
  }
  
  if (!postData.scheduledDate) {
    errors.push('Scheduled date is required');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// ============================================================================
// EMAIL HELPERS
// ============================================================================

/**
 * Send email notification
 * @param {string} recipient - Email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 */
function sendEmail(recipient, subject, body) {
  try {
    Logger.log('=== SENDING EMAIL ===');
    Logger.log('To: ' + recipient);
    Logger.log('Subject: ' + subject);
    Logger.log('Body length: ' + body.length + ' chars');

    // Validate recipient email
    if (!recipient || recipient.trim() === '') {
      throw new Error('Recipient email is empty');
    }

    // Check email format
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient.trim())) {
      throw new Error('Invalid email format: ' + recipient);
    }

    // Get current user's email quota info
    var quotaRemaining = MailApp.getRemainingDailyQuota();
    Logger.log('Daily email quota remaining: ' + quotaRemaining);

    if (quotaRemaining === 0) {
      throw new Error('Daily email quota exceeded (0 remaining)');
    }

    // Send email using GmailApp
    GmailApp.sendEmail(recipient.trim(), subject, body);
    Logger.log('✅ Email sent successfully to: ' + recipient);

    return {success: true};
  } catch (e) {
    Logger.log('❌ ERROR sending email: ' + e.message);
    Logger.log('Stack trace: ' + e.stack);
    return {success: false, error: e.message};
  }
}

/**
 * Get web app URL
 * @returns {string} - Web app URL
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Log action for audit trail
 * @param {string} action - Action description
 * @param {Object} details - Additional details
 */
function logAction(action, details) {
  var user = Session.getActiveUser().getEmail();
  var timestamp = new Date();
  
  Logger.log('[' + timestamp + '] ' + user + ' - ' + action);
  if (details) {
    Logger.log(JSON.stringify(details));
  }
}

// ============================================================================
// ARRAY HELPERS
// ============================================================================

/**
 * Remove duplicates from array
 * @param {Array} arr - Input array
 * @returns {Array} - Array without duplicates
 */
function removeDuplicates(arr) {
  return arr.filter(function(item, index) {
    return arr.indexOf(item) === index;
  });
}

/**
 * Sort array of objects by property
 * @param {Array} arr - Array to sort
 * @param {string} property - Property to sort by
 * @param {boolean} descending - Sort descending if true
 * @returns {Array} - Sorted array
 */
function sortByProperty(arr, property, descending) {
  return arr.sort(function(a, b) {
    if (a[property] < b[property]) return descending ? 1 : -1;
    if (a[property] > b[property]) return descending ? -1 : 1;
    return 0;
  });
}