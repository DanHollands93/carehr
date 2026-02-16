
# Recreate Full Database Schema on Lovable Cloud

## The Problem
When Cloud was enabled, it created a fresh, empty database. Your project code references ~30+ tables, functions, triggers, and RLS policies that existed on your previous backend. The existing migration files in the codebase assume some tables already exist (like `employees`, `career_history`, `shifts`, `shift_templates`, `roster_templates`, `job_roles`, `holiday_requests`, `holiday_entitlement`, `employee_drafts`), so they cannot simply be re-run as-is.

## The Plan
Create a single comprehensive migration that builds the entire database schema from scratch, in the correct dependency order. This will NOT restore old data (that lived on the previous backend), but it will make the application fully functional again so you can start fresh.

## What Will Be Created

### Core Tables (in order)
1. **employees** - Staff records (name, email, department, DOB, NI number, etc.)
2. **profiles** - User profiles linked to auth, with employee_id reference
3. **user_roles** - Admin/HR role assignments (enum-based)
4. **career_history** - Employment history per employee
5. **address_history** - Address records per employee
6. **job_roles** - Available job roles with pay rates
7. **employee_job_roles** - Many-to-many employee-to-job-role assignments
8. **positions** - Position categories
9. **holiday_requests** - Holiday/leave requests
10. **holiday_entitlement** - Holiday allowances
11. **employee_drafts** - Draft employee records
12. **lookup_lists** - Configurable dropdown values (locations, positions, etc.)

### Roster/Scheduling Tables
13. **shift_templates** - Reusable shift definitions
14. **roster_templates** - Roster template definitions
15. **roster_template_assignments** - Employee assignments within templates
16. **applied_roster_templates** - Deployment history
17. **template_shifts** - Shifts within templates
18. **shifts** - Actual scheduled shifts
19. **roster_categories** - Groupings for rosters
20. **roster_staff_assignments** - Staff assigned to roster categories

### Time Management Tables
21. **time_clock_records** - Clock in/out records
22. **time_segments** - Detailed time breakdown for pay

### Permissions System Tables
23. **permissions** - Available permission definitions
24. **user_permissions** - Direct user permission grants/denials
25. **user_location_permissions** - Location-based access
26. **permission_groups** - Named permission bundles (e.g. "Care Manager", "Staff")
27. **permission_group_permissions** - Permissions within groups
28. **user_role_assignments** - Users assigned to permission groups
29. **user_menu_overrides** - Per-user menu visibility
30. **bulk_role_rules** - Auto-assign permissions by job role
31. **bulk_position_rules** - Auto-assign permissions by position

### Other Tables
32. **notifications** - User notifications
33. **notification_templates** - Notification message templates
34. **processes** - Dynamic process definitions
35. **menu_sets** - Menu configuration
36. **email_logs** - Email send history
37. **system_settings** - System configuration (time clock tolerances, etc.)

### Functions and Triggers
- `has_role()` - Check user role (security definer)
- `user_has_permission()` - Check specific permission
- `user_has_location_access()` - Check location access
- `user_can_view_employees()`, `user_can_edit_employees()`, etc. - Permission helper functions
- `current_user_employee_id()` - Get current user's employee ID
- `get_effective_user_permissions()` - Combined role + override permissions
- `user_has_effective_permission()` - Check effective permission
- `handle_new_user()` trigger - Auto-create profile on signup
- `apply_bulk_role_rules()` trigger - Auto-assign permissions on job role change
- `apply_bulk_position_rules()` trigger - Auto-assign permissions on position change
- `create_time_clock_record_for_shift()` trigger - Auto-create clock records
- `validate_notification_template()` - Template security validation
- `assign_default_permissions_to_user()` - Default permission assignment
- `is_template_active()` - Check template date validity

### RLS Policies
All tables will have Row Level Security enabled with appropriate policies matching the existing codebase expectations.

### Seed Data
- Default permissions (view_employees, edit_roster, approve_holidays, etc.)
- Default permission groups (Care Manager, Team Leader, Staff, Admin, Super User, Default User)
- Default notification templates
- Default system settings (clock tolerances)
- Default lookup list entries (positions)
- Default menu sets and processes

## What This Will NOT Do
- It will not restore any employee, user, or shift data from the old backend
- You will need to create a new admin user account by signing up through the app
- After signup, we will assign them the admin role manually

## Technical Details

The migration will be a single large SQL file executed via the database migration tool. The order of table creation is carefully sequenced to respect foreign key dependencies. All `CREATE TABLE` statements use `IF NOT EXISTS` for safety. All `INSERT` seed data uses `ON CONFLICT DO NOTHING` to be idempotent.

After the schema is created, a second step will set up the first admin user (either via the app signup flow or a separate data insert).
