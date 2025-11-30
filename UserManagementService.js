/****************************************************
 * UserManagementService.js - User & Access Management
 * Handles agency team members and client admin management
 ****************************************************/

/**
 * NOTE: getAllUsers() is defined in DataService.js
 * This file contains other user management functions
 */

/**
 * Add a new agency team member
 * @param {Object} userData - {email, fullName, role}
 * @returns {Object} Success/failure result
 */
function addUser(userData) {
  try {
    Logger.log('Adding user: ' + userData.email);

    // Validate inputs
    if (!userData.email || !userData.fullName || !userData.role) {
      return {success: false, error: 'Email, full name, and role are required'};
    }

    // Check if user already exists
    var existingUsers = _readSheetAsObjects_('Users', {
      filterFn: function(u) {
        return u.Email === userData.email;
      }
    });

    if (existingUsers.length > 0) {
      return {success: false, error: 'User with this email already exists'};
    }

    var sheet = _getSheet_('Users');
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var currentUser = Session.getActiveUser().getEmail();
    var timestamp = new Date();

    // Prepare row data
    var rowData = [];
    headers.forEach(function(header) {
      switch(header) {
        case 'ID':
          rowData.push(generateId('USR'));
          break;
        case 'Email':
          rowData.push(userData.email);
          break;
        case 'Full_Name':
          rowData.push(userData.fullName);
          break;
        case 'Default_Role':
          rowData.push(userData.role);
          break;
        case 'Status':
          rowData.push('Active');
          break;
        case 'Created_Date':
          rowData.push(timestamp);
          break;
        case 'Created_By':
          rowData.push(currentUser);
          break;
        default:
          rowData.push('');
      }
    });

    sheet.appendRow(rowData);
    Logger.log('✅ User added: ' + userData.email);

    return {
      success: true,
      message: 'User added successfully'
    };

  } catch (e) {
    Logger.log('Error adding user: ' + e.message);
    return _err_(e, 'addUser');
  }
}

/**
 * Update user role or status
 * @param {string} userId - User ID
 * @param {Object} updates - {role, status}
 * @returns {Object} Success/failure result
 */
function updateUser(userId, updates) {
  try {
    Logger.log('Updating user: ' + userId);

    var sheet = _getSheet_('Users');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIndex = headers.indexOf('ID');
    var roleIndex = headers.indexOf('Default_Role');
    var statusIndex = headers.indexOf('Status');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === userId) {
        if (updates.role && roleIndex !== -1) {
          sheet.getRange(i + 1, roleIndex + 1).setValue(updates.role);
        }
        if (updates.status && statusIndex !== -1) {
          sheet.getRange(i + 1, statusIndex + 1).setValue(updates.status);
        }

        Logger.log('✅ User updated');
        return {success: true, message: 'User updated successfully'};
      }
    }

    return {success: false, error: 'User not found'};

  } catch (e) {
    Logger.log('Error updating user: ' + e.message);
    return _err_(e, 'updateUser');
  }
}

/**
 * Deactivate a user (soft delete)
 * @param {string} userId - User ID
 * @returns {Object} Success/failure result
 */
function deactivateUser(userId) {
  try {
    return updateUser(userId, {status: 'Inactive'});
  } catch (e) {
    Logger.log('Error deactivating user: ' + e.message);
    return _err_(e, 'deactivateUser');
  }
}

/**
 * Get all authorized clients with their access details
 * @returns {Array} Array of authorized client objects
 */
function getAllAuthorizedClients() {
  try {
    var authorizedClients = _readSheetAsObjects_('Authorized_Clients', {
      sortFn: function(a, b) {
        var dateA = a.Created_Date ? new Date(a.Created_Date) : new Date(0);
        var dateB = b.Created_Date ? new Date(b.Created_Date) : new Date(0);
        return dateB - dateA; // Most recent first
      }
    });

    // Enrich with client names
    var clients = {};
    var allClients = _readSheetAsObjects_('Clients');
    allClients.forEach(function(client) {
      clients[client.ID] = client.Client_Name;
    });

    authorizedClients.forEach(function(ac) {
      ac.Client_Name = clients[ac.Client_ID] || ac.Client_ID;

      // Convert Date objects to ISO strings for web app compatibility
      if (ac.Created_Date instanceof Date) {
        ac.Created_Date = ac.Created_Date.toISOString();
      }
      if (ac.Last_Login instanceof Date) {
        ac.Last_Login = ac.Last_Login.toISOString();
      }
      if (ac.Token_Expires instanceof Date) {
        ac.Token_Expires = ac.Token_Expires.toISOString();
      }
    });

    return authorizedClients;
  } catch (e) {
    Logger.log('Error getting authorized clients: ' + e.message);
    return [];
  }
}

/**
 * Update authorized client access level or status
 * @param {string} authorizedClientId - Authorized client ID
 * @param {Object} updates - {accessLevel, status, postIds}
 * @returns {Object} Success/failure result
 */
function updateAuthorizedClient(authorizedClientId, updates) {
  try {
    Logger.log('Updating authorized client: ' + authorizedClientId);

    var sheet = _getSheet_('Authorized_Clients');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIndex = headers.indexOf('ID');
    var accessLevelIndex = headers.indexOf('Access_Level');
    var statusIndex = headers.indexOf('Status');
    var postIdsIndex = headers.indexOf('Post_IDs');
    var accessTypeIndex = headers.indexOf('Access_Type');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === authorizedClientId) {
        if (updates.accessLevel && accessLevelIndex !== -1) {
          sheet.getRange(i + 1, accessLevelIndex + 1).setValue(updates.accessLevel);
        }
        if (updates.status && statusIndex !== -1) {
          sheet.getRange(i + 1, statusIndex + 1).setValue(updates.status);
        }
        if (updates.postIds !== undefined && postIdsIndex !== -1) {
          sheet.getRange(i + 1, postIdsIndex + 1).setValue(updates.postIds);
        }
        if (updates.accessType && accessTypeIndex !== -1) {
          sheet.getRange(i + 1, accessTypeIndex + 1).setValue(updates.accessType);
        }

        Logger.log('✅ Authorized client updated');
        return {success: true, message: 'Access updated successfully'};
      }
    }

    return {success: false, error: 'Authorized client not found'};

  } catch (e) {
    Logger.log('Error updating authorized client: ' + e.message);
    return _err_(e, 'updateAuthorizedClient');
  }
}

/**
 * Set a client admin (gives full access to all posts for that client)
 * @param {string} authorizedClientId - Authorized client ID
 * @returns {Object} Success/failure result
 */
function setAsClientAdmin(authorizedClientId) {
  try {
    return updateAuthorizedClient(authorizedClientId, {
      accessLevel: 'Admin',
      postIds: '', // Empty means access to all posts
      accessType: 'Full' // Full access type - sees all posts
    });
  } catch (e) {
    Logger.log('Error setting client admin: ' + e.message);
    return _err_(e, 'setAsClientAdmin');
  }
}

/**
 * Available user roles for agency team
 */
var USER_ROLES = {
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  CREATOR: 'Creator',
  VIEWER: 'Viewer'
};

/**
 * Available access levels for client users
 */
var CLIENT_ACCESS_LEVELS = {
  ADMIN: 'Admin',      // Full access, can manage reviewers
  FULL: 'Full',        // Can approve/reject all posts
  READ_ONLY: 'Read_Only'  // Can view only
};
