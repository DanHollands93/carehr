export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          is_current: boolean
          line_1: string
          line_2: string | null
          postcode: string
          start_date: string
          updated_at: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          line_1: string
          line_2?: string | null
          postcode: string
          start_date: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          line_1?: string
          line_2?: string | null
          postcode?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      applied_roster_templates: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          end_date: string
          id: string
          roster_template_id: string
          start_date: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          end_date: string
          id?: string
          roster_template_id: string
          start_date: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          end_date?: string
          id?: string
          roster_template_id?: string
          start_date?: string
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
      career_history: {
        Row: {
          contract_type: string | null
          created_at: string | null
          currency: string
          employee_id: string
          employment_type: string | null
          end_date: string | null
          hours_per_week: number | null
          id: string
          job_role_id: string | null
          job_title: string
          location: string
          notice_period_weeks: number | null
          pay_rate: number
          pay_type: string | null
          probation_end_date: string | null
          reporting_manager_id: string | null
          start_date: string
        }
        Insert: {
          contract_type?: string | null
          created_at?: string | null
          currency?: string
          employee_id: string
          employment_type?: string | null
          end_date?: string | null
          hours_per_week?: number | null
          id?: string
          job_role_id?: string | null
          job_title: string
          location: string
          notice_period_weeks?: number | null
          pay_rate: number
          pay_type?: string | null
          probation_end_date?: string | null
          reporting_manager_id?: string | null
          start_date: string
        }
        Update: {
          contract_type?: string | null
          created_at?: string | null
          currency?: string
          employee_id?: string
          employment_type?: string | null
          end_date?: string | null
          hours_per_week?: number | null
          id?: string
          job_role_id?: string | null
          job_title?: string
          location?: string
          notice_period_weeks?: number | null
          pay_rate?: number
          pay_type?: string | null
          probation_end_date?: string | null
          reporting_manager_id?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_positions"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "career_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_history_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_history_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "current_employee_positions"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "career_history_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          email_service: string | null
          email_type: string
          error_message: string | null
          external_id: string | null
          id: string
          recipient_email: string
          sender_user_id: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          email_service?: string | null
          email_type: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          recipient_email: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string | null
          email_service?: string | null
          email_type?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          recipient_email?: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      employee_drafts: {
        Row: {
          career_history: Json | null
          created_at: string | null
          current_step: string
          data: Json
          id: string
          last_updated: string | null
          salary: number | null
          status: string
        }
        Insert: {
          career_history?: Json | null
          created_at?: string | null
          current_step?: string
          data?: Json
          id?: string
          last_updated?: string | null
          salary?: number | null
          status?: string
        }
        Update: {
          career_history?: Json | null
          created_at?: string | null
          current_step?: string
          data?: Json
          id?: string
          last_updated?: string | null
          salary?: number | null
          status?: string
        }
        Relationships: []
      }
      employee_job_roles: {
        Row: {
          created_at: string | null
          currency: string | null
          employee_id: string
          end_date: string | null
          id: string
          is_primary: boolean | null
          job_role_id: string
          pay_rate: number
          start_date: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          job_role_id: string
          pay_rate?: number
          start_date?: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          job_role_id?: string
          pay_rate?: number
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_job_roles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_positions"
            referencedColumns: ["employee_id"]
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
      employees: {
        Row: {
          address: Json | null
          bank_details: Json | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          email: string
          emergency_contact: Json | null
          first_name: string
          hire_date: string | null
          id: string
          is_admin: boolean | null
          job_role_id: string | null
          last_name: string
          national_insurance_number: string | null
          passport_number: string | null
          phone_number: string | null
          profile_picture: string | null
          right_to_work_status: string | null
          tax_code: string | null
          visa_expiry: string | null
        }
        Insert: {
          address?: Json | null
          bank_details?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email: string
          emergency_contact?: Json | null
          first_name: string
          hire_date?: string | null
          id?: string
          is_admin?: boolean | null
          job_role_id?: string | null
          last_name: string
          national_insurance_number?: string | null
          passport_number?: string | null
          phone_number?: string | null
          profile_picture?: string | null
          right_to_work_status?: string | null
          tax_code?: string | null
          visa_expiry?: string | null
        }
        Update: {
          address?: Json | null
          bank_details?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string
          emergency_contact?: Json | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_admin?: boolean | null
          job_role_id?: string | null
          last_name?: string
          national_insurance_number?: string | null
          passport_number?: string | null
          phone_number?: string | null
          profile_picture?: string | null
          right_to_work_status?: string | null
          tax_code?: string | null
          visa_expiry?: string | null
        }
        Relationships: []
      }
      holiday_entitlement: {
        Row: {
          created_at: string | null
          entitlement_hours: number
          id: string
          job_role_id: string
          year_end: string
          year_start: string
        }
        Insert: {
          created_at?: string | null
          entitlement_hours?: number
          id?: string
          job_role_id: string
          year_end: string
          year_start: string
        }
        Update: {
          created_at?: string | null
          entitlement_hours?: number
          id?: string
          job_role_id?: string
          year_end?: string
          year_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "holiday_entitlement_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_requests: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          approver_id: string | null
          comments: string | null
          created_at: string | null
          employee_id: string
          employee_name: string | null
          end_date: string
          hours_requested: number
          id: string
          notes: string | null
          reason: string | null
          start_date: string
          status: string
          submitted_at: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          approver_id?: string | null
          comments?: string | null
          created_at?: string | null
          employee_id: string
          employee_name?: string | null
          end_date: string
          hours_requested: number
          id?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          status?: string
          submitted_at?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          approver_id?: string | null
          comments?: string | null
          created_at?: string | null
          employee_id?: string
          employee_name?: string | null
          end_date?: string
          hours_requested?: number
          id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holiday_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "current_employee_positions"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "holiday_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holiday_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_positions"
            referencedColumns: ["employee_id"]
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
      job_role_approvers: {
        Row: {
          approver_job_role_id: string
          created_at: string | null
          id: string
          job_role_id: string
        }
        Insert: {
          approver_job_role_id: string
          created_at?: string | null
          id?: string
          job_role_id: string
        }
        Update: {
          approver_job_role_id?: string
          created_at?: string | null
          id?: string
          job_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_role_approvers_approver_job_role_id_fkey"
            columns: ["approver_job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_role_approvers_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          created_at: string | null
          currency: string | null
          department: string
          id: string
          is_remote: boolean | null
          line_manager_id: string | null
          location: string
          max_salary: number | null
          min_salary: number | null
          requirements: string[] | null
          responsibilities: string[] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          department: string
          id?: string
          is_remote?: boolean | null
          line_manager_id?: string | null
          location: string
          max_salary?: number | null
          min_salary?: number | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          title: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          department?: string
          id?: string
          is_remote?: boolean | null
          line_manager_id?: string | null
          location?: string
          max_salary?: number | null
          min_salary?: number | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          title?: string
        }
        Relationships: []
      }
      lookup_lists: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          value?: string
        }
        Relationships: []
      }
      menu_sets: {
        Row: {
          created_at: string | null
          description: string
          id: string
          items: Json | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          items?: Json | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          items?: Json | null
          name?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          message_template: string
          name: string
          title_template: string
          trigger_event: string
          type: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          message_template: string
          name: string
          title_template: string
          trigger_event: string
          type?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message_template?: string
          name?: string
          title_template?: string
          trigger_event?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          id: string
          marked_read_at: string | null
          message: string
          read: boolean
          seen_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          marked_read_at?: string | null
          message: string
          read?: boolean
          seen_at?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          marked_read_at?: string | null
          message?: string
          read?: boolean
          seen_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      permission_group_permissions: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          permission_group_id: string
          permission_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          permission_group_id: string
          permission_id: string
        }
        Update: {
          created_at?: string | null
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
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          created_at: string | null
          description: string
          id: string
          menu_set_id: string | null
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          menu_set_id?: string | null
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          menu_set_id?: string | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          employee_id: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          employee_id?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          employee_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_positions"
            referencedColumns: ["employee_id"]
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
      roster_categories: {
        Row: {
          created_at: string | null
          department: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
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
          created_at: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          roster_category_id: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          roster_category_id?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          roster_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_staff_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_positions"
            referencedColumns: ["employee_id"]
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
          created_at: string | null
          day_of_period: number
          employee_id: string
          id: string
          roster_template_id: string
          shift_template_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_period: number
          employee_id: string
          id?: string
          roster_template_id: string
          shift_template_id: string
        }
        Update: {
          created_at?: string | null
          day_of_period?: number
          employee_id?: string
          id?: string
          roster_template_id?: string
          shift_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_template_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee_positions"
            referencedColumns: ["employee_id"]
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
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          repeat_interval: number | null
          repeat_type: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          repeat_interval?: number | null
          repeat_type?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          repeat_interval?: number | null
          repeat_type?: string | null
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
          color: string
          created_at: string | null
          end_time: string
          id: string
          name: string
          pay_value: number | null
          position: string
          start_time: string
        }
        Insert: {
          color: string
          created_at?: string | null
          end_time: string
          id?: string
          name: string
          pay_value?: number | null
          position: string
          start_time: string
        }
        Update: {
          color?: string
          created_at?: string | null
          end_time?: string
          id?: string
          name?: string
          pay_value?: number | null
          position?: string
          start_time?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          actual_job_role_id: string | null
          category_id: string | null
          created_at: string | null
          date: string
          employee_id: string
          end_time: string
          id: string
          job_role_id: string
          pay_rate: number | null
          position: string
          start_time: string
        }
        Insert: {
          actual_job_role_id?: string | null
          category_id?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          end_time: string
          id?: string
          job_role_id: string
          pay_rate?: number | null
          position: string
          start_time: string
        }
        Update: {
          actual_job_role_id?: string | null
          category_id?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          end_time?: string
          id?: string
          job_role_id?: string
          pay_rate?: number | null
          position?: string
          start_time?: string
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
            foreignKeyName: "shifts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "roster_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      template_shifts: {
        Row: {
          created_at: string | null
          day_of_week: number
          employee_id: string
          end_time: string
          id: string
          job_role_id: string
          position: string
          start_time: string
          template_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          employee_id: string
          end_time: string
          id?: string
          job_role_id: string
          position: string
          start_time: string
          template_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          employee_id?: string
          end_time?: string
          id?: string
          job_role_id?: string
          position?: string
          start_time?: string
          template_id?: string
        }
        Relationships: []
      }
      time_clock_records: {
        Row: {
          approval_status: string | null
          approved_by: string | null
          clock_in_time: string | null
          clock_out_time: string | null
          created_at: string | null
          discrepancy_type: string | null
          early_minutes_paid: number | null
          early_minutes_worked: number | null
          early_overtime_status:
            | Database["public"]["Enums"]["overtime_status"]
            | null
          employee_id: string
          expected_end_time: string | null
          expected_start_time: string | null
          id: string
          late_minutes_paid: number | null
          late_minutes_worked: number | null
          late_overtime_status:
            | Database["public"]["Enums"]["overtime_status"]
            | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          scheduled_minutes_paid: number | null
          shift_date: string | null
          shift_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_by?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string | null
          discrepancy_type?: string | null
          early_minutes_paid?: number | null
          early_minutes_worked?: number | null
          early_overtime_status?:
            | Database["public"]["Enums"]["overtime_status"]
            | null
          employee_id: string
          expected_end_time?: string | null
          expected_start_time?: string | null
          id?: string
          late_minutes_paid?: number | null
          late_minutes_worked?: number | null
          late_overtime_status?:
            | Database["public"]["Enums"]["overtime_status"]
            | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          scheduled_minutes_paid?: number | null
          shift_date?: string | null
          shift_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_by?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string | null
          discrepancy_type?: string | null
          early_minutes_paid?: number | null
          early_minutes_worked?: number | null
          early_overtime_status?:
            | Database["public"]["Enums"]["overtime_status"]
            | null
          employee_id?: string
          expected_end_time?: string | null
          expected_start_time?: string | null
          id?: string
          late_minutes_paid?: number | null
          late_minutes_worked?: number | null
          late_overtime_status?:
            | Database["public"]["Enums"]["overtime_status"]
            | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          scheduled_minutes_paid?: number | null
          shift_date?: string | null
          shift_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
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
          created_at: string | null
          end_time: string
          id: string
          minutes_paid: number
          minutes_worked: number
          pay_status: Database["public"]["Enums"]["overtime_status"] | null
          segment_type: string
          start_time: string
          time_clock_record_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          minutes_paid?: number
          minutes_worked: number
          pay_status?: Database["public"]["Enums"]["overtime_status"] | null
          segment_type: string
          start_time: string
          time_clock_record_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          minutes_paid?: number
          minutes_worked?: number
          pay_status?: Database["public"]["Enums"]["overtime_status"] | null
          segment_type?: string
          start_time?: string
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
          created_at: string | null
          id: string
          is_visible: boolean
          location: string | null
          menu_item: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_visible: boolean
          location?: string | null
          menu_item: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_visible?: boolean
          location?: string | null
          menu_item?: string
          user_id?: string
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
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          location: string | null
          permission_group_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          permission_group_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
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
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          location: string | null
          name: string
          permissions: string[] | null
          role: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          location?: string | null
          name: string
          permissions?: string[] | null
          role: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          location?: string | null
          name?: string
          permissions?: string[] | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      current_employee_positions: {
        Row: {
          contract_type: string | null
          department: string | null
          email: string | null
          employee_id: string | null
          employment_type: string | null
          first_name: string | null
          hours_per_week: number | null
          job_title: string | null
          last_name: string | null
          location: string | null
          manager_name: string | null
          pay_rate: number | null
          pay_type: string | null
          reporting_manager_id: string | null
          start_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_history_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "current_employee_positions"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "career_history_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assign_default_permissions_to_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      check_missing_clock_ins: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_employees_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_job_roles_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_roster_templates_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_shift_templates_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_shifts_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_template_shifts_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      current_user_employee_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_effective_user_permissions: {
        Args: { p_user_id: string; p_location?: string }
        Returns: {
          permission_name: string
          permission_category: string
          location: string
          source: string
        }[]
      }
      get_employee_career_history: {
        Args: { p_employee_id: string }
        Returns: {
          id: string
          employee_id: string
          job_title: string
          location: string
          start_date: string
          end_date: string
          pay_rate: number
          currency: string
          created_at: string
        }[]
      }
      get_employee_drafts: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          status: string
          currentstep: string
          data: Json
          lastupdated: string
          createdat: string
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      user_can_create_employees: {
        Args: { _location?: string }
        Returns: boolean
      }
      user_can_delete_employees: {
        Args: { _location?: string }
        Returns: boolean
      }
      user_can_edit_employees: {
        Args: { _location?: string }
        Returns: boolean
      }
      user_can_edit_roster: {
        Args: { _location?: string }
        Returns: boolean
      }
      user_can_manage_settings: {
        Args: { _location?: string }
        Returns: boolean
      }
      user_can_view_employees: {
        Args: { _location?: string }
        Returns: boolean
      }
      user_can_view_reports: {
        Args: { _location?: string }
        Returns: boolean
      }
      user_can_view_roster: {
        Args: { _location?: string }
        Returns: boolean
      }
      user_has_effective_permission: {
        Args: {
          p_user_id: string
          p_permission_name: string
          p_location?: string
        }
        Returns: boolean
      }
      user_has_location_access: {
        Args: { _user_id: string; _location: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { _user_id: string; _permission_name: string; _location?: string }
        Returns: boolean
      }
      validate_notification_template: {
        Args: { title_template: string; message_template: string }
        Returns: boolean
      }
    }
    Enums: {
      overtime_status: "unpaid" | "paid" | "pending"
      user_role: "admin" | "hr_user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      overtime_status: ["unpaid", "paid", "pending"],
      user_role: ["admin", "hr_user"],
    },
  },
} as const
