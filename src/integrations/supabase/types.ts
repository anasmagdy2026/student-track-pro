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
      alert_events: {
        Row: {
          context: Json
          created_at: string
          id: string
          message: string
          resolved_at: string | null
          rule_code: string
          severity: string
          status: string
          student_id: string
          title: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          message: string
          resolved_at?: string | null
          rule_code: string
          severity?: string
          status?: string
          student_id: string
          title: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          message?: string
          resolved_at?: string | null
          rule_code?: string
          severity?: string
          status?: string
          student_id?: string
          title?: string
        }
        Relationships: []
      }
      alert_rules: {
        Row: {
          code: string
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          severity?: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          checked_in_at: string | null
          created_at: string
          date: string
          id: string
          notified: boolean
          present: boolean
          student_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          date: string
          id?: string
          notified?: boolean
          present?: boolean
          student_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          date?: string
          id?: string
          notified?: boolean
          present?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          notified: boolean
          score: number
          student_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          notified?: boolean
          score: number
          student_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          notified?: boolean
          score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          date: string
          grade: string
          id: string
          max_score: number
          name: string
        }
        Insert: {
          created_at?: string
          date: string
          grade: string
          id?: string
          max_score?: number
          name: string
        }
        Update: {
          created_at?: string
          date?: string
          grade?: string
          id?: string
          max_score?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_grade_fkey_grade_levels"
            columns: ["grade"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["code"]
          },
        ]
      }
      grade_levels: {
        Row: {
          code: string
          created_at: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          days: string[]
          grade: string
          id: string
          name: string
          time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days?: string[]
          grade: string
          id?: string
          name: string
          time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days?: string[]
          grade?: string
          id?: string
          name?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_grade_fkey_grade_levels"
            columns: ["grade"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["code"]
          },
        ]
      }
      lesson_homework: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          note: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          note?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          note?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_recitations: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          score: number
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          score: number
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_recitations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_recitations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_sheets: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          score: number
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          score: number
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sheets_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_sheets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          date: string
          grade: string
          group_id: string | null
          id: string
          name: string
          recitation_max_score: number
          sheet_max_score: number
        }
        Insert: {
          created_at?: string
          date: string
          grade: string
          group_id?: string | null
          id?: string
          name: string
          recitation_max_score?: number
          sheet_max_score?: number
        }
        Update: {
          created_at?: string
          date?: string
          grade?: string
          group_id?: string | null
          id?: string
          name?: string
          recitation_max_score?: number
          sheet_max_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_grade_fkey_grade_levels"
            columns: ["grade"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "lessons_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          month: string
          notified: boolean
          paid: boolean
          paid_at: string | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          month: string
          notified?: boolean
          paid?: boolean
          paid_at?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month?: string
          notified?: boolean
          paid?: boolean
          paid_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      student_blocks: {
        Row: {
          block_type: string
          created_at: string
          id: string
          is_active: boolean
          reason: string | null
          student_id: string
          triggered_by_rule_code: string | null
          updated_at: string
        }
        Insert: {
          block_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          student_id: string
          triggered_by_rule_code?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          student_id?: string
          triggered_by_rule_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          code: string
          created_at: string
          grade: string
          group_id: string | null
          id: string
          monthly_fee: number
          name: string
          parent_phone: string
          registered_at: string
          student_phone: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          grade: string
          group_id?: string | null
          id?: string
          monthly_fee?: number
          name: string
          parent_phone: string
          registered_at?: string
          student_phone?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          grade?: string
          group_id?: string | null
          id?: string
          monthly_fee?: number
          name?: string
          parent_phone?: string
          registered_at?: string
          student_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_grade_fkey_grade_levels"
            columns: ["grade"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "students_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
