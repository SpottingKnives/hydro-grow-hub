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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      environment_parameters: {
        Row: {
          environment_id: string
          parameter_id: string
        }
        Insert: {
          environment_id: string
          parameter_id: string
        }
        Update: {
          environment_id?: string
          parameter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "environment_parameters_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environment_parameters_parameter_id_fkey"
            columns: ["parameter_id"]
            isOneToOne: false
            referencedRelation: "parameters"
            referencedColumns: ["id"]
          },
        ]
      }
      environment_tasks: {
        Row: {
          created_at: string
          environment_id: string
          id: string
          name: string
          trigger_offset_days: number
          trigger_stage: Database["public"]["Enums"]["grow_stage"] | null
          trigger_type: Database["public"]["Enums"]["task_trigger_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          environment_id: string
          id?: string
          name: string
          trigger_offset_days?: number
          trigger_stage?: Database["public"]["Enums"]["grow_stage"] | null
          trigger_type: Database["public"]["Enums"]["task_trigger_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          environment_id?: string
          id?: string
          name?: string
          trigger_offset_days?: number
          trigger_stage?: Database["public"]["Enums"]["grow_stage"] | null
          trigger_type?: Database["public"]["Enums"]["task_trigger_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "environment_tasks_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
        ]
      }
      environments: {
        Row: {
          created_at: string
          id: string
          name: string
          site_count: number
          supported_stages: Database["public"]["Enums"]["grow_stage"][]
          system_description: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          site_count?: number
          supported_stages?: Database["public"]["Enums"]["grow_stage"][]
          system_description?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          site_count?: number
          supported_stages?: Database["public"]["Enums"]["grow_stage"][]
          system_description?: string
          updated_at?: string
        }
        Relationships: []
      }
      feed_logs: {
        Row: {
          additives: Json
          created_at: string
          ec_measured: number | null
          feed_schedule_id: string | null
          grow_cycle_id: string
          id: string
          liters: number
          nutrients: Json
          stage: Database["public"]["Enums"]["grow_stage"]
          timestamp: string
          treatments: Json
        }
        Insert: {
          additives?: Json
          created_at?: string
          ec_measured?: number | null
          feed_schedule_id?: string | null
          grow_cycle_id: string
          id?: string
          liters: number
          nutrients?: Json
          stage: Database["public"]["Enums"]["grow_stage"]
          timestamp?: string
          treatments?: Json
        }
        Update: {
          additives?: Json
          created_at?: string
          ec_measured?: number | null
          feed_schedule_id?: string | null
          grow_cycle_id?: string
          id?: string
          liters?: number
          nutrients?: Json
          stage?: Database["public"]["Enums"]["grow_stage"]
          timestamp?: string
          treatments?: Json
        }
        Relationships: [
          {
            foreignKeyName: "feed_logs_feed_schedule_id_fkey"
            columns: ["feed_schedule_id"]
            isOneToOne: false
            referencedRelation: "feed_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_logs_grow_cycle_id_fkey"
            columns: ["grow_cycle_id"]
            isOneToOne: false
            referencedRelation: "grow_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_schedule_items: {
        Row: {
          created_at: string
          id: string
          nutrient_id: string
          order_index: number
          schedule_id: string
          stage_values: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nutrient_id: string
          order_index?: number
          schedule_id: string
          stage_values?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nutrient_id?: string
          order_index?: number
          schedule_id?: string
          stage_values?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_schedule_items_nutrient_id_fkey"
            columns: ["nutrient_id"]
            isOneToOne: false
            referencedRelation: "nutrients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_schedule_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "feed_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_schedules: {
        Row: {
          created_at: string
          ec_targets: Json
          id: string
          name: string
          notes: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ec_targets?: Json
          id?: string
          name: string
          notes?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ec_targets?: Json
          id?: string
          name?: string
          notes?: string
          updated_at?: string
        }
        Relationships: []
      }
      grow_cycles: {
        Row: {
          active: boolean
          created_at: string
          current_stage: Database["public"]["Enums"]["grow_stage"]
          feed_mode: Database["public"]["Enums"]["feed_mode"]
          feed_schedule_id: string | null
          flower_weeks: number
          id: string
          name: string
          start_date: string
          updated_at: string
          veg_weeks: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          current_stage?: Database["public"]["Enums"]["grow_stage"]
          feed_mode?: Database["public"]["Enums"]["feed_mode"]
          feed_schedule_id?: string | null
          flower_weeks?: number
          id?: string
          name: string
          start_date: string
          updated_at?: string
          veg_weeks?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          current_stage?: Database["public"]["Enums"]["grow_stage"]
          feed_mode?: Database["public"]["Enums"]["feed_mode"]
          feed_schedule_id?: string | null
          flower_weeks?: number
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
          veg_weeks?: number
        }
        Relationships: [
          {
            foreignKeyName: "grow_cycles_feed_schedule_id_fkey"
            columns: ["feed_schedule_id"]
            isOneToOne: false
            referencedRelation: "feed_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      grow_environment_timeline: {
        Row: {
          created_at: string
          end_date: string | null
          environment_id: string
          environment_name: string
          grow_cycle_id: string
          id: string
          site_count: number
          start_date: string
          supported_stages: Database["public"]["Enums"]["grow_stage"][]
          system_description: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          environment_id: string
          environment_name?: string
          grow_cycle_id: string
          id?: string
          site_count?: number
          start_date?: string
          supported_stages?: Database["public"]["Enums"]["grow_stage"][]
          system_description?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          environment_id?: string
          environment_name?: string
          grow_cycle_id?: string
          id?: string
          site_count?: number
          start_date?: string
          supported_stages?: Database["public"]["Enums"]["grow_stage"][]
          system_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "grow_environment_timeline_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grow_environment_timeline_grow_cycle_id_fkey"
            columns: ["grow_cycle_id"]
            isOneToOne: false
            referencedRelation: "grow_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      grow_events: {
        Row: {
          created_at: string
          description: string
          event_date: string
          grow_cycle_id: string
          id: string
          metadata: Json
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string
          event_date?: string
          grow_cycle_id: string
          id?: string
          metadata?: Json
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          event_date?: string
          grow_cycle_id?: string
          id?: string
          metadata?: Json
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "grow_events_grow_cycle_id_fkey"
            columns: ["grow_cycle_id"]
            isOneToOne: false
            referencedRelation: "grow_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      grow_strains: {
        Row: {
          created_at: string
          flower_weeks: number
          grow_cycle_id: string
          id: string
          plant_count: number
          strain_id: string | null
          strain_name: string
          veg_weeks: number
        }
        Insert: {
          created_at?: string
          flower_weeks: number
          grow_cycle_id: string
          id?: string
          plant_count?: number
          strain_id?: string | null
          strain_name: string
          veg_weeks: number
        }
        Update: {
          created_at?: string
          flower_weeks?: number
          grow_cycle_id?: string
          id?: string
          plant_count?: number
          strain_id?: string | null
          strain_name?: string
          veg_weeks?: number
        }
        Relationships: [
          {
            foreignKeyName: "grow_strains_grow_cycle_id_fkey"
            columns: ["grow_cycle_id"]
            isOneToOne: false
            referencedRelation: "grow_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grow_strains_strain_id_fkey"
            columns: ["strain_id"]
            isOneToOne: false
            referencedRelation: "strains"
            referencedColumns: ["id"]
          },
        ]
      }
      grow_tasks: {
        Row: {
          created_at: string
          due_date: string | null
          generated_from_environment: boolean
          grow_cycle_id: string
          id: string
          name: string
          source_environment_task_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          generated_from_environment?: boolean
          grow_cycle_id: string
          id?: string
          name: string
          source_environment_task_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          generated_from_environment?: boolean
          grow_cycle_id?: string
          id?: string
          name?: string
          source_environment_task_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grow_tasks_grow_cycle_id_fkey"
            columns: ["grow_cycle_id"]
            isOneToOne: false
            referencedRelation: "grow_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grow_tasks_source_environment_task_id_fkey"
            columns: ["source_environment_task_id"]
            isOneToOne: false
            referencedRelation: "environment_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrients: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["nutrient_category"]
          created_at: string
          form: Database["public"]["Enums"]["nutrient_form"]
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["nutrient_category"]
          created_at?: string
          form: Database["public"]["Enums"]["nutrient_form"]
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["nutrient_category"]
          created_at?: string
          form?: Database["public"]["Enums"]["nutrient_form"]
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      parameter_logs: {
        Row: {
          created_at: string
          grow_cycle_id: string
          id: string
          parameter_id: string
          timestamp: string
          value: number
        }
        Insert: {
          created_at?: string
          grow_cycle_id: string
          id?: string
          parameter_id: string
          timestamp?: string
          value: number
        }
        Update: {
          created_at?: string
          grow_cycle_id?: string
          id?: string
          parameter_id?: string
          timestamp?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "parameter_logs_grow_cycle_id_fkey"
            columns: ["grow_cycle_id"]
            isOneToOne: false
            referencedRelation: "grow_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parameter_logs_parameter_id_fkey"
            columns: ["parameter_id"]
            isOneToOne: false
            referencedRelation: "parameters"
            referencedColumns: ["id"]
          },
        ]
      }
      parameters: {
        Row: {
          created_at: string
          id: string
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      strains: {
        Row: {
          active: boolean
          breeder: string
          created_at: string
          flower_weeks: number
          id: string
          name: string
          notes: string
          traits: string[]
          updated_at: string
          veg_weeks: number
        }
        Insert: {
          active?: boolean
          breeder?: string
          created_at?: string
          flower_weeks?: number
          id?: string
          name: string
          notes?: string
          traits?: string[]
          updated_at?: string
          veg_weeks?: number
        }
        Update: {
          active?: boolean
          breeder?: string
          created_at?: string
          flower_weeks?: number
          id?: string
          name?: string
          notes?: string
          traits?: string[]
          updated_at?: string
          veg_weeks?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      feed_mode: "fixed" | "guided"
      grow_stage: "veg" | "stretch" | "stack" | "swell" | "ripen"
      nutrient_category: "nutrient" | "additive" | "treatment"
      nutrient_form: "dry" | "liquid"
      task_status: "open" | "completed"
      task_trigger_type: "on_enter" | "after_days" | "on_stage"
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
      feed_mode: ["fixed", "guided"],
      grow_stage: ["veg", "stretch", "stack", "swell", "ripen"],
      nutrient_category: ["nutrient", "additive", "treatment"],
      nutrient_form: ["dry", "liquid"],
      task_status: ["open", "completed"],
      task_trigger_type: ["on_enter", "after_days", "on_stage"],
    },
  },
} as const
