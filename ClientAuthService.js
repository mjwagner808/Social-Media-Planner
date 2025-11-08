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
function grantClientAccess(clientId, email, accessLevel, postIds) {
  try {
    Logger.log('Granting client access for: ' + email + ', Client: ' + clientId);
    Logger.log('Post IDs: ' + (postIds || 'ALL'));

    // Validate inputs
    if (!clientId || !email) {
      return {success: false, error: 'Client ID and email are required'};
    }

    accessLevel = accessLevel || 'Full';
    // postIds is optional - if not provided, grants access to all client posts

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
          // Set token to expire in 90 days
          var expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 90);
          rowData.push(expirationDate);
          break;
        case 'Post_IDs':
          // Store comma-separated post IDs, or empty for all posts
          rowData.push(postIds || '');
          break;
        case 'Access_URL':
          // Store full access URL for easy reference
          rowData.push(getClientAccessUrl(token));
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
 * Add a specific post to a client's authorized Post_IDs
 * Used when submitting a post for client review
 * @param {string} clientId - Client ID
 * @param {string} email - Client email address
 * @param {string} postId - Post ID to add
 */
function addPostToClientAccess(clientId, email, postId) {
  try {
    Logger.log('Adding post ' + postId + ' to access for: ' + email);

    // Get existing authorized client record
    var authSheet = _getSheet_('Authorized_Clients');
    var data = authSheet.getDataRange().getValues();
    var headers = data[0];

    var clientIdCol = headers.indexOf('Client_ID');
    var emailCol = headers.indexOf('Email');
    var postIdsCol = headers.indexOf('Post_IDs');
    var statusCol = headers.indexOf('Status');

    // Find the authorized client record
    var foundRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][clientIdCol] === clientId &&
          data[i][emailCol] === email &&
          data[i][statusCol] === 'Active') {
        foundRow = i;
        break;
      }
    }

    if (foundRow === -1) {
      // No existing access - grant full access for this client with this specific post
      Logger.log('No existing access found - creating new access record');
      grantClientAccess(clientId, email, 'Full', postId);
      return;
    }

    // Get current Post_IDs
    var currentPostIds = data[foundRow][postIdsCol];
    Logger.log('Current Post_IDs: ' + currentPostIds);

    // If empty, this client has full access to all posts - don't change it
    if (!currentPostIds || currentPostIds.trim() === '') {
      Logger.log('Client has full access (empty Post_IDs) - no change needed');
      return;
    }

    // Parse existing post IDs
    var postIdArray = currentPostIds.split(',').map(function(id) {
      return id.trim();
    });

    // Check if post ID already exists
    if (postIdArray.indexOf(postId) > -1) {
      Logger.log('Post ID already in list - no change needed');
      return;
    }

    // Add new post ID
    postIdArray.push(postId);
    var updatedPostIds = postIdArray.join(', ');

    // Update the sheet
    authSheet.getRange(foundRow + 1, postIdsCol + 1).setValue(updatedPostIds);
    Logger.log('✅ Updated Post_IDs to: ' + updatedPostIds);

  } catch (e) {
    Logger.log('Error adding post to client access: ' + e.message);
    Logger.log(e.stack);
    // Don't throw - we don't want this to break the approval flow
  }
}

/**
 * Get client access URL with token
 * @param {string} token - Access token
 * @returns {string} - Full URL to client portal
 */
function getClientAccessUrl(token) {
  // Use the production deployment URL (not dev URL)
  var scriptUrl = 'https://script.google.com/macros/s/AKfycbwiRbuwQTrj--xfmP7klfZ_TJratdAySuujz3oSZ3-31SgTY0KA5Zsz75BDLBU-sCCV/exec';
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
function getClientPosts(clientId, authorizedClient) {
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

    // Filter by Post_IDs if authorizedClient has specific post restrictions
    if (authorizedClient && authorizedClient.Post_IDs && authorizedClient.Post_IDs.trim() !== '') {
      var allowedPostIds = authorizedClient.Post_IDs.split(',').map(function(id) {
        return id.trim();
      });
      Logger.log('Filtering to specific posts: ' + allowedPostIds.join(', '));

      posts = posts.filter(function(post) {
        return allowedPostIds.indexOf(post.ID) > -1;
      });

      Logger.log('After filtering: ' + posts.length + ' posts');
    }

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

    // Create a map of Post_ID to array of platforms
    var platformsMap = {};
    var platformIndex = headers.indexOf('Platform');

    for (var i = 1; i < platformData.length; i++) {
      var postId = platformData[i][postIdIndex];

      // Initialize array for this post if needed
      if (!platformsMap[postId]) {
        platformsMap[postId] = [];
      }

      var mediaUrl = platformFormulas[i][mediaUrlIndex] || platformData[i][mediaUrlIndex];
      var mediaType = platformData[i][mediaTypeIndex] || '';
      var platform = platformData[i][platformIndex] || '';

      if (mediaUrl) {
        var extractedUrl = extractUrlFromImageFormula(mediaUrl);
        if (extractedUrl) {
          platformsMap[postId].push({
            platform: platform,
            url: extractedUrl,
            mediaType: mediaType,
            isCarousel: String(mediaType).toLowerCase().indexOf('carousel') > -1
          });
        }
      }
    }

    // Attach platform images to posts
    for (var j = 0; j < posts.length; j++) {
      var postId = posts[j].ID;
      if (platformsMap[postId] && platformsMap[postId].length > 0) {
        posts[j].platforms = platformsMap[postId];
        // Keep first image as image_url for backward compatibility
        posts[j].image_url = platformsMap[postId][0].url;
        posts[j].is_carousel = platformsMap[postId][0].isCarousel;
      } else {
        posts[j].platforms = [];
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
