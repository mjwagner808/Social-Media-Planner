/****************************************************
 * ClientAuthService.js - Client Authentication & Access Control
 * Handles secure token-based access for client review portal
 ****************************************************/

/**
 * Generate a secure random token for client access
 * @returns {string} - 32-character random token
 */
function generateAccessToken() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var token = '';
  for (var i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Grant client access - creates authorized client record
 * @param {string} clientId - Client ID from Clients sheet
 * @param {string} email - Client's email address
 * @param {string} accessLevel - 'Full' or 'Read_Only'
 * @returns {Object} - {success: true, token: '...', url: '...'} or error
 */
function grantClientAccess(clientId, email, accessLevel) {
  try {
    Logger.log('Granting client access for: ' + email + ', Client: ' + clientId);

    // Validate inputs
    if (!clientId || !email) {
      return {success: false, error: 'Client ID and email are required'};
    }

    accessLevel = accessLevel || 'Full';

    // Check if client exists
    var client = getClientById(clientId);
    if (!client) {
      return {success: false, error: 'Client not found: ' + clientId};
    }

    // Check if this email already has access for this client
    var existingAccess = getAuthorizedClientByEmail(email, clientId);
    if (existingAccess && existingAccess.Status === 'Active') {
      return {
        success: true,
        token: existingAccess.Access_Token,
        url: getClientAccessUrl(existingAccess.Access_Token),
        message: 'Client already has active access',
        isExisting: true
      };
    }

    // Generate new token
    var token = generateAccessToken();
    var currentUser = Session.getActiveUser().getEmail();
    var timestamp = new Date();

    // Generate new ID
    var authorizedClientId = generateId('AC');

    // Get Authorized_Clients sheet
    var sheet = _getSheet_('Authorized_Clients');
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Prepare row data
    var rowData = [];
    headers.forEach(function(header) {
      switch(header) {
        case 'ID':
          rowData.push(authorizedClientId);
          break;
        case 'Client_ID':
          rowData.push(clientId);
          break;
        case 'Email':
          rowData.push(email);
          break;
        case 'Access_Token':
          rowData.push(token);
          break;
        case 'Access_Level':
          rowData.push(accessLevel);
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
        case 'Last_Login':
          rowData.push('');
          break;
        case 'Token_Expires':
          rowData.push('');
          break;
        default:
          rowData.push('');
      }
    });

    // Append to sheet
    sheet.appendRow(rowData);

    Logger.log('Client access granted successfully. Token: ' + token);

    return {
      success: true,
      token: token,
      url: getClientAccessUrl(token),
      message: 'Client access granted successfully'
    };

  } catch (e) {
    Logger.log('Error granting client access: ' + e.message);
    return _err_(e, 'grantClientAccess');
  }
}

/**
 * Get client access URL with token
 * @param {string} token - Access token
 * @returns {string} - Full URL to client portal
 */
function getClientAccessUrl(token) {
  // Use the production deployment URL (not dev URL)
  var scriptUrl = 'https://script.google.com/macros/s/AKfycbzhrrk3U7b_AIW5JjOwe1i96Q9cqkfZZCcUd0qs5VeaB69So-w8kyE4BfdMLnQxuyG2/exec';
  return scriptUrl + '?page=client&token=' + token;
}

/**
 * Validate client access token
 * @param {string} token - Access token to validate
 * @returns {Object} - Authorized client record or null
 */
function validateClientToken(token) {
  try {
    if (!token) return null;

    var authorizedClients = _readSheetAsObjects_('Authorized_Clients', {
      filterFn: function(ac) {
        return ac.Access_Token === token && ac.Status === 'Active';
      }
    });

    if (!authorizedClients || authorizedClients.length === 0) {
      Logger.log('Invalid or inactive token: ' + token);
      return null;
    }

    var authorizedClient = authorizedClients[0];

    // Check if token is expired (if Token_Expires is set)
    if (authorizedClient.Token_Expires) {
      var expiryDate = new Date(authorizedClient.Token_Expires);
      if (expiryDate < new Date()) {
        Logger.log('Token expired: ' + token);
        return null;
      }
    }

    // Update last login timestamp
    updateLastLogin(authorizedClient.ID);

    Logger.log('Token validated for client: ' + authorizedClient.Client_ID + ', Email: ' + authorizedClient.Email);
    return authorizedClient;

  } catch (e) {
    Logger.log('Error validating token: ' + e.message);
    return null;
  }
}

/**
 * Update last login timestamp
 * @param {string} authorizedClientId - Authorized client ID
 */
function updateLastLogin(authorizedClientId) {
  try {
    var sheet = _getSheet_('Authorized_Clients');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIndex = headers.indexOf('ID');
    var lastLoginIndex = headers.indexOf('Last_Login');

    if (lastLoginIndex === -1) return; // Column doesn't exist

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === authorizedClientId) {
        sheet.getRange(i + 1, lastLoginIndex + 1).setValue(new Date());
        break;
      }
    }
  } catch (e) {
    Logger.log('Error updating last login: ' + e.message);
  }
}

/**
 * Get authorized client by email and client ID
 * @param {string} email - Client email
 * @param {string} clientId - Client ID
 * @returns {Object} - Authorized client record or null
 */
function getAuthorizedClientByEmail(email, clientId) {
  try {
    var authorizedClients = _readSheetAsObjects_('Authorized_Clients', {
      filterFn: function(ac) {
        return ac.Email === email && ac.Client_ID === clientId;
      }
    });

    return authorizedClients.length > 0 ? authorizedClients[0] : null;
  } catch (e) {
    Logger.log('Error getting authorized client: ' + e.message);
    return null;
  }
}

/**
 * Revoke client access
 * @param {string} authorizedClientId - Authorized client ID
 * @returns {Object} - {success: true} or error
 */
function revokeClientAccess(authorizedClientId) {
  try {
    var sheet = _getSheet_('Authorized_Clients');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIndex = headers.indexOf('ID');
    var statusIndex = headers.indexOf('Status');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === authorizedClientId) {
        sheet.getRange(i + 1, statusIndex + 1).setValue('Inactive');
        Logger.log('Client access revoked: ' + authorizedClientId);
        return {success: true, message: 'Client access revoked'};
      }
    }

    return {success: false, error: 'Authorized client not found'};
  } catch (e) {
    Logger.log('Error revoking client access: ' + e.message);
    return _err_(e, 'revokeClientAccess');
  }
}

/**
 * Get all authorized clients for a specific client
 * @param {string} clientId - Client ID
 * @returns {Array} - Array of authorized client records
 */
function getAuthorizedClientsForClient(clientId) {
  try {
    var authorizedClients = _readSheetAsObjects_('Authorized_Clients', {
      filterFn: function(ac) {
        return ac.Client_ID === clientId;
      },
      sortFn: function(a, b) {
        var dateA = a.Created_Date ? new Date(a.Created_Date) : new Date(0);
        var dateB = b.Created_Date ? new Date(b.Created_Date) : new Date(0);
        return dateB - dateA; // Most recent first
      }
    });

    return authorizedClients;
  } catch (e) {
    Logger.log('Error getting authorized clients: ' + e.message);
    return [];
  }
}

/**
 * Get all posts for a client (filtered by their access)
 * @param {string} clientId - Client ID
 * @returns {Array} - Array of posts visible to this client
 */
function getClientPosts(clientId) {
  try {
    Logger.log('Getting posts for client: ' + clientId);

    // Get all posts for this client
    var posts = _readSheetAsObjects_('Posts', {
      filterFn: function(p) {
        return p.Client_ID === clientId;
      },
      coerceFn: function(p) {
        // Convert date fields to ISO strings
        for (var key in p) {
          if (p.hasOwnProperty(key)) {
            var value = p[key];
            if (Object.prototype.toString.call(value) === '[object Date]') {
              p[key] = _toIso_(value);
            } else if (typeof value === 'string') {
              p[key] = value.trim();
            }
          }
        }
        return p;
      }
    });

    Logger.log('Found ' + posts.length + ' posts for client: ' + clientId);
    return posts;

  } catch (e) {
    Logger.log('Error getting client posts: ' + e.message);
    return [];
  }
}

/**
 * Get client posts with images for calendar view
 * @param {string} clientId - Client ID
 * @returns {Array} - Array of posts with image URLs
 */
function getClientPostsWithImages(clientId) {
  try {
    var posts = getClientPosts(clientId);

    // Get Post_Platforms data to extract images
    var platformSheet = _getSheet_('Post_Platforms');
    var dataRange = platformSheet.getDataRange();
    var platformData = dataRange.getValues();
    var platformFormulas = dataRange.getFormulas();

    if (platformData.length <= 1) return posts;

    var headers = platformData[0];
    var postIdIndex = headers.indexOf('Post_ID');
    var mediaUrlIndex = headers.indexOf('Media_File_URL');
    var mediaTypeIndex = headers.indexOf('Media_Type');

    if (postIdIndex === -1 || mediaUrlIndex === -1) return posts;

    // Create a map of Post_ID to first image
    var imageMap = {};

    for (var i = 1; i < platformData.length; i++) {
      var postId = platformData[i][postIdIndex];

      // Skip if already have an image for this post
      if (imageMap[postId]) continue;

      var mediaUrl = platformFormulas[i][mediaUrlIndex] || platformData[i][mediaUrlIndex];
      var mediaType = platformData[i][mediaTypeIndex] || '';

      if (mediaUrl) {
        var extractedUrl = extractUrlFromImageFormula(mediaUrl);
        if (extractedUrl) {
          imageMap[postId] = {
            url: extractedUrl,
            isCarousel: String(mediaType).toLowerCase().indexOf('carousel') > -1
          };
        }
      }
    }

    // Attach images to posts
    for (var j = 0; j < posts.length; j++) {
      var postId = posts[j].ID;
      if (imageMap[postId]) {
        posts[j].image_url = imageMap[postId].url;
        posts[j].is_carousel = imageMap[postId].isCarousel;
      } else {
        posts[j].image_url = '';
        posts[j].is_carousel = false;
      }
    }

    Logger.log('Returning ' + posts.length + ' posts with images for client: ' + clientId);
    return posts;

  } catch (e) {
    Logger.log('Error getting client posts with images: ' + e.message);
    return [];
  }
}
