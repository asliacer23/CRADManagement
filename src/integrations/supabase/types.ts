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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          id: string
          is_current: boolean
          semester: string
          year_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean
          semester?: string
          year_label: string
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean
          semester?: string
          year_label?: string
        }
        Relationships: []
      }
      adviser_assignments: {
        Row: {
          adviser_id: string
          assigned_at: string
          assigned_by: string | null
          id: string
          research_id: string
        }
        Insert: {
          adviser_id: string
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          research_id: string
        }
        Update: {
          adviser_id?: string
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          research_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adviser_assignments_adviser_id_profiles_fkey"
            columns: ["adviser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "adviser_assignments_assigned_by_profiles_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "adviser_assignments_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_profiles_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      defense_panel_members: {
        Row: {
          defense_id: string
          id: string
          panelist_id: string
          role: string
        }
        Insert: {
          defense_id: string
          id?: string
          panelist_id: string
          role?: string
        }
        Update: {
          defense_id?: string
          id?: string
          panelist_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "defense_panel_members_defense_id_fkey"
            columns: ["defense_id"]
            isOneToOne: false
            referencedRelation: "defense_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defense_panel_members_panelist_id_profiles_fkey"
            columns: ["panelist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      defense_schedules: {
        Row: {
          created_at: string
          created_by: string
          defense_date: string
          defense_time: string
          id: string
          notes: string | null
          research_id: string
          room: string
          status: Database["public"]["Enums"]["defense_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          defense_date: string
          defense_time: string
          id?: string
          notes?: string | null
          research_id: string
          room: string
          status?: Database["public"]["Enums"]["defense_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          defense_date?: string
          defense_time?: string
          id?: string
          notes?: string | null
          research_id?: string
          room?: string
          status?: Database["public"]["Enums"]["defense_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "defense_schedules_created_by_profiles_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "defense_schedules_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["id"]
          },
        ]
      }
      defense_grades: {
        Row: {
          created_at: string
          defense_id: string
          grade: number
          id: string
          panelist_id: string
          remarks: string | null
          research_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          defense_id: string
          grade: number
          id?: string
          panelist_id: string
          remarks?: string | null
          research_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          defense_id?: string
          grade?: number
          id?: string
          panelist_id?: string
          remarks?: string | null
          research_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "defense_grades_defense_id_fkey"
            columns: ["defense_id"]
            isOneToOne: false
            referencedRelation: "defense_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defense_grades_panelist_id_profiles_fkey"
            columns: ["panelist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "defense_grades_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      final_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          remarks: string | null
          research_id: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          remarks?: string | null
          research_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          remarks?: string | null
          research_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "final_approvals_approved_by_profiles_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "final_approvals_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["id"]
          },
        ]
      }
      manuscripts: {
        Row: {
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          research_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["manuscript_status"]
          updated_at: string
          uploaded_by: string
          version_notes: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          research_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["manuscript_status"]
          updated_at?: string
          uploaded_by: string
          version_notes?: string | null
          version_number?: number
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          research_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["manuscript_status"]
          updated_at?: string
          uploaded_by?: string
          version_notes?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "manuscripts_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manuscripts_reviewed_by_profiles_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manuscripts_uploaded_by_profiles_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_code: string
          proof_file_name: string | null
          proof_url: string | null
          research_id: string
          status: Database["public"]["Enums"]["payment_status"]
          submitted_by: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_code: string
          proof_file_name?: string | null
          proof_url?: string | null
          research_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_by: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_code?: string
          proof_file_name?: string | null
          proof_url?: string | null
          research_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_by?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_submitted_by_profiles_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_verified_by_profiles_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          student_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          student_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          student_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      remarks: {
        Row: {
          author_id: string
          created_at: string
          id: string
          manuscript_id: string | null
          message: string
          research_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          manuscript_id?: string | null
          message: string
          research_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          manuscript_id?: string | null
          message?: string
          research_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remarks_author_id_profiles_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "remarks_manuscript_id_fkey"
            columns: ["manuscript_id"]
            isOneToOne: false
            referencedRelation: "manuscripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remarks_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["id"]
          },
        ]
      }
      research: {
        Row: {
          abstract: string | null
          academic_year_id: string | null
          category_id: string | null
          created_at: string
          department_id: string | null
          id: string
          research_code: string
          status: Database["public"]["Enums"]["research_status"]
          submitted_by: string
          title: string
          updated_at: string
        }
        Insert: {
          abstract?: string | null
          academic_year_id?: string | null
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          research_code: string
          status?: Database["public"]["Enums"]["research_status"]
          submitted_by: string
          title: string
          updated_at?: string
        }
        Update: {
          abstract?: string | null
          academic_year_id?: string | null
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          research_code?: string
          status?: Database["public"]["Enums"]["research_status"]
          submitted_by?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "research_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_submitted_by_profiles_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      research_categories: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_categories_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      research_members: {
        Row: {
          created_at: string
          id: string
          is_leader: boolean
          member_name: string
          research_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_leader?: boolean
          member_name: string
          research_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_leader?: boolean
          member_name?: string
          research_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_members_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
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
      create_audit_log: {
        Args: {
          _action: string
          _details?: string
          _entity_id?: string
          _entity_type?: string
        }
        Returns: undefined
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "adviser" | "staff" | "admin"
      defense_status: "scheduled" | "completed" | "cancelled" | "postponed"
      manuscript_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "revision_needed"
        | "approved"
        | "rejected"
      notification_type:
        | "research"
        | "manuscript"
        | "payment"
        | "defense"
        | "system"
        | "announcement"
      payment_status: "pending" | "submitted" | "verified" | "rejected"
      research_status:
        | "draft"
        | "pending"
        | "review"
        | "revision"
        | "approved"
        | "rejected"
        | "archived"
        | "completed"
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
      app_role: ["student", "adviser", "staff", "admin"],
      defense_status: ["scheduled", "completed", "cancelled", "postponed"],
      manuscript_status: [
        "draft",
        "submitted",
        "under_review",
        "revision_needed",
        "approved",
        "rejected",
      ],
      notification_type: [
        "research",
        "manuscript",
        "payment",
        "defense",
        "system",
        "announcement",
      ],
      payment_status: ["pending", "submitted", "verified", "rejected"],
      research_status: [
        "draft",
        "pending",
        "review",
        "revision",
        "approved",
        "rejected",
        "archived",
        "completed",
      ],
    },
  },
} as const
