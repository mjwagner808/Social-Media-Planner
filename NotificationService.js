/**
 * Notification Service
 * Handles in-app notifications for users
 *
 * Database: Notifications sheet
 * Columns: ID, User_Email, Message, Type, Read, Post_ID, Created_Date, Action_URL
 */

// Notification types
var NOTIFICATION_TYPES = {
  APPROVAL_REQUEST: 'approval_request',
  APPROVAL_DECISION: 'approval_decision',
  COMMENT_ADDED: 'comment_added',
  STATUS_CHANGE: 'status_change',
  MENTION: 'mention'
};

/**
 * Create a new notification
 * @param {string} userEmail - Email of user to notify
 * @param {string} message - Notification message
 * @param {string} type - Notification type (from NOTIFICATION_TYPES)
 * @param {string} postId - Related post ID (optional)
 * @param {string} actionUrl - URL to navigate when clicked (optional)
 * @returns {Object} Success/failure result
 */
function createNotification(userEmail, message, type, postId, actionUrl) {
  try {
    Logger.log('=== Creating Notification ===');
    Logger.log('User: ' + userEmail);
    Logger.log('Message: ' + message);
    Logger.log('Type: ' + type);

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Notifications');

    // Create sheet if it doesn't exist
    if (!sheet) {
      Logger.log('Notifications sheet not found, creating...');
      sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet('Notifications');
      sheet.appendRow(['ID', 'User_Email', 'Message', 'Type', 'Read', 'Post_ID', 'Created_Date', 'Action_URL']);
      Logger.log('Notifications sheet created');
    }

    var notificationId = generateId('NOTIF');
    var timestamp = new Date();

    sheet.appendRow([
      notificationId,
      userEmail,
      message,
      type || NOTIFICATION_TYPES.APPROVAL_REQUEST,
      false, // Read status
      postId || '',
      timestamp,
      actionUrl || ''
    ]);

    Logger.log('✅ Notification created: ' + notificationId);
    return {success: true, notificationId: notificationId};

  } catch (e) {
    Logger.log('❌ Error creating notification: ' + e.message);
    return {success: false, error: e.message};
  }
}

/**
 * Get unread notifications for a user
 * @param {string} userEmail - User's email address
 * @returns {Array} Array of unread notifications
 */
function getUnreadNotifications(userEmail) {
  try {
    Logger.log('=== Getting Unread Notifications ===');
    Logger.log('User: ' + userEmail);

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Notifications');

    if (!sheet) {
      Logger.log('Notifications sheet does not exist yet');
      return [];
    }

    var data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      Logger.log('No notifications found');
      return [];
    }

    var headers = data[0];
    var userEmailIndex = headers.indexOf('User_Email');
    var readIndex = headers.indexOf('Read');
    var createdDateIndex = headers.indexOf('Created_Date');

    var notifications = [];

    for (var i = 1; i < data.length; i++) {
      var rowEmail = String(data[i][userEmailIndex]).trim().toLowerCase();
      var isRead = data[i][readIndex];

      // Match user and unread status
      if (rowEmail === userEmail.toLowerCase() && (isRead === false || isRead === 'FALSE' || isRead === '')) {
        var notification = {};
        for (var j = 0; j < headers.length; j++) {
          var value = data[i][j];
          // Convert dates to ISO strings
          if (value instanceof Date) {
            value = value.toISOString();
          }
          notification[headers[j]] = value;
        }
        notifications.push(notification);
      }
    }

    // Sort by created date, newest first
    notifications.sort(function(a, b) {
      return new Date(b.Created_Date) - new Date(a.Created_Date);
    });

    Logger.log('Found ' + notifications.length + ' unread notifications');
    return notifications;

  } catch (e) {
    Logger.log('❌ Error getting notifications: ' + e.message);
    return [];
  }
}

/**
 * Get unread notification count for a user
 * @param {string} userEmail - User's email address
 * @returns {number} Count of unread notifications
 */
function getUnreadNotificationCount(userEmail) {
  try {
    var notifications = getUnreadNotifications(userEmail);
    return notifications.length;
  } catch (e) {
    Logger.log('Error getting notification count: ' + e.message);
    return 0;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Object} Success/failure result
 */
function markNotificationRead(notificationId) {
  try {
    Logger.log('=== Marking Notification Read ===');
    Logger.log('Notification ID: ' + notificationId);

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Notifications');

    if (!sheet) {
      return {success: false, error: 'Notifications sheet not found'};
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIndex = headers.indexOf('ID');
    var readIndex = headers.indexOf('Read');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === notificationId) {
        sheet.getRange(i + 1, readIndex + 1).setValue(true);
        // CRITICAL: Flush to ensure write completes before next read
        SpreadsheetApp.flush();
        Logger.log('✅ Notification marked as read and flushed');
        return {success: true};
      }
    }

    Logger.log('⚠️ Notification not found');
    return {success: false, error: 'Notification not found'};

  } catch (e) {
    Logger.log('❌ Error marking notification read: ' + e.message);
    return {success: false, error: e.message};
  }
}

/**
 * Mark all notifications as read for a specific post
 * Called when user views a post - auto-clears related notifications
 * @param {string} postId - Post ID
 * @returns {Object} Success/failure result with count of notifications marked
 */
function markNotificationsReadForPost(postId) {
  try {
    Logger.log('=== Marking Notifications Read for Post ===');
    Logger.log('Post ID: ' + postId);

    var currentUser = Session.getActiveUser().getEmail();
    if (!currentUser) {
      Logger.log('No active user found');
      return {success: false, error: 'No active user'};
    }

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Notifications');

    if (!sheet) {
      return {success: false, error: 'Notifications sheet not found'};
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var userEmailIndex = headers.indexOf('User_Email');
    var postIdIndex = headers.indexOf('Post_ID');
    var readIndex = headers.indexOf('Read');

    var count = 0;

    for (var i = 1; i < data.length; i++) {
      var rowEmail = String(data[i][userEmailIndex]).trim().toLowerCase();
      var rowPostId = data[i][postIdIndex];
      var isRead = data[i][readIndex];

      // Mark as read if: matches user, matches post, and currently unread
      if (rowEmail === currentUser.toLowerCase() &&
          rowPostId === postId &&
          (isRead === false || isRead === 'FALSE' || isRead === '')) {
        sheet.getRange(i + 1, readIndex + 1).setValue(true);
        count++;
      }
    }

    // Flush to ensure writes complete
    if (count > 0) {
      SpreadsheetApp.flush();
    }

    Logger.log('✅ Marked ' + count + ' notifications as read for post ' + postId);
    return {success: true, count: count};

  } catch (e) {
    Logger.log('❌ Error marking notifications read for post: ' + e.message);
    return {success: false, error: e.message};
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} userEmail - User's email address
 * @returns {Object} Success/failure result with count
 */
function markAllNotificationsRead(userEmail) {
  try {
    Logger.log('=== Marking All Notifications Read ===');
    Logger.log('User: ' + userEmail);

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Notifications');

    if (!sheet) {
      return {success: false, error: 'Notifications sheet not found'};
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var userEmailIndex = headers.indexOf('User_Email');
    var readIndex = headers.indexOf('Read');

    var count = 0;

    for (var i = 1; i < data.length; i++) {
      var rowEmail = String(data[i][userEmailIndex]).trim().toLowerCase();
      var isRead = data[i][readIndex];

      if (rowEmail === userEmail.toLowerCase() && (isRead === false || isRead === 'FALSE' || isRead === '')) {
        sheet.getRange(i + 1, readIndex + 1).setValue(true);
        count++;
      }
    }

    Logger.log('✅ Marked ' + count + ' notifications as read');
    return {success: true, count: count};

  } catch (e) {
    Logger.log('❌ Error marking all notifications read: ' + e.message);
    return {success: false, error: e.message};
  }
}

/**
 * Create notification for approval request
 * @param {string} approverEmail - Approver's email
 * @param {string} postTitle - Post title
 * @param {string} postId - Post ID
 * @param {string} approvalStage - 'Internal' or 'Client'
 */
function notifyApprovalRequest(approverEmail, postTitle, postId, approvalStage) {
  var message = 'New ' + approvalStage.toLowerCase() + ' approval request: ' + postTitle;
  return createNotification(
    approverEmail,
    message,
    NOTIFICATION_TYPES.APPROVAL_REQUEST,
    postId,
    '?post=' + postId
  );
}

/**
 * Create notification for approval decision
 * @param {string} creatorEmail - Post creator's email
 * @param {string} approverName - Approver's name/email
 * @param {string} decision - 'Approved' or 'Changes Requested'
 * @param {string} postTitle - Post title
 * @param {string} postId - Post ID
 */
function notifyApprovalDecision(creatorEmail, approverName, decision, postTitle, postId) {
  var message = approverName + ' ' + (decision === 'Approved' ? 'approved' : 'requested changes on') + ' "' + postTitle + '"';
  return createNotification(
    creatorEmail,
    message,
    NOTIFICATION_TYPES.APPROVAL_DECISION,
    postId,
    '?post=' + postId
  );
}

/**
 * Create notification for new comment
 * @param {string} userEmail - User to notify
 * @param {string} commenterName - Commenter's name/email
 * @param {string} postTitle - Post title
 * @param {string} postId - Post ID
 */
function notifyComment(userEmail, commenterName, postTitle, postId) {
  var message = commenterName + ' commented on "' + postTitle + '"';
  return createNotification(
    userEmail,
    message,
    NOTIFICATION_TYPES.COMMENT_ADDED,
    postId,
    '?post=' + postId
  );
}

/**
 * Create notification for status change
 * @param {string} userEmail - User to notify
 * @param {string} postTitle - Post title
 * @param {string} newStatus - New status
 * @param {string} postId - Post ID
 */
function notifyStatusChange(userEmail, postTitle, newStatus, postId) {
  var message = '"' + postTitle + '" moved to ' + newStatus.replace('_', ' ');
  return createNotification(
    userEmail,
    message,
    NOTIFICATION_TYPES.STATUS_CHANGE,
    postId,
    '?post=' + postId
  );
}

/**
 * Create notification for internal note added to a post
 * @param {string} userEmail - User to notify
 * @param {string} postId - Post ID
 * @param {string} commenterEmail - Who added the note
 * @param {string} commentText - The note content (truncated for notification)
 */
function createNotificationForComment(userEmail, postId, commenterEmail, commentText) {
  try {
    Logger.log('Creating comment notification for ' + userEmail);

    // Get post title for better context
    var post = getPostById(postId);
    var postTitle = 'a post';
    if (post && post.success && post.post) {
      postTitle = '"' + (post.post.Post_Title || 'Untitled') + '"';
    }

    // Truncate comment text for notification
    var preview = commentText.length > 50
      ? commentText.substring(0, 50) + '...'
      : commentText;

    var message = commenterEmail + ' added a note to ' + postTitle + ': ' + preview;

    return createNotification(
      userEmail,
      message,
      NOTIFICATION_TYPES.COMMENT_ADDED,
      postId,
      '?post=' + postId
    );
  } catch (e) {
    Logger.log('Error creating comment notification: ' + e.message);
    return {success: false, error: e.message};
  }
}
