// Client Portal JavaScript
// This file contains all the client-side logic for the client review portal

// IMMEDIATE EXECUTION TEST
console.log('========================================');
console.log('CLIENT PORTAL SCRIPT LOADED!');
console.log('Timestamp:', new Date().toISOString());
console.log('========================================');

// Update debug info immediately when script loads
(function() {
  var urlParams = new URLSearchParams(window.location.search);
  var tokenFromUrl = urlParams.get('token');
  var hasGoogle = typeof google !== 'undefined' && google.script && google.script.run;

  var debugHtml = 'Page timestamp: ' + new Date().toLocaleString() + '<br>' +
                  'Token from URL: ' + (tokenFromUrl || 'NOT FOUND ❌') + '<br>' +
                  'google.script.run: ' + (hasGoogle ? 'AVAILABLE ✅' : 'NOT AVAILABLE ❌') + '<br>' +
                  'Script file loaded: YES ✅';

  // Try to update debug content
  var updateDebug = function() {
    var debugEl = document.getElementById('debugContent');
    if (debugEl) {
      debugEl.innerHTML = debugHtml;
      console.log('✅ Debug info updated in DOM');
    } else {
      console.log('❌ debugContent element not found yet');
    }
  };

  // Try immediately
  updateDebug();

  // Also try on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateDebug);
  }
})();

// Global state
var currentMonth = new Date().getMonth();
var currentYear = new Date().getFullYear();
var allPosts = [];
var filteredPosts = [];
var clientInfo = null;
var currentStatusFilter = 'all';
var token = null;

// Initialize on page load
function initializeClientPortal() {
  console.log('=== INITIALIZING CLIENT PORTAL ===');

  // Get token from URL
  var urlParams = new URLSearchParams(window.location.search);
  token = urlParams.get('token');

  console.log('Token from URL:', token);
  console.log('google.script.run available:', typeof google !== 'undefined' && google.script && google.script.run);

  if (!token) {
    console.error('No token in URL');
    document.getElementById('calendarContainer').innerHTML =
      '<div class="error">Invalid access link. Please use the link provided in your email.</div>';
    return;
  }

  // Check if google.script.run is available
  if (typeof google === 'undefined' || !google.script || !google.script.run) {
    console.error('google.script.run is not available');
    document.getElementById('calendarContainer').innerHTML =
      '<div class="error">Error: Google Apps Script API not available. Please reload the page.</div>';
    return;
  }

  console.log('Loading client data...');
  loadClientData();
}

function loadClientData() {
  console.log('=== loadClientData called ===');
  console.log('Token:', token);
  console.log('Calling google.script.run.validateClientAccess...');

  // Validate token and load posts
  google.script.run
    .withSuccessHandler(function(result) {
      console.log('=== SUCCESS HANDLER called ===');
      console.log('Received result:', result);

      if (result.success) {
        console.log('Token validated successfully');
        clientInfo = result.clientInfo;
        allPosts = result.posts;
        filteredPosts = allPosts;

        console.log('Client:', clientInfo.Client_Name);
        console.log('Posts:', allPosts.length);

        // Update UI with client info
        document.getElementById('clientInfo').textContent = clientInfo.Client_Name;
        document.getElementById('welcomeTitle').textContent = 'Welcome, ' + clientInfo.Client_Name;

        // Render calendar
        renderCalendar();
      } else {
        console.error('Token validation failed:', result.error);
        document.getElementById('calendarContainer').innerHTML =
          '<div class="error">' + (result.error || 'Access denied. Please contact your account manager.') + '</div>';
      }
    })
    .withFailureHandler(function(error) {
      console.error('=== FAILURE HANDLER called ===');
      console.error('Error:', error);
      document.getElementById('calendarContainer').innerHTML =
        '<div class="error">Error loading data: ' + error.message + '</div>';
    })
    .validateClientAccess(token);

  console.log('google.script.run.validateClientAccess call initiated');
}

function filterByStatus(status) {
  currentStatusFilter = status;

  // Update button states
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Filter posts
  if (status === 'all') {
    filteredPosts = allPosts;
  } else {
    filteredPosts = allPosts.filter(function(post) {
      var postStatus = (post.Status || 'Draft').replace(/ /g, '_');
      return postStatus === status;
    });
  }

  renderCalendar();
}

function renderCalendar() {
  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  document.getElementById('currentMonth').textContent = monthNames[currentMonth] + ' ' + currentYear;

  var firstDay = new Date(currentYear, currentMonth, 1);
  var lastDay = new Date(currentYear, currentMonth + 1, 0);
  var startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  var calendarGrid = document.getElementById('calendarGrid');
  calendarGrid.innerHTML = '';

  // Day headers
  var dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayHeaders.forEach(function(day) {
    var header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    calendarGrid.appendChild(header);
  });

  // Calendar days
  var currentDate = new Date(startDate);
  for (var i = 0; i < 42; i++) {
    var dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';

    if (currentDate.getMonth() !== currentMonth) {
      dayCell.classList.add('other-month');
    }

    var dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = currentDate.getDate();
    dayCell.appendChild(dayNumber);

    // Find posts for this day
    var dateStr = currentDate.toISOString().split('T')[0];
    var dayPosts = filteredPosts.filter(function(post) {
      return post.Post_Date && post.Post_Date.split('T')[0] === dateStr;
    });

    // Add posts to day cell
    if (dayPosts.length > 0) {
      var postsContainer = document.createElement('div');
      postsContainer.className = 'day-posts';

      dayPosts.forEach(function(post) {
        var postBadge = document.createElement('div');
        postBadge.className = 'post-badge status-' + (post.Status || 'Draft').toLowerCase().replace(/ /g, '-');
        postBadge.textContent = post.Post_Title || 'Untitled';
        postBadge.title = post.Post_Title + '\n' + (post.Status || 'Draft');
        postsContainer.appendChild(postBadge);
      });

      dayCell.appendChild(postsContainer);
    }

    calendarGrid.appendChild(dayCell);
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

function previousMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

function today() {
  var now = new Date();
  currentMonth = now.getMonth();
  currentYear = now.getFullYear();
  renderCalendar();
}

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeClientPortal);
} else {
  initializeClientPortal();
}
