/**
 * Social Media Planner - Approval Service
 * ApprovalService.gs
 * 
 * Handles approval workflow for posts
 */

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * Submit post for internal review
 * Creates approval records for internal approvers
 */
function submitForInternalReview(postId) {
  var post = _getPostByIdSimple(postId);
  if (!post) {
    return {success: false, error: 'Post not found'};
  }

  // Get client to find internal approvers
  var client = getClientById(post.Client_ID);
  if (!client) {
    return {success: false, error: 'Client not found'};
  }

  // Update post status to Internal_Review
  updatePostStatus(postId, 'Internal_Review');

  // Parse internal approver emails
  // Get internal approvers from the post (if specified), otherwise fall back to client settings
var approvers;
if (post.Internal_Approvers && post.Internal_Approvers.trim() !== '') {
  approvers = parseIds(post.Internal_Approvers);
} else {
  // Fallback to client-level approvers
  approvers = parseIds(client.Internal_Approver_Emails);
}
  
  if (approvers.length === 0) {
    return {success: false, error: 'No internal approvers configured for this client'};
  }
  
  // Create approval records for each internal approver
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Approvals');
  var timestamp = new Date();
  
  approvers.forEach(function(approverEmail) {
    var approverName = getUserFullName(approverEmail) || approverEmail;
    var newId = generateId('APR');
    
    sheet.appendRow([
      newId,                    // ID
      postId,                   // Post_ID
      'Internal',               // Approval_Stage
      approverEmail,            // Approver_Email
      approverName,             // Approver_Name
      'Pending',                // Approval_Status
      '',                       // Decision_Date
      '',                       // Decision_Notes
      timestamp,                // Email_Sent_Date
      timestamp                 // Created_Date
    ]);

    // Send email notification
    Logger.log('Sending approval request email to: ' + approverEmail);
    var emailResult = sendApprovalRequestEmail(postId, approverEmail, 'Internal');
    if (emailResult && !emailResult.success) {
      Logger.log('⚠️ WARNING: Failed to send email to ' + approverEmail + ': ' + emailResult.error);
    }

    // Create in-app notification
    try {
      notifyApprovalRequest(approverEmail, post.Post_Title, postId, 'Internal');
    } catch (notifError) {
      Logger.log('⚠️ WARNING: Failed to create notification: ' + notifError.message);
    }
  });

  logAction('Post submitted for internal review', {postId: postId});

  return {
    success: true,
    message: 'Post submitted for internal review',
    approverCount: approvers.length
  };
}

/**
 * Submit post for client review
 * Creates approval records for client approvers
 * @param {string} postId - Post ID
 * @param {boolean} skipInternal - Optional flag to skip internal approval validation
 */
function submitForClientReview(postId, skipInternal) {
  var post = _getPostByIdSimple(postId);
  if (!post) {
    return {success: false, error: 'Post not found'};
  }

  // Check if internal approvals are complete (unless explicitly skipping)
  if (!skipInternal) {
    var internalApprovals = getPostApprovals(postId, 'Internal');

    // Allow submitting to client review if:
    // 1. No internal approval records exist yet (never submitted for internal review), OR
    // 2. All internal approvals are approved
    // 3. Post status is Draft or Internal_Review (allowing bypass of pending internal approvals)
    var hasInternalApprovals = internalApprovals && internalApprovals.length > 0;
    var allInternalApproved = !hasInternalApprovals || internalApprovals.every(function(approval) {
      return approval.Approval_Status === 'Approved';
    });
    var canBypass = post.Status === 'Draft' || post.Status === 'Internal_Review';

    // Only enforce internal approval completion if:
    // - Internal approval records exist (meaning post was submitted for internal review)
    // - AND not all are approved
    // - AND post is not in a status that allows bypassing (Draft or Internal_Review)
    if (hasInternalApprovals && !allInternalApproved && !canBypass) {
      return {success: false, error: 'Internal approvals must be completed first.'};
    }
  }
  
  // Get client to find client approvers
  var client = getClientById(post.Client_ID);
  if (!client) {
    return {success: false, error: 'Client not found'};
  }

  // Update post status to Client_Review
  updatePostStatus(postId, 'Client_Review');

  // Parse client approver emails
// Get client approvers from the post (if specified), otherwise fall back to client settings
var approvers;
if (post.Client_Approvers && post.Client_Approvers.trim() !== '') {
  approvers = parseIds(post.Client_Approvers);
} else {
  // Fallback to client-level approvers
  approvers = parseIds(client.Client_Approver_Emails);
}

  if (approvers.length === 0) {
    return {success: false, error: 'No client approvers configured'};
  }

  Logger.log('STEP 2: Creating approval records for ' + approvers.length + ' approvers');

  // Create approval records for client approvers
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Approvals');
  var timestamp = new Date();

  var approverIndex = 0;
  approvers.forEach(function(approverEmail) {
    approverIndex++;
    Logger.log('STEP 2.' + approverIndex + ': Processing approver: ' + approverEmail);

    try {
      var newId = generateId('APR');
      Logger.log('  Generated ID: ' + newId);

      var rowData = [
        newId,                    // ID
        postId,                   // Post_ID
        'Client',                 // Approval_Stage
        approverEmail,            // Approver_Email
        approverEmail,            // Approver_Name (we don't have their name)
        'Pending',                // Approval_Status
        '',                       // Decision_Date
        '',                       // Decision_Notes
        timestamp,                // Email_Sent_Date
        timestamp                 // Created_Date
      ];

      Logger.log('  Row data length: ' + rowData.length + ' values');
      Logger.log('  Attempting sheet.appendRow()...');

      sheet.appendRow(rowData);

      Logger.log('✅ STEP 2.' + approverIndex + ' COMPLETE: Approval record created');

    } catch (appendError) {
      Logger.log('❌ ERROR IN STEP 2.' + approverIndex + ' (sheet.appendRow):');
      Logger.log('  Error message: ' + appendError.message);
      Logger.log('  Stack trace: ' + appendError.stack);
      Logger.log('  Approver email: ' + approverEmail);
      Logger.log('  Generated ID: ' + newId);
      throw appendError; // Re-throw to be caught by outer try-catch
    }

    // Grant client portal access to this post
    Logger.log('STEP 2.' + approverIndex + 'b: Granting portal access to: ' + approverEmail);
    try {
      addPostToClientAccess(post.Client_ID, approverEmail, postId);
      Logger.log('✅ Portal access granted');
    } catch (accessError) {
      Logger.log('⚠️ WARNING: Failed to grant portal access: ' + accessError.message);
      // Don't fail the entire operation if portal access fails
    }

    // Send email notification
    Logger.log('Sending client approval request email to: ' + approverEmail);
    var emailResult = sendApprovalRequestEmail(postId, approverEmail, 'Client');
    if (emailResult && !emailResult.success) {
      Logger.log('⚠️ WARNING: Failed to send email to ' + approverEmail + ': ' + emailResult.error);
    }

    // Create in-app notification (for internal users, clients get email only)
    try {
      // Only notify if approver is an internal user (has @finnpartners.com email)
      if (approverEmail.indexOf('@finnpartners.com') > -1) {
        notifyApprovalRequest(approverEmail, post.Post_Title, postId, 'Client');
      }
    } catch (notifError) {
      Logger.log('⚠️ WARNING: Failed to create notification: ' + notifError.message);
    }
  });

  logAction('Post submitted for client review', {postId: postId});

  return {
    success: true,
    message: 'Post submitted for client review',
    approverCount: approvers.length
  };
}

/**
 * Record approval decision
 */
function recordApprovalDecision(approvalId, decision, notes, approverEmail) {
  Logger.log('=== RECORD APPROVAL DECISION ===');
  Logger.log('Approval ID: ' + approvalId);
  Logger.log('Decision: ' + decision);
  Logger.log('Notes: ' + notes);
  Logger.log('Approver Email: ' + approverEmail);

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Approvals');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === approvalId) {
      Logger.log('Found approval record at row ' + (i + 1));

      var statusCol = getColumnIndexByName(headers, 'Approval_Status');
      var dateCol = getColumnIndexByName(headers, 'Decision_Date');
      var notesCol = getColumnIndexByName(headers, 'Decision_Notes');
      var emailCol = getColumnIndexByName(headers, 'Approver_Email');

      Logger.log('Updating approval status to: ' + decision);
      sheet.getRange(i + 1, statusCol + 1).setValue(decision);
      sheet.getRange(i + 1, dateCol + 1).setValue(new Date());
      sheet.getRange(i + 1, notesCol + 1).setValue(notes || '');

      // Update approver email if provided (records actual approving client)
      if (approverEmail && emailCol !== -1) {
        sheet.getRange(i + 1, emailCol + 1).setValue(approverEmail);
      }

      // CRITICAL: Flush spreadsheet changes before reading approval status
      // This ensures checkAndUpdatePostApprovalStatus reads the updated approval status
      Logger.log('Flushing spreadsheet changes...');
      SpreadsheetApp.flush();
      Logger.log('✅ Spreadsheet flushed');

      // Get post ID to check if all approvals are complete
      var postId = data[i][1];
      Logger.log('Post ID from approval record: ' + postId);
      Logger.log('Calling checkAndUpdatePostApprovalStatus...');

      checkAndUpdatePostApprovalStatus(postId);

      Logger.log('checkAndUpdatePostApprovalStatus completed');

      // Notify post creator about the decision
      try {
        var post = _getPostByIdSimple(postId);
        if (post && post.Created_By) {
          var approverName = approverEmail || data[i][getColumnIndexByName(headers, 'Approver_Email')];
          notifyApprovalDecision(post.Created_By, approverName, decision, post.Post_Title, postId);
        }
      } catch (notifError) {
        Logger.log('⚠️ WARNING: Failed to create approval decision notification: ' + notifError.message);
      }

      logAction('Approval decision recorded', {
        approvalId: approvalId,
        decision: decision,
        approverEmail: approverEmail
      });

      return {success: true, message: 'Decision recorded'};
    }
  }

  return {success: false, error: 'Approval record not found'};
}

/**
 * Check if all approvals for a post are complete and update post status
 */
function checkAndUpdatePostApprovalStatus(postId) {
  Logger.log('=== Checking approval status for post: ' + postId + ' ===');

  var internalApprovals = getPostApprovals(postId, 'Internal');
  var clientApprovals = getPostApprovals(postId, 'Client');

  Logger.log('Internal approvals found: ' + internalApprovals.length);
  if (internalApprovals.length > 0) {
    internalApprovals.forEach(function(a) {
      Logger.log('  Internal: ' + a.ID + ' - Status: ' + a.Approval_Status + ', Stage: ' + a.Approval_Stage);
    });
  }

  Logger.log('Client approvals found: ' + clientApprovals.length);
  if (clientApprovals.length > 0) {
    clientApprovals.forEach(function(a) {
      Logger.log('  Client: ' + a.ID + ' - Status: ' + a.Approval_Status + ', Stage: ' + a.Approval_Stage);
    });
  }

  // Check internal approvals
  var allInternalApproved = internalApprovals.length > 0 && internalApprovals.every(function(approval) {
    return approval.Approval_Status === 'Approved';
  });

  var anyInternalRejected = internalApprovals.some(function(approval) {
    return approval.Approval_Status === 'Rejected';
  });

  var anyInternalChangesRequested = internalApprovals.some(function(approval) {
    return approval.Approval_Status === 'Changes_Requested';
  });

  // Check client approvals
  // CHANGED: Use .some() instead of .every() - ANY client approval is sufficient
  // Rationale: Client approval is the final approval. If one client says "approved", post is ready.
  var anyClientApproved = clientApprovals.length > 0 && clientApprovals.some(function(approval) {
    return approval.Approval_Status === 'Approved';
  });

  var anyClientRejected = clientApprovals.some(function(approval) {
    return approval.Approval_Status === 'Rejected';
  });

  var anyClientChangesRequested = clientApprovals.some(function(approval) {
    return approval.Approval_Status === 'Changes_Requested';
  });

  Logger.log('All internal approved: ' + allInternalApproved);
  Logger.log('Any internal rejected: ' + anyInternalRejected);
  Logger.log('Any internal changes requested: ' + anyInternalChangesRequested);
  Logger.log('Any client approved: ' + anyClientApproved);
  Logger.log('Any client rejected: ' + anyClientRejected);
  Logger.log('Any client changes requested: ' + anyClientChangesRequested);

  // Update post status based on approval state
  // Priority order: Rejections > Change Requests > Client Approval > Internal Approval

  if (anyInternalRejected || anyClientRejected) {
    Logger.log('→ Updating status to: Cancelled (rejection found)');
    updatePostStatus(postId, 'Cancelled');
  } else if (anyClientChangesRequested) {
    // Client requested changes - send back to draft
    Logger.log('→ Updating status to: Draft (client requested changes)');
    updatePostStatus(postId, 'Draft');
  } else if (anyInternalChangesRequested) {
    // Internal requested changes - send back to draft
    Logger.log('→ Updating status to: Draft (internal requested changes)');
    updatePostStatus(postId, 'Draft');
  } else if (anyClientApproved) {
    // ANY client approved - post is ready to publish (internal approval already happened to get here)
    Logger.log('→ Updating status to: Approved (at least one client approved)');
    updatePostStatus(postId, 'Approved');
  } else if (allInternalApproved && clientApprovals.length === 0) {
    // Internal approved but no client approval yet - should already be in Client_Review
    Logger.log('→ Status should be Client_Review (internal approved, awaiting client)');
    // Don't change status here - it should already be Client_Review from submitForClientReview()
  } else {
    Logger.log('→ No status update (approvals still pending)');
  }

  Logger.log('=== checkAndUpdatePostApprovalStatus COMPLETE ===');
}

/**
 * Get approval records for a post
 */
function getPostApprovals(postId, stage) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Approvals');
  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) return [];

  var headers = data[0];
  var rows = data.slice(1);

  var approvals = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  }).filter(function(approval) {
    return approval.Post_ID === postId;
  });

  if (stage) {
    approvals = approvals.filter(function(approval) {
      // Check for both stage name variants for compatibility
      if (stage === 'Internal') {
        return approval.Approval_Stage === 'Internal' || approval.Approval_Stage === 'Internal_Review';
      } else if (stage === 'Client') {
        return approval.Approval_Stage === 'Client' || approval.Approval_Stage === 'Client_Review';
      }
      return approval.Approval_Stage === stage;
    });
  }

  return approvals;
}

/**
 * Get approval record by ID
 */
function getApprovalById(approvalId) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Approvals');
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return null;
  
  var headers = data[0];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === approvalId) {
      var obj = {};
      headers.forEach(function(header, index) {
        obj[header] = data[i][index];
      });
      return obj;
    }
  }
  
  return null;
}

/**
 * Get pending approvals for a user
 */
function getPendingApprovalsForUser(userEmail) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Approvals');
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var rows = data.slice(1);
  
  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  }).filter(function(approval) {
    return approval.Approver_Email === userEmail && approval.Approval_Status === 'Pending';
  });
}

// ============================================================================
// EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Send approval request email
 */
function sendApprovalRequestEmail(postId, approverEmail, stage) {
  var post = _getPostByIdSimple(postId);
  if (!post) return;
  
  var client = getClientById(post.Client_ID);
  var webAppUrl = getWebAppUrl();
  
  var subject = 'Content Approval Request - ' + client.Client_Name;
  
  var stageText = stage === 'Internal' ? 'internal review' : 'client review';
  
  var body = 'Hello,\n\n' +
             'A new social media post is ready for your ' + stageText + '.\n\n' +
             'Post Details:\n' +
             '-------------------\n' +
             'Client: ' + client.Client_Name + '\n' +
             'Title: ' + post.Post_Title + '\n' +
             'Scheduled Date: ' + formatDate(post.Scheduled_Date) + '\n' +
             'Platform(s): (see platforms in app)\n\n' +
             'Copy:\n' +
             post.Post_Copy + '\n\n' +
             '-------------------\n\n' +
             'To review and approve this post, please visit:\n' +
             webAppUrl + '\n\n' +
             'You can approve, request changes, or reject the post in the application.\n\n' +
             'Thank you!';

  return sendEmail(approverEmail, subject, body);
}

/**
 * Send notification when post is approved
 */
function sendApprovalCompletedEmail(postId) {
  var post = _getPostByIdSimple(postId);
  if (!post) return;
  
  var client = getClientById(post.Client_ID);
  var creator = post.Created_By;
  
  var subject = 'Content Approved - ' + post.Post_Title;
  
  var body = 'Hello,\n\n' +
             'Your social media post has been approved and is ready for scheduling!\n\n' +
             'Post Details:\n' +
             '-------------------\n' +
             'Client: ' + client.Client_Name + '\n' +
             'Title: ' + post.Post_Title + '\n' +
             'Scheduled Date: ' + formatDate(post.Scheduled_Date) + '\n\n' +
             '-------------------\n\n' +
             'You can now proceed with publishing this content.\n\n' +
             'View in app: ' + getWebAppUrl();
  
  sendEmail(creator, subject, body);
}

/**
 * Send notification when changes are requested
 */
function sendChangesRequestedEmail(postId, requesterEmail, notes) {
  var post = _getPostByIdSimple(postId);
  if (!post) return;
  
  var client = getClientById(post.Client_ID);
  var creator = post.Created_By;
  
  var subject = 'Changes Requested - ' + post.Post_Title;
  
  var body = 'Hello,\n\n' +
             'Changes have been requested for your social media post.\n\n' +
             'Post Details:\n' +
             '-------------------\n' +
             'Client: ' + client.Client_Name + '\n' +
             'Title: ' + post.Post_Title + '\n\n' +
             'Feedback:\n' +
             notes + '\n\n' +
             '-------------------\n\n' +
             'Please review the feedback and make the necessary changes.\n\n' +
             'View in app: ' + getWebAppUrl();
  
  sendEmail(creator, subject, body);
}

/**
 * Get all pending approvals for the current user
 */
function getMyPendingApprovals() {
  var currentUser = Session.getActiveUser().getEmail();
  Logger.log('WEB APP - Current user: ' + currentUser);
  
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Approvals');
  var data = sheet.getDataRange().getValues();
  
  Logger.log('WEB APP - Sheet has ' + (data.length - 1) + ' rows');
  
  if (data.length <= 1) {
    Logger.log('WEB APP - Sheet is empty');
    return [];
  }
  
  var headers = data[0];
  var approvals = [];
  
  for (var i = 1; i < data.length; i++) {
    var approval = {};
    
    // Convert ALL fields to strings to ensure serializability
    headers.forEach(function(header, index) {
      var value = data[i][index];
      if (value instanceof Date) {
        approval[header] = value.toISOString();
      } else if (value === null || value === undefined) {
        approval[header] = '';
      } else {
        approval[header] = String(value);
      }
    });
    
    Logger.log('WEB APP - Row ' + i + ': Email=' + approval.Approver_Email + ', Status=' + approval.Approval_Status);
    
    // Only include pending approvals for this user
    if (approval.Approver_Email === currentUser && approval.Approval_Status === 'Pending') {
      Logger.log('WEB APP - MATCH FOUND!');
      
      // Get the post details
      try {
        var post = _getPostByIdSimple(approval.Post_ID);
        if (post) {
          approval.Post_Title = String(post.Post_Title || '');
          approval.Post_Copy = String(post.Post_Copy || '');
          approval.Post_Scheduled_Date = post.Scheduled_Date ? String(post.Scheduled_Date) : '';
          
          // Get client name from Client_ID
          if (post.Client_ID) {
            var client = getClientById(post.Client_ID);
            approval.Client_Name = client ? String(client.Client_Name || '') : '';
          } else {
            approval.Client_Name = '';
          }
        }
      } catch (e) {
        Logger.log('Error getting post details: ' + e.message);
        approval.Post_Title = 'Error loading post';
        approval.Post_Copy = '';
        approval.Post_Scheduled_Date = '';
        approval.Client_Name = '';
      }
      
      approvals.push(approval);
    }
  }
  
  Logger.log('WEB APP - Returning ' + approvals.length + ' approvals');
  Logger.log('WEB APP - Approvals data: ' + JSON.stringify(approvals));
  return approvals;
}

/**
 * Approve or reject a post
 */
function submitApprovalDecision(approvalId, decision, comments) {
  if (decision !== 'Approved' && decision !== 'Changes_Requested') {
    return {success: false, error: 'Invalid decision'};
  }
  
  var result = recordApprovalDecision(approvalId, decision, comments);
  
  if (!result.success) {
    return result;
  }
  
  // Get the approval to find the post
  var approval = getApprovalById(approvalId);
  if (!approval) {
    return {success: false, error: 'Approval not found'};
  }
  
  // Check if all approvals in this stage are complete
  var postId = approval.Post_ID;
  var stage = approval.Approval_Stage;
  var allApprovals = getPostApprovals(postId, stage);
  
  var allApproved = allApprovals.every(function(a) {
    return a.Approval_Status === 'Approved';
  });
  
  var anyRejected = allApprovals.some(function(a) {
    return a.Approval_Status === 'Changes_Requested';
  });
  
  // Update post status based on approval results
  if (anyRejected) {
    // Update status to Draft
    updatePostStatus(postId, 'Draft');

    // Create version record to track this status change
    var post = _getPostByIdSimple(postId);
    if (post) {
      var postContent = {
        Post_Copy: post.Post_Copy || '',
        Hashtags: post.Hashtags || '',
        Notes: post.Notes || ''
      };
      var versionResult = createPostVersion(postId, postContent, postContent, 'Agency_Edit', false, 'Draft');
      if (versionResult.success) {
        Logger.log('✅ Version created for changes requested - returned to Draft');
      }
    }

    return {
      success: true,
      message: 'Changes requested. Post returned to Draft status.',
      nextAction: 'returned_to_draft'
    };
  } else if (allApproved && stage === 'Internal') {
    // All internal approvals complete - move to client review
    submitForClientReview(postId);
    return {
      success: true,
      message: 'Internal approval complete. Post sent for client review.',
      nextAction: 'sent_to_client'
    };
  } else if (allApproved && stage === 'Client') {
    // All client approvals complete - mark as approved
    updatePostStatus(postId, 'Approved');

    // Create version record to track this status change
    var post = _getPostByIdSimple(postId);
    if (post) {
      var postContent = {
        Post_Copy: post.Post_Copy || '',
        Hashtags: post.Hashtags || '',
        Notes: post.Notes || ''
      };
      var versionResult = createPostVersion(postId, postContent, postContent, 'Agency_Edit', true, 'Approved');
      if (versionResult.success) {
        Logger.log('✅ Version created for approval - status set to Approved');
      }
    }

    return {
      success: true,
      message: 'Post fully approved!',
      nextAction: 'fully_approved'
    };
  }
  
  return {
    success: true,
    message: 'Decision recorded. Waiting for other approvers.',
    nextAction: 'waiting'
  };
}

/**
 * Get approval by ID
 */
function getApprovalById(approvalId) {
  var approvals = getAllApprovals();
  return approvals.find(function(a) {
    return a.ID === approvalId;
  });
}

/**
 * Get all approvals (helper)
 */
function getAllApprovals() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Post_Approvals');
  return getDataAsObjects(sheet.getName());
}

/**
 * Get approval history for a post (timeline of all approval actions)
 * Returns array of approval records sorted by date
 */
function getApprovalHistory(postId) {
  try {
    var approvals = getAllApprovals();

    // Filter approvals for this post
    var postApprovals = approvals.filter(function(approval) {
      return approval.Post_ID === postId;
    });

    // Sort by decision date (most recent first), with pending approvals at the end
    postApprovals.sort(function(a, b) {
      // Pending approvals (no decision date) go to the end
      if (!a.Approval_Decision_Date && b.Approval_Decision_Date) return 1;
      if (a.Approval_Decision_Date && !b.Approval_Decision_Date) return -1;
      if (!a.Approval_Decision_Date && !b.Approval_Decision_Date) return 0;

      // Sort completed approvals by decision date (newest first)
      var dateA = new Date(a.Approval_Decision_Date);
      var dateB = new Date(b.Approval_Decision_Date);
      return dateB - dateA;
    });

    return postApprovals;
  } catch (e) {
    Logger.log('Error getting approval history: ' + e.message);
    return [];
  }
}