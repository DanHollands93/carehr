-- Insert predefined employee forms into custom_forms table
INSERT INTO public.custom_forms (name, description, form_fields, created_by) VALUES
(
  'Employee Personal Details',
  'Form for capturing employee personal information',
  '[
    {
      "id": "field_first_name",
      "type": "text",
      "label": "First Name",
      "placeholder": "Enter first name",
      "required": true
    },
    {
      "id": "field_last_name", 
      "type": "text",
      "label": "Last Name",
      "placeholder": "Enter last name",
      "required": true
    },
    {
      "id": "field_email",
      "type": "email", 
      "label": "Email Address",
      "placeholder": "Enter email address",
      "required": true
    },
    {
      "id": "field_phone",
      "type": "text",
      "label": "Phone Number",
      "placeholder": "Enter phone number",
      "required": false
    },
    {
      "id": "field_date_of_birth",
      "type": "date",
      "label": "Date of Birth", 
      "required": false
    },
    {
      "id": "field_ni_number",
      "type": "text",
      "label": "National Insurance Number",
      "placeholder": "Enter NI number",
      "required": false
    },
    {
      "id": "field_passport_number",
      "type": "text", 
      "label": "Passport Number",
      "placeholder": "Enter passport number",
      "required": false
    },
    {
      "id": "field_tax_code",
      "type": "text",
      "label": "Tax Code", 
      "placeholder": "Enter tax code",
      "required": false
    }
  ]'::jsonb,
  NULL
),
(
  'Employee Address Details',
  'Form for capturing employee address information',
  '[
    {
      "id": "field_address_line1",
      "type": "text",
      "label": "Address Line 1",
      "placeholder": "Enter address line 1",
      "required": true
    },
    {
      "id": "field_address_line2",
      "type": "text", 
      "label": "Address Line 2",
      "placeholder": "Enter address line 2",
      "required": false
    },
    {
      "id": "field_city",
      "type": "text",
      "label": "City",
      "placeholder": "Enter city",
      "required": true
    },
    {
      "id": "field_postcode",
      "type": "text",
      "label": "Postcode",
      "placeholder": "Enter postcode", 
      "required": true
    },
    {
      "id": "field_country",
      "type": "text",
      "label": "Country",
      "placeholder": "Enter country",
      "required": true
    },
    {
      "id": "field_start_date",
      "type": "date",
      "label": "Address Start Date",
      "required": true
    },
    {
      "id": "field_end_date", 
      "type": "date",
      "label": "Address End Date",
      "required": false
    },
    {
      "id": "field_is_current",
      "type": "checkbox",
      "label": "Current Address",
      "required": false
    }
  ]'::jsonb,
  NULL
),
(
  'Employee Employment Details',
  'Form for capturing employee employment information',
  '[
    {
      "id": "field_job_title",
      "type": "text",
      "label": "Job Title",
      "placeholder": "Enter job title",
      "required": true
    },
    {
      "id": "field_department",
      "type": "text",
      "label": "Department", 
      "placeholder": "Enter department",
      "required": false
    },
    {
      "id": "field_location",
      "type": "select",
      "label": "Location",
      "required": true,
      "options": ["Head Office", "Regional Office", "Remote", "Field"]
    },
    {
      "id": "field_employment_type",
      "type": "select", 
      "label": "Employment Type",
      "required": true,
      "options": ["permanent", "temporary", "contract", "intern"]
    },
    {
      "id": "field_contract_type",
      "type": "select",
      "label": "Contract Type",
      "required": true,
      "options": ["full_time", "part_time", "zero_hours"]
    },
    {
      "id": "field_pay_type",
      "type": "select",
      "label": "Pay Type", 
      "required": true,
      "options": ["salary", "hourly", "commission", "contractor"]
    },
    {
      "id": "field_pay_rate",
      "type": "number",
      "label": "Pay Rate",
      "placeholder": "Enter pay rate",
      "required": true
    },
    {
      "id": "field_currency",
      "type": "select",
      "label": "Currency",
      "required": true,
      "options": ["GBP", "USD", "EUR"]
    },
    {
      "id": "field_hours_per_week",
      "type": "number",
      "label": "Hours Per Week",
      "placeholder": "Enter hours per week",
      "required": false
    },
    {
      "id": "field_start_date",
      "type": "date",
      "label": "Employment Start Date",
      "required": true
    },
    {
      "id": "field_probation_end",
      "type": "date", 
      "label": "Probation End Date",
      "required": false
    },
    {
      "id": "field_notice_period",
      "type": "number",
      "label": "Notice Period (weeks)",
      "placeholder": "Enter notice period in weeks",
      "required": false
    }
  ]'::jsonb,
  NULL
),
(
  'Employee Bank Details',
  'Form for capturing employee banking information',
  '[
    {
      "id": "field_account_name",
      "type": "text",
      "label": "Account Holder Name",
      "placeholder": "Enter account holder name",
      "required": true
    },
    {
      "id": "field_bank_name",
      "type": "text",
      "label": "Bank Name",
      "placeholder": "Enter bank name",
      "required": true
    },
    {
      "id": "field_account_number",
      "type": "text",
      "label": "Account Number",
      "placeholder": "Enter account number",
      "required": true
    },
    {
      "id": "field_sort_code",
      "type": "text",
      "label": "Sort Code",
      "placeholder": "Enter sort code",
      "required": true
    },
    {
      "id": "field_iban",
      "type": "text",
      "label": "IBAN",
      "placeholder": "Enter IBAN (if applicable)",
      "required": false
    },
    {
      "id": "field_swift_code",
      "type": "text",
      "label": "SWIFT/BIC Code",
      "placeholder": "Enter SWIFT/BIC code (if applicable)",
      "required": false
    }
  ]'::jsonb,
  NULL
),
(
  'Career History Entry',
  'Form for capturing individual career history entries',
  '[
    {
      "id": "field_job_title",
      "type": "text",
      "label": "Job Title",
      "placeholder": "Enter job title",
      "required": true
    },
    {
      "id": "field_location",
      "type": "select",
      "label": "Location",
      "required": true,
      "options": ["Head Office", "Regional Office", "Remote", "Field"]
    },
    {
      "id": "field_employment_type",
      "type": "select",
      "label": "Employment Type",
      "required": true,
      "options": ["permanent", "temporary", "contract", "intern"]
    },
    {
      "id": "field_contract_type",
      "type": "select",
      "label": "Contract Type", 
      "required": true,
      "options": ["full_time", "part_time", "zero_hours"]
    },
    {
      "id": "field_pay_type",
      "type": "select",
      "label": "Pay Type",
      "required": true,
      "options": ["salary", "hourly", "commission", "contractor"]
    },
    {
      "id": "field_pay_rate",
      "type": "number",
      "label": "Pay Rate",
      "placeholder": "Enter pay rate",
      "required": true
    },
    {
      "id": "field_currency",
      "type": "select",
      "label": "Currency",
      "required": true,
      "options": ["GBP", "USD", "EUR"]
    },
    {
      "id": "field_hours_per_week",
      "type": "number",
      "label": "Hours Per Week",
      "placeholder": "Enter hours per week",
      "required": false
    },
    {
      "id": "field_start_date",
      "type": "date",
      "label": "Start Date",
      "required": true
    },
    {
      "id": "field_end_date",
      "type": "date",
      "label": "End Date",
      "required": false
    },
    {
      "id": "field_probation_end",
      "type": "date",
      "label": "Probation End Date",
      "required": false
    },
    {
      "id": "field_notice_period",
      "type": "number",
      "label": "Notice Period (weeks)",
      "placeholder": "Enter notice period in weeks",
      "required": false
    },
    {
      "id": "field_reporting_manager",
      "type": "text",
      "label": "Reporting Manager",
      "placeholder": "Enter reporting manager name",
      "required": false
    }
  ]'::jsonb,
  NULL
);