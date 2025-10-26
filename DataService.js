/****************************************************
 * DataService.gs  —  read-only endpoints for the UI
 * - No getActiveSpreadsheet() calls
 * - Always returns [] or {success:false,error:string}
 * - Safe header → object mapping
 ****************************************************/

// ---- Utility helpers (scoped in this file) ----

/** Get a sheet by name; throws with a helpful message if missing. */
function _getSheet_(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Sheet not found: ' + name);
  return sh;
}

/** Read a whole sheet as array-of-objects using the header row (row 1). */
function _readSheetAsObjects_(sheetName, opts) {
  opts = opts || {};
  var filterFn = opts.filterFn || null;
  var sortFn   = opts.sortFn || null;
  var coerceFn = opts.coerceFn || null;

  var sh   = _getSheet_(sheetName);
  var data = sh.getDataRange().getValues();        // 2D array (includes header)

  if (!data || data.length <= 1) return [];        // header only or empty

  var headers = data[0].map(function(h){ return String(h || '').trim(); });
  var rows    = data.slice(1);

  // Map each row to an object keyed by headers, skipping fully blank rows
  var out = rows.reduce(function(acc, row){
    var isAllBlank = row.every(function(v){ return v === '' || v === null || typeof v === 'undefined'; });
    if (isAllBlank) return acc;

    var obj = {};
    for (var i = 0; i < headers.length; i++) {
      var key = headers[i] || ('Col' + (i+1));
      obj[key] = row[i];
    }
    if (coerceFn) obj = coerceFn(obj) || obj;
    acc.push(obj);
    return acc;
  }, []);

  if (filterFn) out = out.filter(filterFn);
  if (sortFn)   out.sort(sortFn);

  return out;
}

/** Make a standard error payload so client never gets null/undefined. */
function _err_(e, where) {
  var msg = (e && e.message) ? e.message : String(e);
  return { success: false, error: '[' + (where || 'DataService') + '] ' + msg };
}

/** Simple date coercion helper (optional use per endpoint). */
function _toIso_(d) {
  if (Object.prototype.toString.call(d) === '[object Date]' && !isNaN(d)) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  }
  return d;
}


// ---------------- USERS ----------------

function getAllUsers() {
  try {
    var users = _readSheetAsObjects_('Users', {
      filterFn: function(u){ return String(u.Status || '').trim() === 'Active'; }
    });
    return users;
  } catch (e) {
    return _err_(e, 'getAllUsers');
  }
}


// ---------------- CLIENTS ----------------

function getAllClients() {
  try {
    var clients = _readSheetAsObjects_('Clients');
    return clients; // return all; filter on UI if needed
  } catch (e) {
    return _err_(e, 'getAllClients');
  }
}


// ---------------- POSTS ----------------

/*
 * If you want only workflow statuses, keep `allowed` below. Otherwise just `return posts;`
 */
function getAllPosts() {
  try {
    var allowed = {
      'Draft':1,
      'In Review':1,
      'Internal_Review':1,
      'Client_Review':1,
      'Approved':1,
      'Scheduled':1,
      'Published':1
    };

    var posts = _readSheetAsObjects_('Posts', {
      coerceFn: function(p){
        // Convert ALL date fields to ISO strings
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
      },
      filterFn: function(p){
        var status = String(p.Status || '').trim();
        return allowed[status] ? true : false;
      }
    });

    return posts;
  } catch (e) {
    return _err_(e, 'getAllPosts');
  }
}
/**
 * Internal helper: Get post by ID (returns plain object for internal use)
 * Used by ApprovalService and other backend functions
 */
function _getPostByIdSimple(postId) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Posts');
  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) return null;

  var headers = data[0];
  var postIdIndex = headers.indexOf('ID');

  if (postIdIndex === -1) {
    postIdIndex = headers.indexOf('Post_ID');
    if (postIdIndex === -1) return null;
  }

  for (var i = 1; i < data.length; i++) {
    if (data[i][postIdIndex] === postId) {
      var post = {};
      headers.forEach(function(header, index) {
        post[header] = data[i][index];
      });
      return post;
    }
  }

  return null;
}

/**
 * Get client by ID
 */
function getClientById(clientId) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Clients');
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return null;
  
  var headers = data[0];
  // Clients sheet uses 'ID' column
  var clientIdIndex = headers.indexOf('ID');
  
  if (clientIdIndex === -1) {
    // Try 'Client_ID' as fallback
    clientIdIndex = headers.indexOf('Client_ID');
    if (clientIdIndex === -1) return null;
  }
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][clientIdIndex] === clientId) {
      var client = {};
      headers.forEach(function(header, index) {
        client[header] = data[i][index];
      });
      return client;
    }
  }
  
  return null;
}

/**
 * Update post status
 */
function updatePostStatus(postId, newStatus) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Posts');
  var data = sheet.getDataRange().getValues();
  
  // Find the post row
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === postId) { // Column A is ID
      var statusColIndex = data[0].indexOf('Status');
      var modifiedByColIndex = data[0].indexOf('Modified_By');
      var modifiedDateColIndex = data[0].indexOf('Modified_Date');
      
      // Update status
      sheet.getRange(i + 1, statusColIndex + 1).setValue(newStatus);
      
      // Update modified info
      var currentUser = Session.getActiveUser().getEmail();
      sheet.getRange(i + 1, modifiedByColIndex + 1).setValue(currentUser);
      sheet.getRange(i + 1, modifiedDateColIndex + 1).setValue(new Date().toLocaleDateString());
      
      return {success: true, message: 'Status updated to ' + newStatus};
    }
  }
  
  return {success: false, error: 'Post not found'};
}

// --------- CONTENT CATEGORIES (reference) ---------

function getAllContentCategories() {
  try {
    var cats = _readSheetAsObjects_('Content_Categories', {
      filterFn: function(c){ return String(c.Status || '').trim() === 'Active'; },
      sortFn:   function(a, b){ return (a.Sort_Order || 0) - (b.Sort_Order || 0); }
    });
    return cats;
  } catch (e) {
    return _err_(e, 'getAllContentCategories');
  }
}


// -------------- PLATFORMS (reference) --------------

function getAllPlatforms() {
  try {
    var platforms = _readSheetAsObjects_('Platforms', {
      filterFn: function(p){ return String(p.Status || '').trim() === 'Active'; },
      sortFn:   function(a, b){ return (a.Sort_Order || 0) - (b.Sort_Order || 0); }
    });
    return platforms;
  } catch (e) {
    return _err_(e, 'getAllPlatforms');
  }
}


// --------------- OPTIONAL EXTRAS ----------------

/** Quick health check: confirms sheets exist and returns row counts (excl. header). */
function listSheetsAndCounts() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var names = ['Users','Clients','Posts','Content_Categories','Platforms']; // add more if needed
    var report = names.map(function(n){
      var sh = ss.getSheetByName(n);
      if (!sh) return { sheet: n, exists: false, rows: 0 };
      var rows = Math.max(0, sh.getLastRow() - 1);
      return { sheet: n, exists: true, rows: rows };
    });
    return report;
  } catch (e) {
    return _err_(e, 'listSheetsAndCounts');
  }
}

/** Transport sanity check from UI. */
function ping() {
  return 'pong ' + new Date().toISOString();
}

// ---------------- POST IMAGES ----------------

/**
 * Get all posts with their first platform image
 * Extracts image URL from =IMAGE() formulas in Post_Platforms sheet
 */
function getAllPostsWithImages() {
  try {
    // Get all posts
    var posts = getAllPosts();
    Logger.log('getAllPostsWithImages: getAllPosts() returned: ' + JSON.stringify(posts));

    // Check if error
    if (posts && posts.success === false) {
      return posts; // Return error
    }

    if (!posts || posts.length === 0) {
      Logger.log('getAllPostsWithImages: No posts found, returning empty array');
      return [];
    }

    // Get Post_Platforms data
    var platformSheet = _getSheet_('Post_Platforms');
    var dataRange = platformSheet.getDataRange();
    var platformData = dataRange.getValues();
    var platformFormulas = dataRange.getFormulas(); // Get formulas instead of values

    if (platformData.length <= 1) return posts; // No platform data

    var headers = platformData[0];
    var postIdIndex = headers.indexOf('Post_ID');
    var mediaUrlIndex = headers.indexOf('Media_File_URL');
    var mediaTypeIndex = headers.indexOf('Media_Type');

    if (postIdIndex === -1 || mediaUrlIndex === -1) return posts;

    // Create a map of Post_ID to first image
    var imageMap = {};

    for (var i = 1; i < platformData.length; i++) {
      var postId = platformData[i][postIdIndex];

      // Try to get the formula first, fall back to value
      var mediaUrl = platformFormulas[i][mediaUrlIndex] || platformData[i][mediaUrlIndex];
      var mediaType = platformData[i][mediaTypeIndex] || '';

      // Skip if already have an image for this post
      if (imageMap[postId]) continue;

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

    // Attach images to posts and ensure all dates are serialized
    for (var j = 0; j < posts.length; j++) {
      var postId = posts[j].ID;
      if (imageMap[postId]) {
        posts[j].image_url = imageMap[postId].url;
        posts[j].is_carousel = imageMap[postId].isCarousel;
      } else {
        posts[j].image_url = '';
        posts[j].is_carousel = false;
      }

      // Ensure ALL date fields are converted to strings
      for (var key in posts[j]) {
        if (posts[j].hasOwnProperty(key)) {
          var value = posts[j][key];
          if (Object.prototype.toString.call(value) === '[object Date]') {
            posts[j][key] = _toIso_(value);
          }
        }
      }
    }

    Logger.log('getAllPostsWithImages: Returning ' + posts.length + ' posts');
    return posts;

  } catch (e) {
    return _err_(e, 'getAllPostsWithImages');
  }
}

/**
 * Extract URL from =IMAGE("url", ...) formula or return the URL if it's plain text
 * Converts Box.com share links to direct download links
 */
function extractUrlFromImageFormula(cellValue) {
  if (!cellValue) return null;

  var value = String(cellValue);
  var url = null;

  // Check if it's a formula with =IMAGE(
  if (value.indexOf('=IMAGE(') === 0 || value.indexOf('=IMAGE("') > -1) {
    // Extract URL from formula: =IMAGE("https://...", 4, 100, 100)
    var matches = value.match(/["']([^"']+)["']/);
    if (matches && matches[1]) {
      url = matches[1];
    }
  }
  // If it looks like a URL, use it directly
  else if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) {
    url = value;
  }

  // Convert Box.com share links to direct download links
  if (url && url.indexOf('box.com/s/') > -1) {
    // Convert: https://finnpartners.box.com/s/xxxxx
    // To: https://finnpartners.box.com/shared/static/xxxxx
    url = url.replace('/s/', '/shared/static/');
  }

  return url;
}

/**
 * Debug function - test what's in Post_Platforms
 * Run this from Apps Script editor to see what we're getting
 */
function debugPostPlatforms() {
  var platformSheet = _getSheet_('Post_Platforms');
  var platformData = platformSheet.getDataRange().getValues();

  var headers = platformData[0];
  Logger.log('Headers: ' + JSON.stringify(headers));

  var postIdIndex = headers.indexOf('Post_ID');
  var mediaUrlIndex = headers.indexOf('Media_File_URL');
  var mediaTypeIndex = headers.indexOf('Media_Type');

  Logger.log('Post_ID index: ' + postIdIndex);
  Logger.log('Media_File_URL index: ' + mediaUrlIndex);
  Logger.log('Media_Type index: ' + mediaTypeIndex);

  // Show first 3 data rows
  for (var i = 1; i < Math.min(4, platformData.length); i++) {
    Logger.log('\nRow ' + i + ':');
    Logger.log('  Post_ID: ' + platformData[i][postIdIndex]);
    Logger.log('  Media_File_URL raw: ' + platformData[i][mediaUrlIndex]);
    Logger.log('  Media_Type: ' + platformData[i][mediaTypeIndex]);

    var extracted = extractUrlFromImageFormula(platformData[i][mediaUrlIndex]);
    Logger.log('  Extracted URL: ' + extracted);
  }

  return 'Check execution logs';
}

/**
 * Get a single post with all its details
 * @param {string} postId - The post ID (e.g., 'POST-001')
 * @returns {Object} - Post object with platforms, categories, client info, etc.
 */
function getPostById(postId) {
  try {
    Logger.log('getPostById called with postId: ' + postId);

    // Get the post
    var posts = _readSheetAsObjects_('Posts', {
      filterFn: function(p) { return p.ID === postId; },
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

    Logger.log('Found ' + (posts ? posts.length : 0) + ' posts');

    if (!posts || posts.length === 0) {
      return { success: false, error: 'Post not found' };
    }

    var post = posts[0];
    Logger.log('Post found: ' + post.ID);

    // Get platforms for this post
    var platforms = _readSheetAsObjects_('Post_Platforms', {
      filterFn: function(pp) { return pp.Post_ID === postId; }
    });
    Logger.log('Found ' + platforms.length + ' platforms for post');

    // Get platform sheet to extract images
    try {
      var platformSheet = _getSheet_('Post_Platforms');
      var dataRange = platformSheet.getDataRange();
      var platformData = dataRange.getValues();
      var platformFormulas = dataRange.getFormulas();

      var headers = platformData[0];
      var postIdIndex = headers.indexOf('Post_ID');
      var mediaUrlIndex = headers.indexOf('Media_File_URL');

      // Attach media URLs to platforms
      for (var i = 0; i < platforms.length; i++) {
        // Find matching row in sheet
        for (var j = 1; j < platformData.length; j++) {
          if (platformData[j][postIdIndex] === platforms[i].Post_ID &&
              platformData[j][headers.indexOf('Platform_ID')] === platforms[i].Platform_ID) {
            var mediaUrl = platformFormulas[j][mediaUrlIndex] || platformData[j][mediaUrlIndex];
            platforms[i].Media_File_URL_Extracted = extractUrlFromImageFormula(mediaUrl);
            break;
          }
        }
      }
    } catch (platformError) {
      Logger.log('Error extracting platform media: ' + platformError.message);
      // Continue without media URLs
    }

    // Get platform names
    try {
      var allPlatforms = _readSheetAsObjects_('Platforms');
      Logger.log('Loaded ' + allPlatforms.length + ' total platforms');

      // Log all platform IDs in the sheet for debugging
      var platformIds = allPlatforms.map(function(p) { return p.ID + ':' + p.Platform_Name; }).join(', ');
      Logger.log('Available platforms: ' + platformIds);

      for (var i = 0; i < platforms.length; i++) {
        // Handle both 'Platform' and 'Platform_ID' column names
        var platformId = platforms[i].Platform_ID || platforms[i].Platform;
        Logger.log('Looking for platform value: "' + platformId + '" (type: ' + typeof platformId + ')');

        // Manual find since .find() might not work in older V8
        var platformInfo = null;
        for (var j = 0; j < allPlatforms.length; j++) {
          var sheetId = allPlatforms[j].ID;
          var sheetName = allPlatforms[j].Platform_Name;

          // Try to match by ID first, then by name (in case sheet stores name instead of ID)
          var matchById = (sheetId === platformId);
          var matchByName = (sheetName === platformId);

          Logger.log('Comparing: ID="' + sheetId + '" Name="' + sheetName + '" === "' + platformId + '" ? ID match: ' + matchById + ', Name match: ' + matchByName);

          if (matchById || matchByName) {
            platformInfo = allPlatforms[j];
            break;
          }
        }

        if (platformInfo) {
          platforms[i].Platform_Name = platformInfo.Platform_Name;
          platforms[i].Platform_ID = platformInfo.ID; // Also store the ID
          Logger.log('Found platform: ' + platformInfo.Platform_Name + ' (ID: ' + platformInfo.ID + ')');
        } else {
          Logger.log('Platform not found for value: ' + platformId);
          // If no match, just use the value as the name
          platforms[i].Platform_Name = platformId;
        }
      }
      Logger.log('Platform names attached');
    } catch (platformNameError) {
      Logger.log('Error loading platform names: ' + platformNameError.message);
    }

    post.platforms = platforms;

    // Get client info
    try {
      if (post.Client_ID) {
        var clients = _readSheetAsObjects_('Clients', {
          filterFn: function(c) { return c.ID === post.Client_ID; }
        });
        post.client = clients.length > 0 ? clients[0] : null;
        Logger.log('Client loaded: ' + (post.client ? post.client.Client_Name : 'none'));
      }
    } catch (clientError) {
      Logger.log('Error loading client: ' + clientError.message);
      post.client = null;
    }

    // Get subsidiaries info
    try {
      if (post.Subsidiary_IDs) {
        var subIds = String(post.Subsidiary_IDs).split(',').map(function(id) { return id.trim(); });
        var subsidiaries = _readSheetAsObjects_('Subsidiaries', {
          filterFn: function(s) { return subIds.indexOf(s.ID) > -1; }
        });
        post.subsidiaries = subsidiaries;
        Logger.log('Subsidiaries loaded: ' + subsidiaries.length);
      }
    } catch (subError) {
      Logger.log('Error loading subsidiaries: ' + subError.message);
      post.subsidiaries = [];
    }

    // Get category info
    try {
      if (post.Content_Category || post.Content_Category_ID) {
        var catIds = String(post.Content_Category || post.Content_Category_ID).split(',').map(function(id) { return id.trim(); });
        var categories = _readSheetAsObjects_('Content_Categories', {
          filterFn: function(c) { return catIds.indexOf(c.ID) > -1; }
        });
        post.categories = categories;
        Logger.log('Categories loaded: ' + categories.length);
      }
    } catch (catError) {
      Logger.log('Error loading categories: ' + catError.message);
      post.categories = [];
    }

    // Final pass: convert ALL remaining date objects to strings
    // This ensures nested objects (client, subsidiaries, categories, platforms) are serializable
    var finalPost = JSON.parse(JSON.stringify(post, function(key, value) {
      if (Object.prototype.toString.call(value) === '[object Date]') {
        return _toIso_(value);
      }
      return value;
    }));

    Logger.log('Returning post data successfully');
    return { success: true, post: finalPost };

  } catch (e) {
    Logger.log('ERROR in getPostById: ' + e.message);
    Logger.log('Stack trace: ' + e.stack);
    return _err_(e, 'getPostById');
  }
}

// ---------------- COMMENTS ----------------

/**
 * Add a comment to a post
 * @param {string} postId - The post ID
 * @param {string} commentText - The comment text
 * @param {string} commentType - The comment type (optional, defaults to 'Internal_Note')
 * @returns {Object} - {success: true} or error
 */
function addCommentToPost(postId, commentText, commentType) {
  try {
    Logger.log('Adding comment to post: ' + postId);
    Logger.log('Comment type: ' + (commentType || 'Internal_Note'));

    var currentUser = Session.getActiveUser().getEmail();
    var timestamp = new Date();

    // Generate comment ID
    var commentId = generateId('CMT');

    // Get Comments sheet
    var commentsSheet = _getSheet_('Comments');
    var headers = commentsSheet.getRange(1, 1, 1, commentsSheet.getLastColumn()).getValues()[0];
    Logger.log('Comments sheet headers: ' + JSON.stringify(headers));

    // Prepare row data
    var rowData = [];
    headers.forEach(function(header) {
      switch(header) {
        case 'ID':
          rowData.push(commentId);
          break;
        case 'Post_ID':
          rowData.push(postId);
          break;
        case 'Comment_Text':
          rowData.push(commentText);
          break;
        case 'Commenter_Email':
          rowData.push(currentUser);
          break;
        case 'Commenter_Name':
          rowData.push(currentUser); // Could be enhanced to look up actual name
          break;
        case 'Comment_Date':
          rowData.push(timestamp);
          break;
        case 'Comment_Type':
          rowData.push(commentType || 'Internal_Note');
          break;
        case 'Status':
          rowData.push('Active');
          break;
        case 'Resolved_Date':
        case 'Resolved_By':
          rowData.push(''); // Empty for new comments
          break;
        default:
          rowData.push('');
      }
    });

    // Append to Comments sheet
    Logger.log('Row data to append: ' + JSON.stringify(rowData));
    commentsSheet.appendRow(rowData);
    Logger.log('Row appended to sheet at row: ' + commentsSheet.getLastRow());

    Logger.log('Comment added successfully: ' + commentId);
    return { success: true, commentId: commentId, message: 'Comment added successfully' };

  } catch (e) {
    Logger.log('ERROR adding comment: ' + e.message);
    return _err_(e, 'addCommentToPost');
  }
}

/**
 * Get all comments for a post
 * @param {string} postId - The post ID
 * @returns {Array} - Array of comment objects
 */
function getCommentsForPost(postId) {
  try {
    var comments = _readSheetAsObjects_('Comments', {
      filterFn: function(c) {
        return c.Post_ID === postId && String(c.Status || '').trim() === 'Active';
      },
      sortFn: function(a, b) {
        var dateA = a.Comment_Date ? new Date(a.Comment_Date) : new Date(0);
        var dateB = b.Comment_Date ? new Date(b.Comment_Date) : new Date(0);
        return dateB - dateA; // Most recent first
      },
      coerceFn: function(c) {
        // Convert date to ISO string
        if (c.Comment_Date && Object.prototype.toString.call(c.Comment_Date) === '[object Date]') {
          c.Comment_Date = _toIso_(c.Comment_Date);
        }
        return c;
      }
    });

    return comments;
  } catch (e) {
    Logger.log('Error getting comments: ' + e.message);
    return [];
  }
}

// ---------------- FORM OPTIONS ----------------

/**
 * Get all form options needed for post creation
 * Returns clients, platforms, categories, campaigns, and users
 */
function getFormOptions() {
  try {
    return {
      success: true,
      clients: getAllClients(),
      platforms: getAllPlatforms(),
      categories: getAllContentCategories(),
      users: getAllUsers()
    };
  } catch (e) {
    return _err_(e, 'getFormOptions');
  }
}

/**
 * Get subsidiaries for a specific client
 */
function getClientSubsidiaries(clientId) {
  try {
    var subsidiaries = _readSheetAsObjects_('Subsidiaries', {
      filterFn: function(s) {
        return s.Client_ID === clientId && String(s.Status || '').trim() === 'Active';
      }
    });
    return subsidiaries;
  } catch (e) {
    return _err_(e, 'getClientSubsidiaries');
  }
}

// ---------------- POST CREATION ----------------

/**
 * Create a new post from UI form data
 * @param {Object} postData - Form data object
 * @returns {Object} - {success: true, postId: 'POST-XXX'} or error
 */
function createPostFromUI(postData) {
  try {
    // Debug logging
    Logger.log('========== createPostFromUI called ==========');
    Logger.log('postData.categoryId: ' + postData.categoryId);
    Logger.log('postData.subsidiaryIds: ' + postData.subsidiaryIds);
    Logger.log('Full postData: ' + JSON.stringify(postData));

    var currentUser = Session.getActiveUser().getEmail();
    var timestamp = new Date();

    // Generate new post ID
    var postId = generateId('POST');

    // Get Posts sheet
    var postsSheet = _getSheet_('Posts');
    var headers = postsSheet.getRange(1, 1, 1, postsSheet.getLastColumn()).getValues()[0];

    // Debug: Log headers to see exact column names
    Logger.log('Posts sheet headers: ' + JSON.stringify(headers));

    // Prepare row data matching sheet structure
    var rowData = [];
    headers.forEach(function(header) {
      switch(header) {
        case 'ID':
          rowData.push(postId);
          break;
        case 'Client_ID':
          rowData.push(postData.clientId || '');
          break;
        case 'Subsidiary_IDs':
          Logger.log('Setting Subsidiary_IDs to: ' + (postData.subsidiaryIds || ''));
          rowData.push(postData.subsidiaryIds || '');
          break;
        case 'Post_Title':
          rowData.push(postData.title || '');
          break;
        case 'Post_Copy':
          rowData.push(postData.copy || '');
          break;
        case 'Scheduled_Date':
          // Parse date without timezone conversion
          if (postData.scheduledDate) {
            var dateParts = postData.scheduledDate.split('-'); // Format: YYYY-MM-DD
            if (dateParts.length === 3) {
              // Create date at noon to avoid timezone shift issues
              rowData.push(new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0));
            } else {
              rowData.push(new Date(postData.scheduledDate));
            }
          } else {
            rowData.push('');
          }
          break;
        case 'Scheduled_Time':
          rowData.push(postData.scheduledTime || '');
          break;
        case 'Content_Category_ID':
          Logger.log('Setting Content_Category_ID to: ' + (postData.categoryId || ''));
          rowData.push(postData.categoryId || '');
          break;
        case 'Content_Category':
          Logger.log('Setting Content_Category to: ' + (postData.categoryId || ''));
          rowData.push(postData.categoryId || '');
          break;
        case 'Campaign_ID':
          rowData.push(postData.campaignId || '');
          break;
        case 'Hashtags':
          rowData.push(postData.hashtags || '');
          break;
        case 'Link_URL':
          rowData.push(postData.linkUrl || '');
          break;
        case 'Notes':
          rowData.push(postData.notes || '');
          break;
        case 'Status':
          // Use explicit status if provided, otherwise use submitForReview flag
          if (postData.status) {
            rowData.push(postData.status);
          } else {
            rowData.push(postData.submitForReview ? 'Internal_Review' : 'Draft');
          }
          break;
        case 'Created_By':
          rowData.push(currentUser);
          break;
        case 'Created_Date':
          rowData.push(timestamp);
          break;
        case 'Modified_By':
          rowData.push(currentUser);
          break;
        case 'Modified_Date':
          rowData.push(timestamp);
          break;
        case 'Internal_Approvers':
          rowData.push(postData.internalApprovers || '');
          break;
        case 'Client_Approvers':
          rowData.push(postData.clientApprovers || '');
          break;
        default:
          rowData.push('');
      }
    });

    // Append to Posts sheet
    postsSheet.appendRow(rowData);

    // Create platform entries if platforms provided
    if (postData.platforms && postData.platforms.length > 0) {
      var platformResult = createPostPlatforms(postId, postData.platforms);
      if (!platformResult.success) {
        return platformResult;
      }
    }

    // If submitting for review, create approval records
    if (postData.submitForReview && postData.internalApprovers) {
      submitForInternalReview(postId);
    }

    return {
      success: true,
      postId: postId,
      message: 'Post created successfully'
    };

  } catch (e) {
    return _err_(e, 'createPostFromUI');
  }
}

/**
 * Update an existing post
 * @param {string} postId - The post ID to update
 * @param {Object} postData - Updated form data object
 * @returns {Object} - {success: true} or error
 */
function updatePostFromUI(postId, postData) {
  try {
    Logger.log('========== updatePostFromUI called ==========');
    Logger.log('Updating post: ' + postId);
    Logger.log('Full postData: ' + JSON.stringify(postData));

    var currentUser = Session.getActiveUser().getEmail();
    var timestamp = new Date();

    // NOTE: We save category IDs (not names) to match the create function behavior

    // Get Posts sheet
    var postsSheet = _getSheet_('Posts');
    var data = postsSheet.getDataRange().getValues();
    var headers = data[0];

    // Find the post row
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === postId) { // Column A is ID
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Post not found: ' + postId };
    }

    Logger.log('Found post at row: ' + (rowIndex + 1));

    // Update each column
    for (var col = 0; col < headers.length; col++) {
      var header = headers[col];
      var cellValue = null;

      switch(header) {
        case 'ID':
          // Don't update ID
          continue;
        case 'Client_ID':
          cellValue = postData.clientId || '';
          break;
        case 'Subsidiary_IDs':
          cellValue = postData.subsidiaryIds || '';
          break;
        case 'Post_Title':
          cellValue = postData.title || '';
          break;
        case 'Post_Copy':
          cellValue = postData.copy || '';
          break;
        case 'Scheduled_Date':
          // Parse date without timezone conversion
          if (postData.scheduledDate) {
            var dateParts = postData.scheduledDate.split('-'); // Format: YYYY-MM-DD
            if (dateParts.length === 3) {
              // Create date at noon to avoid timezone shift issues
              cellValue = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0);
            } else {
              cellValue = new Date(postData.scheduledDate);
            }
          } else {
            cellValue = '';
          }
          break;
        case 'Scheduled_Time':
          cellValue = postData.scheduledTime || '';
          break;
        case 'Content_Category_ID':
          cellValue = postData.categoryId || '';
          break;
        case 'Content_Category':
          cellValue = postData.categoryId || '';  // Save IDs, not names (matches create behavior)
          break;
        case 'Campaign_ID':
          cellValue = postData.campaignId || '';
          break;
        case 'Hashtags':
          cellValue = postData.hashtags || '';
          break;
        case 'Link_URL':
          cellValue = postData.linkUrl || '';
          break;
        case 'Notes':
          cellValue = postData.notes || '';
          break;
        case 'Status':
          // Use explicit status if provided, otherwise use submitForReview flag
          if (postData.status) {
            cellValue = postData.status;
          } else if (postData.submitForReview !== undefined) {
            cellValue = postData.submitForReview ? 'Internal_Review' : 'Draft';
          } else {
            continue; // Keep existing status
          }
          break;
        case 'Created_By':
        case 'Created_Date':
          // Don't update creation fields
          continue;
        case 'Modified_By':
          cellValue = currentUser;
          break;
        case 'Modified_Date':
          cellValue = timestamp;
          break;
        case 'Internal_Approvers':
          cellValue = postData.internalApprovers || '';
          break;
        case 'Client_Approvers':
          cellValue = postData.clientApprovers || '';
          break;
        default:
          // Keep existing value for unknown columns
          continue;
      }

      if (cellValue !== null) {
        postsSheet.getRange(rowIndex + 1, col + 1).setValue(cellValue);
      }
    }

    // Delete existing platform entries for this post
    deletePostPlatforms(postId);

    // Create new platform entries if platforms provided
    if (postData.platforms && postData.platforms.length > 0) {
      var platformResult = createPostPlatforms(postId, postData.platforms);
      if (platformResult.success === false) {
        return platformResult;
      }
    }

    Logger.log('Post updated successfully');

    return {
      success: true,
      postId: postId,
      message: 'Post updated successfully'
    };

  } catch (e) {
    Logger.log('ERROR updating post: ' + e.message);
    return _err_(e, 'updatePostFromUI');
  }
}

/**
 * Delete all platform entries for a post
 * @param {string} postId - The post ID
 */
function deletePostPlatforms(postId) {
  try {
    var platformSheet = _getSheet_('Post_Platforms');
    var data = platformSheet.getDataRange().getValues();
    var headers = data[0];
    var postIdIndex = headers.indexOf('Post_ID');

    // Find and delete rows from bottom to top (to avoid index shifting)
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][postIdIndex] === postId) {
        platformSheet.deleteRow(i + 1);
      }
    }

    Logger.log('Deleted platform entries for post: ' + postId);
  } catch (e) {
    Logger.log('Error deleting platforms: ' + e.message);
    throw e;
  }
}

/**
 * Create platform-specific entries for a post
 * @param {string} postId - The post ID
 * @param {Array} platforms - Array of platform objects with {platformId, mediaUrl, mediaType}
 * @returns {Object} - Success or error
 */
function createPostPlatforms(postId, platforms) {
  try {
    var platformSheet = _getSheet_('Post_Platforms');
    var headers = platformSheet.getRange(1, 1, 1, platformSheet.getLastColumn()).getValues()[0];

    platforms.forEach(function(platform) {
      var platformId = generateId('PP');
      var rowData = [];

      headers.forEach(function(header) {
        switch(header) {
          case 'ID':
            rowData.push(platformId);
            break;
          case 'Post_ID':
            rowData.push(postId);
            break;
          case 'Platform':
            rowData.push(platform.platformName || '');
            break;
          case 'Media_File_URL':
            rowData.push(platform.mediaUrl || '');
            break;
          case 'Media_Type':
            rowData.push(platform.mediaType || 'Image');
            break;
          case 'Platform_Specific_Copy':
            rowData.push(platform.platformCopy || '');
            break;
          case 'Platform_Specific_Hashtags':
            rowData.push(platform.platformHashtags || '');
            break;
          case 'Status':
            rowData.push('Active');
            break;
          case 'Created_Date':
            rowData.push(new Date());
            break;
          default:
            rowData.push('');
        }
      });

      platformSheet.appendRow(rowData);
    });

    return {
      success: true,
      message: 'Platform entries created'
    };

  } catch (e) {
    return _err_(e, 'createPostPlatforms');
  }
}