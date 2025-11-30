# Team Management Testing Guide

## Overview
Phase 1 of Admin Panel is complete - Agency Team Management functionality is ready for testing.

---

## 🚀 Deployment Steps

### 1. Open Apps Script Editor
```bash
clasp open
```

### 2. Deploy New Version

1. **Deploy** → **Manage deployments**
2. Click pencil icon ✏️ next to active deployment
3. **Version** → **New version**
4. Description:
   ```
   Add Team Management - Admin Panel Phase 1
   ```
5. Click **Deploy**

### 3. Open in Incognito Window
Test in incognito to avoid cache issues.

---

## 🧪 Testing Checklist

### Test 1: Access Admin Panel
- [ ] Click "👥 Admin" button in action bar
- [ ] Admin Panel modal opens
- [ ] "Team Members" tab is active by default
- [ ] Modal shows "Loading team members..." initially

### Test 2: View Team Members (First Load - Empty State)
If Users sheet doesn't exist yet:
- [ ] Message shows: "No team members found. Click 'Add Team Member' to get started."

If Users sheet has data:
- [ ] User cards display with name, email, role badge
- [ ] Role badge colors correct (Admin=red, Editor=yellow, Creator=green, Viewer=blue)
- [ ] "Change Role..." dropdown appears for each user
- [ ] "Deactivate" button appears for each user
- [ ] Created date and creator shown at bottom of card

### Test 3: Add Team Member
1. [ ] Click "Add Team Member" button
2. [ ] Add User modal opens
3. [ ] Form shows three fields: Email, Full Name, Role
4. [ ] Role defaults to "Creator"

**Test validation:**
5. [ ] Click "Add User" with empty fields → Shows "Please enter an email address"
6. [ ] Enter invalid email (e.g., "test") → Shows "Please enter a valid email address"
7. [ ] Enter email only → Shows "Please enter a full name"

**Test successful add:**
8. [ ] Enter valid data:
   - Email: `test@agency.com`
   - Full Name: `Test User`
   - Role: `Editor`
9. [ ] Click "Add User"
10. [ ] Button shows "Adding..." while processing
11. [ ] Success message: "✅ User added successfully!"
12. [ ] Modal closes
13. [ ] Team members list reloads
14. [ ] New user appears in list with correct info

**Test duplicate prevention:**
15. [ ] Try adding same email again
16. [ ] Should show error: "User with this email already exists"

### Test 4: Change User Role
1. [ ] Open "Change Role..." dropdown on a user card
2. [ ] Select different role (e.g., change from Editor to Admin)
3. [ ] Confirmation dialog appears: "Change this user's role to Admin?"
4. [ ] Click "OK"
5. [ ] Success message: "✅ Role updated successfully"
6. [ ] User card reloads with new role badge and color

**Test cancellation:**
7. [ ] Open dropdown, select new role
8. [ ] Click "Cancel" in confirmation
9. [ ] Dropdown resets to original value
10. [ ] No changes saved

### Test 5: Deactivate User
1. [ ] Click "Deactivate" button on a user card
2. [ ] Confirmation dialog appears: "⚠️ Are you sure you want to deactivate [Name]? They will no longer be able to access the system."
3. [ ] Click "OK"
4. [ ] Success message: "✅ User deactivated successfully"
5. [ ] User removed from team members list
6. [ ] Check Users sheet - Status changed to "Inactive" (not deleted)

**Test cancellation:**
7. [ ] Click "Deactivate", then "Cancel"
8. [ ] No changes made

### Test 6: Tab Switching (Preview Phase 2)
1. [ ] Click "Client Access" tab
2. [ ] Tab becomes active
3. [ ] Shows: "Client access management coming in Phase 2"
4. [ ] Click back to "Team Members" tab
5. [ ] Team members reload

### Test 7: Close Modal
1. [ ] Click "✕" close button
2. [ ] Modal closes
3. [ ] Re-open modal - should load fresh data

---

## 📊 Data Verification

### Check Users Sheet
After adding users, verify spreadsheet:

1. Open spreadsheet (ID: `1ITlQsC2ljS_Gfxt8Qk4B8ctuzlApINAUD2cUMIy0Iss`)
2. Check "Users" sheet exists
3. Verify columns:
   - ID (e.g., USR-001, USR-002)
   - Email
   - Full_Name
   - Default_Role
   - Status (Active/Inactive)
   - Created_Date
   - Created_By

4. Verify data integrity:
   - IDs are sequential and unique
   - Status is "Active" for new users
   - Created_By shows your email
   - Created_Date is correct timestamp

---

## 🐛 Troubleshooting

### Admin button doesn't appear
- Clear browser cache or use incognito
- Check deployment version updated
- Verify Index.html was pushed

### Modal stuck on "Loading..."
- Open browser console (F12)
- Check for JavaScript errors
- Verify UserManagementService.js was pushed
- Check spreadsheet permissions

### "User already exists" error when adding
- Check Users sheet for duplicate email
- Email matching is case-sensitive

### Role changes not saving
- Check browser console for errors
- Verify user ID is correct format (USR-###)
- Check spreadsheet write permissions

### Users sheet doesn't auto-create
- Currently users sheet must be manually created
- Future enhancement: Auto-create on first use
- Manually create with columns listed above

---

## ✅ Success Criteria

Phase 1 is working correctly if:
- ✅ Admin panel opens and loads team members
- ✅ Can add new team members with validation
- ✅ Can change user roles with confirmation
- ✅ Can deactivate users (soft delete)
- ✅ All data persists to Users sheet correctly
- ✅ UI shows proper loading states and error messages
- ✅ No JavaScript errors in console

---

## 🎯 Known Limitations (By Design)

1. **Users sheet must exist** - Not auto-created yet
2. **No bulk operations** - Must add/edit users one at a time
3. **No user search/filter** - All users shown (fine for small teams)
4. **No reactivation UI** - Must manually change Status in sheet
5. **Client Access tab not functional** - Phase 2 feature

---

## 🚀 Next Phase

After Phase 1 testing passes:

**Phase 2: Client Access Management**
- Implement `loadClientAccess()` function
- Display client access records
- Promote clients to admin
- Change access levels
- Revoke access

---

**Ready for Testing:** ✅ Yes
**Code Pushed:** ✅ Yes (via clasp push)
**Documentation:** ✅ Complete
**Next Step:** Deploy new version and test!
