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
    var allowed = { 'Draft':1, 'In Review':1, 'Approved':1, 'Scheduled':1 };

    var posts = _readSheetAsObjects_('Posts', {
      coerceFn: function(p){
        // Example coercions—adapt to your actual headers:
        if (p.Scheduled_Date) p.Scheduled_Date = _toIso_(p.Scheduled_Date);
        if (p.Scheduled_Time && typeof p.Scheduled_Time === 'string') {
          p.Scheduled_Time = p.Scheduled_Time.trim();
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
 * Get post by ID
 */
function getPostById(postId) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Posts');
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return null;
  
  var headers = data[0];
  // Posts sheet uses 'ID' column, not 'Post_ID'
  var postIdIndex = headers.indexOf('ID');
  
  if (postIdIndex === -1) {
    // Try 'Post_ID' as fallback
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