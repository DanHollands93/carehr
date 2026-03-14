export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      address_history: {
        Row: {
          city: string
          company_id: string | null
          country: string
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          is_current: boolean | null
          line_1: string
          line_2: string | null
          postcode: string
          start_date: string
        }
        Insert: {
          city?: string
          company_id?: string | null
          country?: string
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          line_1?: string
          line_2?: string | null
          postcode?: string
          start_date?: string
        }
        Update: {
          city?: string
          company_id?: string | null
          country?: string
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          line_1?: string
          line_2?: string | null
          postcode?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "address_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "address_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      applied_roster_templates: {
        Row: {
          applied_by: string | null
          applied_date: string
          company_id: string | null
          created_at: string
          end_date: string | null
          id: string
          roster_template_id: string
          start_date: string | null
        }
        Insert: {
          applied_by?: string | null
          applied_date: string
          company_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          roster_template_id: string
          start_date?: string | null
        }
        Update: {
          applied_by?: string | null
          applied_date?: string
          company_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          roster_template_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applied_roster_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applied_roster_templates_roster_template_id_fkey"
            columns: ["roster_template_id"]
            isOneToOne: false
            referencedRelation: "roster_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          company_id: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          notes: string | null
          old_data: Json | null
          performed_at: string
          performed_by: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          company_id?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          performed_at?: string
          performed_by?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          company_id?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          performed_at?: string
          performed_by?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_position_rules: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          permission_group_id: string
          position: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          permission_group_id: string
          position: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          permission_group_id?: string
          position?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_position_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_position_rules_permission_group_id_fkey"
            columns: ["permission_group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_role_rules: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          job_role: string
          permission_group_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          job_role: string
          permission_group_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          job_role?: string
          permission_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_role_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_role_rules_permission_group_id_fkey"
            columns: ["permission_group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      career_history: {
        Row: {
          company_id: string | null
          contract_type: string | null
          created_at: string
          currency: string | null
          employee_id: string
          employment_type: string | null
          end_date: string | null
          hours_per_week: number | null
          id: string
          job_role_id: string | null
          job_title: string
          location: string
          notice_period_weeks: number | null
          pay_rate: number | null
          pay_type: string | null
          probation_end_date: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          contract_type?: string | null
          created_at?: string
          currency?: string | null
          employee_id: string
          employment_type?: string | null
          end_date?: string | null
          hours_per_week?: number | null
          id?: string
          job_role_id?: string | null
          job_title?: string
          location?: string
          notice_period_weeks?: number | null
          pay_rate?: number | null
          pay_type?: string | null
          probation_end_date?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          contract_type?: string | null
          created_at?: string
          currency?: string | null
          employee_id?: string
          employment_type?: string | null
          end_date?: string | null
          hours_per_week?: number | null
          id?: string
          job_role_id?: string | null
          job_title?: string
          location?: string
          notice_period_weeks?: number | null
          pay_rate?: number | null
          pay_type?: string | null
          probation_end_date?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          settings: Json
          slug: string
          subdomain: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          settings?: Json
          slug: string
          subdomain?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json
          slug?: string
          subdomain?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_modules: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_enabled: boolean
          module_key: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_key: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_type_templates: {
        Row: {
          company_id: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          show_expiry_date: boolean | null
          show_issue_date: boolean | null
          show_reference_number: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          show_expiry_date?: boolean | null
          show_issue_date?: boolean | null
          show_reference_number?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          show_expiry_date?: boolean | null
          show_issue_date?: boolean | null
          show_reference_number?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_type_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          body: string | null
          company_id: string | null
          created_at: string
          error_message: string | null
          id: string
          recipient: string
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          body?: string | null
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient: string
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          body?: string | null
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_compliance: {
        Row: {
          company_id: string | null
          compliance_type: string
          compliance_type_template_id: string | null
          created_at: string
          custom_fields: Json | null
          employee_id: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          notes: string | null
          reference_number: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          compliance_type: string
          compliance_type_template_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          reference_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          compliance_type?: string
          compliance_type_template_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          reference_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_compliance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_compliance_compliance_type_template_id_fkey"
            columns: ["compliance_type_template_id"]
            isOneToOne: false
            referencedRelation: "compliance_type_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_compliance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_drafts: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          data: Json | null
          id: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_drafts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_form_configs: {
        Row: {
          company_id: string | null
          created_at: string
          custom_fields: Json | null
          field_configs: Json | null
          id: string
          section: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          field_configs?: Json | null
          id?: string
          section: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          field_configs?: Json | null
          id?: string
          section?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_form_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_job_roles: {
        Row: {
          company_id: string | null
          created_at: string
          currency: string | null
          employee_id: string
          end_date: string | null
          id: string
          is_primary: boolean | null
          job_role_id: string
          pay_rate: number | null
          start_date: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          currency?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          job_role_id: string
          pay_rate?: number | null
          start_date?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          currency?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          job_role_id?: string
          pay_rate?: number | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_job_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_job_roles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_job_roles_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_reviews: {
        Row: {
          career_history_id: string | null
          category: string
          company_id: string | null
          completed_by: string | null
          completed_date: string | null
          created_at: string
          custom_fields: Json | null
          employee_id: string
          employee_notes: string | null
          id: string
          outcome: string | null
          review_type: string
          review_type_template_id: string | null
          reviewer_notes: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          career_history_id?: string | null
          category?: string
          company_id?: string | null
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          custom_fields?: Json | null
          employee_id: string
          employee_notes?: string | null
          id?: string
          outcome?: string | null
          review_type: string
          review_type_template_id?: string | null
          reviewer_notes?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          career_history_id?: string | null
          category?: string
          company_id?: string | null
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          custom_fields?: Json | null
          employee_id?: string
          employee_notes?: string | null
          id?: string
          outcome?: string | null
          review_type?: string
          review_type_template_id?: string | null
          reviewer_notes?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_reviews_career_history_id_fkey"
            columns: ["career_history_id"]
            isOneToOne: false
            referencedRelation: "career_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_reviews_review_type_template_id_fkey"
            columns: ["review_type_template_id"]
            isOneToOne: false
            referencedRelation: "review_type_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: Json | null
          bank_details: Json | null
          company_id: string | null
          created_at: string
          custom_fields: Json | null
          date_of_birth: string | null
          department: string | null
          email: string
          emergency_contact: Json | null
          employment_type: string | null
          first_name: string
          hire_date: string | null
          id: string
          job_title: string | null
          known_as: string | null
          last_name: string
          location: string | null
          national_insurance_number: string | null
          passport_number: string | null
          pay_rate: number | null
          pay_type: string | null
          phone_number: string | null
          profile_picture: string | null
          right_to_work_status: string | null
          tax_code: string | null
          updated_at: string
          visa_expiry: string | null
          work_email: string | null
        }
        Insert: {
          address?: Json | null
          bank_details?: Json | null
          company_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          date_of_birth?: string | null
          department?: string | null
          email: string
          emergency_contact?: Json | null
          employment_type?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          known_as?: string | null
          last_name: string
          location?: string | null
          national_insurance_number?: string | null
          passport_number?: string | null
          pay_rate?: number | null
          pay_type?: string | null
          phone_number?: string | null
          profile_picture?: string | null
          right_to_work_status?: string | null
          tax_code?: string | null
          updated_at?: string
          visa_expiry?: string | null
          work_email?: string | null
        }
        Update: {
          address?: Json | null
          bank_details?: Json | null
          company_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          date_of_birth?: string | null
          department?: string | null
          email?: string
          emergency_contact?: Json | null
          employment_type?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          known_as?: string | null
          last_name?: string
          location?: string | null
          national_insurance_number?: string | null
          passport_number?: string | null
          pay_rate?: number | null
          pay_type?: string | null
          phone_number?: string | null
          profile_picture?: string | null
          right_to_work_status?: string | null
          tax_code?: string | null
          updated_at?: string
          visa_expiry?: string | null
          work_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_entitlement: {
        Row: {
          company_id: string | null
          created_at: string
          employee_id: string
          id: string
          remaining_hours: number | null
          total_hours: number | null
          updated_at: string
          used_hours: number | null
          year: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          employee_id: string
          id?: string
          remaining_hours?: number | null
          total_hours?: number | null
          updated_at?: string
          used_hours?: number | null
          year: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          remaining_hours?: number | null
          total_hours?: number | null
          updated_at?: string
          used_hours?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "holiday_entitlement_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holiday_entitlement_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_requests: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          comments: string | null
          company_id: string | null
          created_at: string
          employee_id: string | null
          employee_name: string | null
          end_date: string
          hours_requested: number | null
          id: string
          reason: string | null
          start_date: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          comments?: string | null
          company_id?: string | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          end_date: string
          hours_requested?: number | null
          id?: string
          reason?: string | null
          start_date: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          comments?: string | null
          company_id?: string | null
          created_at?: string
          employee_id?: string | null
          employee_name?: string | null
          end_date?: string
          hours_requested?: number | null
          id?: string
          reason?: string | null
          start_date?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holiday_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holiday_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          company_id: string | null
          created_at: string
          department: string | null
          id: string
          location: string | null
          pay_rate: number | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          id?: string
          location?: string | null
          pay_rate?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          id?: string
          location?: string | null
          pay_rate?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lookup_lists: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          value: string
        }
        Insert: {
          category: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          value: string
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "lookup_lists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_sets: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          items: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          items?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          items?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_sets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          key: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          key: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          key?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          message_template: string
          name: string
          title_template: string
          trigger_event: string
          type: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          message_template: string
          name: string
          title_template: string
          trigger_event: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          message_template?: string
          name?: string
          title_template?: string
          trigger_event?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string
          id: string
          marked_read_at: string | null
          message: string
          read: boolean | null
          seen_at: string | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          marked_read_at?: string | null
          message: string
          read?: boolean | null
          seen_at?: string | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          marked_read_at?: string | null
          message?: string
          read?: boolean | null
          seen_at?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_rates: {
        Row: {
          career_history_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          effective_from: string
          effective_to: string | null
          employee_id: string | null
          employee_job_role_id: string | null
          id: string
          job_role_id: string | null
          pay_rate: number
          pay_type: string
          reason: string | null
        }
        Insert: {
          career_history_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from: string
          effective_to?: string | null
          employee_id?: string | null
          employee_job_role_id?: string | null
          id?: string
          job_role_id?: string | null
          pay_rate: number
          pay_type?: string
          reason?: string | null
        }
        Update: {
          career_history_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          employee_id?: string | null
          employee_job_role_id?: string | null
          id?: string
          job_role_id?: string | null
          pay_rate?: number
          pay_type?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pay_rates_career_history_id_fkey"
            columns: ["career_history_id"]
            isOneToOne: false
            referencedRelation: "career_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_rates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_rates_employee_job_role_id_fkey"
            columns: ["employee_job_role_id"]
            isOneToOne: false
            referencedRelation: "employee_job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_rates_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_group_permissions: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          location: string | null
          permission_group_id: string
          permission_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          permission_group_id: string
          permission_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          permission_group_id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_group_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_group_permissions_permission_group_id_fkey"
            columns: ["permission_group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_group_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_groups: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      position_pay_rates: {
        Row: {
          company_id: string | null
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          pay_rate: number
          pay_type: string
          position: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          pay_rate: number
          pay_type?: string
          position: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          pay_rate?: number
          pay_type?: string
          position?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_pay_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          company_id: string | null
          created_at: string
          department: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          menu_set_id: string | null
          name: string
          type: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          menu_set_id?: string | null
          name: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          menu_set_id?: string | null
          name?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          company_id: string | null
          created_at: string
          email: string | null
          employee_id: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          employee_id?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          employee_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      review_type_templates: {
        Row: {
          auto_create_on_hire: boolean | null
          auto_schedule: boolean | null
          category: string
          company_id: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          schedule_count: number | null
          schedule_interval_days: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          auto_create_on_hire?: boolean | null
          auto_schedule?: boolean | null
          category?: string
          company_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          schedule_count?: number | null
          schedule_interval_days?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          auto_create_on_hire?: boolean | null
          auto_schedule?: boolean | null
          category?: string
          company_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          schedule_count?: number | null
          schedule_interval_days?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_type_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_allocation_locations: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          roster_template_id: string
          sort_order: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          roster_template_id: string
          sort_order?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          roster_template_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "roster_allocation_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_allocation_locations_roster_template_id_fkey"
            columns: ["roster_template_id"]
            isOneToOne: false
            referencedRelation: "roster_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_categories: {
        Row: {
          company_id: string | null
          created_at: string
          department: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_daily_allocations: {
        Row: {
          allocation_location_id: string
          company_id: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          roster_template_id: string
        }
        Insert: {
          allocation_location_id: string
          company_id?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          roster_template_id: string
        }
        Update: {
          allocation_location_id?: string
          company_id?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          roster_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_daily_allocations_allocation_location_id_fkey"
            columns: ["allocation_location_id"]
            isOneToOne: false
            referencedRelation: "roster_allocation_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_daily_allocations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_daily_allocations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_daily_allocations_roster_template_id_fkey"
            columns: ["roster_template_id"]
            isOneToOne: false
            referencedRelation: "roster_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_section_role_rules: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          job_role_id: string
          section_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          job_role_id: string
          section_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          job_role_id?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_section_role_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_section_role_rules_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_section_role_rules_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "roster_template_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_staff_assignments: {
        Row: {
          company_id: string | null
          created_at: string
          employee_id: string
          id: string
          is_active: boolean | null
          roster_category_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          employee_id: string
          id?: string
          is_active?: boolean | null
          roster_category_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          is_active?: boolean | null
          roster_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_staff_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_staff_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_staff_assignments_roster_category_id_fkey"
            columns: ["roster_category_id"]
            isOneToOne: false
            referencedRelation: "roster_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_template_assignments: {
        Row: {
          company_id: string | null
          created_at: string
          day_of_period: number | null
          employee_id: string
          id: string
          roster_template_id: string
          section_id: string | null
          shift_template_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          day_of_period?: number | null
          employee_id: string
          id?: string
          roster_template_id: string
          section_id?: string | null
          shift_template_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          day_of_period?: number | null
          employee_id?: string
          id?: string
          roster_template_id?: string
          section_id?: string | null
          shift_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_template_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_template_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_template_assignments_roster_template_id_fkey"
            columns: ["roster_template_id"]
            isOneToOne: false
            referencedRelation: "roster_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_template_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "roster_template_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_template_assignments_shift_template_id_fkey"
            columns: ["shift_template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_template_sections: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          roster_template_id: string
          sort_order: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          roster_template_id: string
          sort_order?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          roster_template_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "roster_template_sections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_template_sections_roster_template_id_fkey"
            columns: ["roster_template_id"]
            isOneToOne: false
            referencedRelation: "roster_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_templates: {
        Row: {
          allow_allocations: boolean
          category_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          repeat_interval: number | null
          repeat_type: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          allow_allocations?: boolean
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          repeat_interval?: number | null
          repeat_type?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          allow_allocations?: boolean
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          repeat_interval?: number | null
          repeat_type?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "roster_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string
          end_time: string
          id: string
          name: string
          pay_value: number | null
          position: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          name: string
          pay_value?: number | null
          position?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          name?: string
          pay_value?: number | null
          position?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          actual_job_role_id: string | null
          company_id: string | null
          created_at: string
          date: string
          employee_id: string
          end_time: string
          id: string
          job_role_id: string | null
          pay_rate: number | null
          position: string | null
          roster_template_id: string | null
          section_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          actual_job_role_id?: string | null
          company_id?: string | null
          created_at?: string
          date: string
          employee_id: string
          end_time: string
          id?: string
          job_role_id?: string | null
          pay_rate?: number | null
          position?: string | null
          roster_template_id?: string | null
          section_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          actual_job_role_id?: string | null
          company_id?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          end_time?: string
          id?: string
          job_role_id?: string | null
          pay_rate?: number | null
          position?: string | null
          roster_template_id?: string | null
          section_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_actual_job_role_id_fkey"
            columns: ["actual_job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_roster_template_id_fkey"
            columns: ["roster_template_id"]
            isOneToOne: false
            referencedRelation: "roster_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "roster_template_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      template_shifts: {
        Row: {
          company_id: string | null
          created_at: string
          day_index: number
          employee_id: string
          id: string
          job_role_id: string | null
          pay_rate: number | null
          roster_template_id: string
          shift_template_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          day_index?: number
          employee_id: string
          id?: string
          job_role_id?: string | null
          pay_rate?: number | null
          roster_template_id: string
          shift_template_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          day_index?: number
          employee_id?: string
          id?: string
          job_role_id?: string | null
          pay_rate?: number | null
          roster_template_id?: string
          shift_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_shifts_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_shifts_roster_template_id_fkey"
            columns: ["roster_template_id"]
            isOneToOne: false
            referencedRelation: "roster_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_shifts_shift_template_id_fkey"
            columns: ["shift_template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_records: {
        Row: {
          approval_status: string | null
          approved_by: string | null
          clock_in_accuracy: number | null
          clock_in_latitude: number | null
          clock_in_longitude: number | null
          clock_in_photo_url: string | null
          clock_in_time: string | null
          clock_out_accuracy: number | null
          clock_out_latitude: number | null
          clock_out_longitude: number | null
          clock_out_photo_url: string | null
          clock_out_time: string | null
          company_id: string | null
          created_at: string
          discrepancy_type: string | null
          early_minutes_paid: number | null
          employee_id: string
          id: string
          late_minutes_paid: number | null
          notes: string | null
          processed_at: string | null
          scheduled_minutes_paid: number | null
          shift_date: string | null
          shift_end_time: string | null
          shift_id: string | null
          shift_start_time: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          approved_by?: string | null
          clock_in_accuracy?: number | null
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_in_photo_url?: string | null
          clock_in_time?: string | null
          clock_out_accuracy?: number | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          clock_out_photo_url?: string | null
          clock_out_time?: string | null
          company_id?: string | null
          created_at?: string
          discrepancy_type?: string | null
          early_minutes_paid?: number | null
          employee_id: string
          id?: string
          late_minutes_paid?: number | null
          notes?: string | null
          processed_at?: string | null
          scheduled_minutes_paid?: number | null
          shift_date?: string | null
          shift_end_time?: string | null
          shift_id?: string | null
          shift_start_time?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          approved_by?: string | null
          clock_in_accuracy?: number | null
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_in_photo_url?: string | null
          clock_in_time?: string | null
          clock_out_accuracy?: number | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          clock_out_photo_url?: string | null
          clock_out_time?: string | null
          company_id?: string | null
          created_at?: string
          discrepancy_type?: string | null
          early_minutes_paid?: number | null
          employee_id?: string
          id?: string
          late_minutes_paid?: number | null
          notes?: string | null
          processed_at?: string | null
          scheduled_minutes_paid?: number | null
          shift_date?: string | null
          shift_end_time?: string | null
          shift_id?: string | null
          shift_start_time?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_records_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      time_segments: {
        Row: {
          company_id: string | null
          created_at: string
          end_time: string | null
          hours: number | null
          id: string
          minutes_paid: number | null
          minutes_worked: number | null
          pay_rate: number | null
          pay_status: string | null
          segment_type: string
          start_time: string | null
          time_clock_record_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          end_time?: string | null
          hours?: number | null
          id?: string
          minutes_paid?: number | null
          minutes_worked?: number | null
          pay_rate?: number | null
          pay_status?: string | null
          segment_type?: string
          start_time?: string | null
          time_clock_record_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          end_time?: string | null
          hours?: number | null
          id?: string
          minutes_paid?: number | null
          minutes_worked?: number | null
          pay_rate?: number | null
          pay_status?: string | null
          segment_type?: string
          start_time?: string | null
          time_clock_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_segments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_segments_time_clock_record_id_fkey"
            columns: ["time_clock_record_id"]
            isOneToOne: false
            referencedRelation: "time_clock_records"
            referencedColumns: ["id"]
          },
        ]
      }
      user_location_permissions: {
        Row: {
          created_at: string
          id: string
          location: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          user_id?: string
        }
        Relationships: []
      }
      user_menu_overrides: {
        Row: {
          created_at: string
          id: string
          menu_key: string
          user_id: string
          visible: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          menu_key: string
          user_id: string
          visible?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          menu_key?: string
          user_id?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          location: string | null
          override_type: string | null
          permission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          override_type?: string | null
          permission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          override_type?: string | null
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          is_active: boolean | null
          location: string | null
          permission_group_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          permission_group_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          permission_group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_permission_group_id_fkey"
            columns: ["permission_group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_default_permissions_to_user: {
        Args: { _user_id: string }
        Returns: undefined
      }
      company_has_module: {
        Args: { _company_id: string; _module_key: string }
        Returns: boolean
      }
      current_user_employee_id: { Args: never; Returns: string }
      get_effective_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          location: string
          permission_category: string
          permission_name: string
          source: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      user_can_edit_employees: { Args: { _user_id: string }; Returns: boolean }
      user_can_view_employees: { Args: { _user_id: string }; Returns: boolean }
      user_company_id: { Args: { _user_id: string }; Returns: string }
      user_has_effective_permission: {
        Args: {
          p_location?: string
          p_permission_name: string
          p_user_id: string
        }
        Returns: boolean
      }
      user_has_location_access: {
        Args: { _location: string; _user_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { _permission_name: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "hr_user" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "hr_user", "super_admin"],
    },
  },
} as const
