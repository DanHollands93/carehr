

## Pay Rate History & Job Role Pay Management

### Problem

Currently, pay rates are stored as a single value on `career_history`, `employee_job_roles`, and `job_roles` tables. There is no historical record of pay changes -- when a rate changes, the old value is overwritten. You also cannot apply annual uplifts across roles.

### Solution

Introduce a **`pay_rates`** table that stores every pay rate change with effective dates, linked to either a job role or an employee-job-role assignment. This gives a full audit trail of pay history and enables uplifts.

### Database Changes

**New table: `pay_rates`**
- `id` (uuid, PK)
- `company_id` (uuid, FK to companies)
- `job_role_id` (uuid, nullable, FK to job_roles) -- base rate for the role
- `employee_job_role_id` (uuid, nullable, FK to employee_job_roles) -- employee-specific override
- `employee_id` (uuid, nullable, FK to employees) -- for easy querying
- `pay_rate` (numeric, not null)
- `pay_type` (text: 'hourly' | 'salary')
- `currency` (text, default 'GBP')
- `effective_from` (text, not null) -- date string
- `effective_to` (text, nullable) -- null = current
- `reason` (text, nullable) -- e.g. "Annual uplift 2026", "Promotion"
- `created_by` (uuid, nullable)
- `created_at` (timestamptz)

RLS: company-scoped, admin/edit_employees to manage, authenticated users can view own company's.

**No existing tables are altered** -- the existing `pay_rate` columns on `career_history`, `employee_job_roles`, and `job_roles` remain for backward compatibility and represent the "current" rate. When a new pay rate record is added, the corresponding table's `pay_rate` column is updated to match.

### UI Changes

1. **Job Roles settings** -- Add a "Pay Rates" section to each job role showing rate history with an "Add Rate" button. Include an "Apply Uplift" action (percentage or fixed amount) that creates new rate records effective from a chosen date for one or all roles.

2. **Employee Details > Career/Employment tab** -- Show pay rate timeline for each role assignment. Allow adding a new rate (effective date + amount + reason). Display history in a table: Rate, Type, Effective From, Effective To, Reason.

3. **Employee Form** -- When creating/editing a career history entry, the pay rate saved also creates a `pay_rates` record. Changing pay rate creates a new record rather than overwriting.

4. **Bulk Uplift tool** -- A dedicated action (accessible from Settings or Job Roles) to apply a percentage uplift across all active roles/employees from a given effective date, with preview before confirming.

### Implementation Order

1. Create `pay_rates` table with RLS and company_id trigger
2. Seed existing pay rates from `career_history` and `employee_job_roles` into the new table
3. Build `usePayRates` hook for querying pay history
4. Add pay rate history UI to Employee Details (career tab)
5. Add pay rate management to Job Roles settings
6. Add bulk uplift functionality
7. Update shift creation to pull the correct rate based on effective date

