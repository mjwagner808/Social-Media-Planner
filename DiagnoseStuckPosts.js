/**
 * DIAGNOSTIC: Check why posts are stuck in Client_Review
 */
function DIAGNOSE_STUCK_CLIENT_REVIEW_POSTS() {
  Logger.log('=== DIAGNOSING STUCK CLIENT_REVIEW POSTS ===');
  
  var stuckPostIds = ['POST-029', 'POST-030', 'POST-031', 'POST-032', 'POST-033', 'POST-034'];
  
  stuckPostIds.forEach(function(postId) {
    Logger.log('');
    Logger.log('─────────────────────────────────────────');
    Logger.log('Post ID: ' + postId);
    Logger.log('─────────────────────────────────────────');
    
    // Get post details
    var post = _getPostByIdSimple(postId);
    if (!post) {
      Logger.log('❌ Post not found');
      return;
    }
    
    Logger.log('Post Title: ' + post.Post_Title);
    Logger.log('Status: ' + post.Status);
    Logger.log('Client ID: ' + post.Client_ID);
    
    // Get client approvals
    var clientApprovals = getPostApprovals(postId, 'Client');
    
    Logger.log('');
    Logger.log('Client Approvals: ' + clientApprovals.length + ' records');
    
    if (clientApprovals.length === 0) {
      Logger.log('  ⚠️ NO CLIENT APPROVAL RECORDS FOUND');
      Logger.log('  This means submitForClientReview() was never called');
      return;
    }
    
    // Analyze each approval record
    var approvedCount = 0;
    var pendingCount = 0;
    var rejectedCount = 0;
    var changesRequestedCount = 0;
    
    clientApprovals.forEach(function(approval) {
      Logger.log('');
      Logger.log('  Approval ID: ' + approval.ID);
      Logger.log('    Stage: ' + approval.Approval_Stage);
      Logger.log('    Approver Email: ' + approval.Approver_Email);
      Logger.log('    Status: ' + approval.Approval_Status);
      
      if (approval.Decision_Date) {
        Logger.log('    Decision Date: ' + approval.Decision_Date);
      }
      
      if (approval.Decision_Notes) {
        Logger.log('    Notes: ' + approval.Decision_Notes);
      }
      
      // Count statuses
      switch (approval.Approval_Status) {
        case 'Approved':
          approvedCount++;
          break;
        case 'Pending':
          pendingCount++;
          break;
        case 'Rejected':
          rejectedCount++;
          break;
        case 'Changes_Requested':
          changesRequestedCount++;
          break;
      }
    });
    
    Logger.log('');
    Logger.log('Summary:');
    Logger.log('  Approved: ' + approvedCount);
    Logger.log('  Pending: ' + pendingCount);
    Logger.log('  Rejected: ' + rejectedCount);
    Logger.log('  Changes Requested: ' + changesRequestedCount);
    
    // Diagnose the issue
    Logger.log('');
    Logger.log('Diagnosis:');
    
    var allClientApproved = clientApprovals.every(function(a) {
      return a.Approval_Status === 'Approved';
    });
    
    if (allClientApproved) {
      Logger.log('  ✅ ALL client approvals are Approved');
      Logger.log('  ❌ BUT Post status is still: ' + post.Status);
      Logger.log('  🔍 Issue: checkAndUpdatePostApprovalStatus() should have updated status to "Approved"');
    } else if (approvedCount > 0 && pendingCount > 0) {
      Logger.log('  ⚠️ PARTIAL APPROVAL:');
      Logger.log('      ' + approvedCount + ' approver(s) approved');
      Logger.log('      ' + pendingCount + ' approver(s) still pending');
      Logger.log('  🔍 Current logic requires ALL approvers to approve');
      Logger.log('  🔍 Post will remain in Client_Review until ALL approve');
    } else if (pendingCount === clientApprovals.length) {
      Logger.log('  ⚠️ ALL approvals still pending');
      Logger.log('  🔍 No approvers have responded yet');
    } else if (rejectedCount > 0 || changesRequestedCount > 0) {
      Logger.log('  ❌ Some approvals rejected or changes requested');
      Logger.log('  🔍 Status should be "Draft" or "Cancelled"');
    }
  });
  
  Logger.log('');
  Logger.log('=== DIAGNOSIS COMPLETE ===');
}

/**
 * Helper: Get post by ID (simple version)
 */
function _getPostByIdSimple(postId) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Posts');
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return null;
  
  var headers = data[0];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === postId) {
      var obj = {};
      headers.forEach(function(header, index) {
        obj[header] = data[i][index];
      });
      return obj;
    }
  }
  
  return null;
}
