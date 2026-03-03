

## Multi-Tenancy SaaS Architecture Plan

This is a significant architectural change that transforms CareHR from a single-company app into a multi-tenant SaaS platform. Here is the plan broken into phases.

---

### Core Concept: Row-Level Tenancy

Rather than separate databases per company (not feasible with Supabase), we use **row-level tenancy** — every table gets a `company_id` column, and RLS policies ensure users can only ever see their own company's data. This is the industry-standard approach for SaaS on shared databases and is completely secure.

---

### Phase 1: Company & Module Foundation

**Database changes:**

1. **`companies` table** — stores each customer company:
   - `id`, `name`, `slug`, `is_active`, `created_at`, `settings` (JSONB for feature toggles like geo-clock, photo-clock)

2. **`company_modules` table** — which modules each company has access to:
   - `id`, `company_id`, `module_key` (e.g. `rostering`, `hr`, `care_planning`), `is_enabled`, `created_at`

3. **`modules` table** — master list of available modules:
   - `id`, `key`, `name`, `description`, `is_available`

4. **Add `company_id` column** to `profiles` table (linking users to companies)

5. **Create `company_settings` table** for per-company feature toggles:
   - `id`, `company_id`, `setting_key`, `setting_value`, `description`
   - Keys like: `clock_in_geolocation`, `clock_in_photo`, `require_break_logging`, etc.

6. **Security definer function** `user_company_id(uuid)` that returns the company_id for a user — used in all RLS policies.

**RLS approach:**
- All existing tables get a `company_id` column over time
- New RLS policies use `company_id = user_company_id(auth.uid())` to enforce isolation
- This is done incrementally — we start with the core tables first

---

### Phase 2: Super Admin (System Owner) Layer

**You (the CareHR owner) need a "super admin" role above company admins:**

1. **Add `super_admin` to the `app_role` enum** — or create a separate `platform_roles` table
2. **Super Admin dashboard pages:**
   - `/platform/companies` — list, create, edit companies
   - `/platform/companies/:id/modules` — toggle modules per company
   - `/platform/companies/:id/settings` — manage company feature toggles
3. **Super admin bypasses company_id filtering** in RLS (can see all data)

---

### Phase 3: Module-Aware UI

**Sidebar and navigation filtered by company modules:**

1. Map each menu group in `unifiedMenuConfig` to a module key (e.g. "Roster & Time" → `rostering`, "HR & Personal" → `hr`)
2. Create a `useCompanyModules()` hook that fetches the current company's enabled modules
3. Sidebar only renders menu groups whose module is enabled for the company
4. Permission group management UI hides permissions for disabled modules
5. Settings page only shows feature toggles relevant to enabled modules

---

### Phase 4: Company Feature Settings

**Per-company settings page (for company admins):**

1. A clean settings UI under the existing Settings page with toggle switches:
   - "Require geolocation on clock-in" (on/off)
   - "Require photo on clock-in" (on/off)
   - Future: "Enable break logging", "Require shift acknowledgement", etc.
2. `useCompanySettings()` hook to fetch and cache these
3. Time clock and shift components check these settings before requesting location/camera

---

### Phase 5: Migrate Existing Tables

**Add `company_id` to all existing data tables incrementally:**
- `employees`, `shifts`, `shift_templates`, `roster_templates`, `holiday_requests`, `time_clock_records`, `notifications`, etc.
- Update all RLS policies to include company_id filtering
- Update all queries to include company_id context

---

### Implementation Order

Given the scale, I recommend building this in stages across multiple conversations:

1. **First: Database foundation** — `companies`, `modules`, `company_modules`, `company_settings` tables + `company_id` on `profiles` + security functions + RLS
2. **Second: Super admin UI** — company management pages, module toggling
3. **Third: Module-aware sidebar** — hook + filtering logic
4. **Fourth: Company settings UI** — feature toggle page for company admins
5. **Fifth: Migrate existing tables** — add `company_id` progressively to employees, shifts, etc.

---

### Technical Detail

```text
┌─────────────────────────────────────┐
│         PLATFORM (Super Admin)       │
│  - Manage companies                  │
│  - Assign modules                    │
│  - View all data                     │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───┴───┐           ┌────┴────┐
│ Co. A │           │  Co. B  │
│modules│           │ modules │
│HR,Rost│           │ HR only │
│settings│          │settings │
└───┬───┘           └────┬────┘
    │                    │
  users                users
  employees            employees
  shifts               (no shifts)
```

Each company's data is isolated by `company_id` in every row. RLS enforces this at the database level — there is zero chance of cross-company data leakage.

---

Shall I start with Phase 1 (database foundation)?

