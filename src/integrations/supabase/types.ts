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
          created_at: string
          end_date: string | null
          id: string
          roster_template_id: string
          start_date: string | null
        }
        Insert: {
          applied_by?: string | null
          applied_date: string
          created_at?: string
          end_date?: string | null
          id?: string
          roster_template_id: string
          start_date?: string | null
        }
        Update: {
          applied_by?: string | null
          applied_date?: string
          created_at?: string
          end_date?: string | null
          id?: string
          roster_template_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applied_roster_templates_roster_template_id_fkey"
            columns: ["roster_template_id"]
            isOneToOne: false
            referencedRelation: "roster_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_position_rules: {
        Row: {
          created_at: string
          id: string
          permission_group_id: string
          position: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_group_id: string
          position: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_group_id?: string
          position?: string
        }
        Relationships: [
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
          created_at: string
          id: string
          job_role: string
          permission_group_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_role: string
          permission_group_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_role?: string
          permission_group_id?: string
        }
        Relationships: [
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
            foreignKeyName: "career_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          body: string | null
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
          created_at?: string
          error_message?: string | null
          id?: string
          recipient?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      employee_drafts: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_job_roles: {
        Row: {
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
      employees: {
        Row: {
          address: Json | null
          bank_details: Json | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string
          emergency_contact: Json | null
          employment_type: string | null
          first_name: string
          hire_date: string | null
          id: string
          job_title: string | null
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
        }
        Insert: {
          address?: Json | null
          bank_details?: Json | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email: string
          emergency_contact?: Json | null
          employment_type?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
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
        }
        Update: {
          address?: Json | null
          bank_details?: Json | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string
          emergency_contact?: Json | null
          employment_type?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
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
        }
        Relationships: []
      }
      holiday_entitlement: {
        Row: {
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
          created_at: string
          department: string | null
          id: string
          location: string | null
          pay_rate: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          location?: string | null
          pay_rate?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          location?: string | null
          pay_rate?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lookup_lists: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          value?: string
        }
        Relationships: []
      }
      menu_sets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          items: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          items?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          items?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          category: string | null
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
        Relationships: []
      }
      notifications: {
        Row: {
          category: string | null
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
        Relationships: []
      }
      permission_group_permissions: {
        Row: {
          created_at: string
          id: string
          location: string | null
          permission_group_id: string
          permission_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          permission_group_id: string
          permission_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          permission_group_id?: string
          permission_id?: string
        }
        Relationships: [
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
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          department: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          menu_set_id: string | null
          name: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          menu_set_id?: string | null
          name: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          menu_set_id?: string | null
          name?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
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
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_categories: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      roster_staff_assignments: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          is_active: boolean | null
          roster_category_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          is_active?: boolean | null
          roster_category_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          is_active?: boolean | null
          roster_category_id?: string
        }
        Relationships: [
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
          created_at: string
          day_of_period: number | null
          employee_id: string
          id: string
          roster_template_id: string
          shift_template_id: string | null
        }
        Insert: {
          created_at?: string
          day_of_period?: number | null
          employee_id: string
          id?: string
          roster_template_id: string
          shift_template_id?: string | null
        }
        Update: {
          created_at?: string
          day_of_period?: number | null
          employee_id?: string
          id?: string
          roster_template_id?: string
          shift_template_id?: string | null
        }
        Relationships: [
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
            foreignKeyName: "roster_template_assignments_shift_template_id_fkey"
            columns: ["shift_template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_templates: {
        Row: {
          category_id: string | null
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
          category_id?: string | null
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
          category_id?: string | null
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
        ]
      }
      shift_templates: {
        Row: {
          color: string | null
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
          created_at?: string
          end_time?: string
          id?: string
          name?: string
          pay_value?: number | null
          position?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          actual_job_role_id: string | null
          created_at: string
          date: string
          employee_id: string
          end_time: string
          id: string
          job_role_id: string | null
          pay_rate: number | null
          position: string | null
          roster_template_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          actual_job_role_id?: string | null
          created_at?: string
          date: string
          employee_id: string
          end_time: string
          id?: string
          job_role_id?: string | null
          pay_rate?: number | null
          position?: string | null
          roster_template_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          actual_job_role_id?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          end_time?: string
          id?: string
          job_role_id?: string | null
          pay_rate?: number | null
          position?: string | null
          roster_template_id?: string | null
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
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_shifts: {
        Row: {
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
          clock_in_time: string | null
          clock_out_time: string | null
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
          clock_in_time?: string | null
          clock_out_time?: string | null
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
          clock_in_time?: string | null
          clock_out_time?: string | null
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
      user_can_edit_employees: { Args: { _user_id: string }; Returns: boolean }
      user_can_view_employees: { Args: { _user_id: string }; Returns: boolean }
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
      app_role: "admin" | "hr_user"
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
      app_role: ["admin", "hr_user"],
    },
  },
} as const
