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
      arkhi_valuation_exports: {
        Row: {
          created_at: string
          export_type: string
          export_url: string | null
          id: string
          report_id: string
          share_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          export_type: string
          export_url?: string | null
          id?: string
          report_id: string
          share_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          export_type?: string
          export_url?: string | null
          id?: string
          report_id?: string
          share_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arkhi_valuation_exports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "arkhi_valuation_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      arkhi_valuation_items: {
        Row: {
          category: string | null
          comparable_replacement_used: boolean
          condition_assumption: string | null
          confidence_score: number
          created_at: string
          currency: string
          description: string | null
          estimated_high_value: number
          estimated_low_value: number
          estimated_mid_value: number
          id: string
          image_reference: string | null
          item_name: string
          quantity: number
          replacement_notes: string | null
          report_id: string
          requires_user_review: boolean
          user_id: string
        }
        Insert: {
          category?: string | null
          comparable_replacement_used?: boolean
          condition_assumption?: string | null
          confidence_score?: number
          created_at?: string
          currency?: string
          description?: string | null
          estimated_high_value?: number
          estimated_low_value?: number
          estimated_mid_value?: number
          id?: string
          image_reference?: string | null
          item_name: string
          quantity?: number
          replacement_notes?: string | null
          report_id: string
          requires_user_review?: boolean
          user_id: string
        }
        Update: {
          category?: string | null
          comparable_replacement_used?: boolean
          condition_assumption?: string | null
          confidence_score?: number
          created_at?: string
          currency?: string
          description?: string | null
          estimated_high_value?: number
          estimated_low_value?: number
          estimated_mid_value?: number
          id?: string
          image_reference?: string | null
          item_name?: string
          quantity?: number
          replacement_notes?: string | null
          report_id?: string
          requires_user_review?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arkhi_valuation_items_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "arkhi_valuation_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      arkhi_valuation_reports: {
        Row: {
          confidence_summary: Json | null
          created_at: string
          currency: string
          detected_item_count: number
          id: string
          image_paths: Json
          project_id: string | null
          report_status: string
          room_name: string
          total_high_estimate: number
          total_low_estimate: number
          total_mid_estimate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_summary?: Json | null
          created_at?: string
          currency?: string
          detected_item_count?: number
          id?: string
          image_paths?: Json
          project_id?: string | null
          report_status?: string
          room_name?: string
          total_high_estimate?: number
          total_low_estimate?: number
          total_mid_estimate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_summary?: Json | null
          created_at?: string
          currency?: string
          detected_item_count?: number
          id?: string
          image_paths?: Json
          project_id?: string | null
          report_status?: string
          room_name?: string
          total_high_estimate?: number
          total_low_estimate?: number
          total_mid_estimate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: string | null
          created_at: string
          id: string
          name: string
          rooms_count: number
          status: string
          user_id: string
        }
        Insert: {
          budget?: string | null
          created_at?: string
          id?: string
          name: string
          rooms_count?: number
          status?: string
          user_id: string
        }
        Update: {
          budget?: string | null
          created_at?: string
          id?: string
          name?: string
          rooms_count?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          analysis: string | null
          cover_url: string | null
          created_at: string
          id: string
          images: Json
          last_scanned: string | null
          length_m: number | null
          name: string
          notes: string | null
          photos: number
          rating: Json | null
          score: number
          style_category: string | null
          type: string
          user_id: string
          warmth_score: number | null
          width_m: number | null
        }
        Insert: {
          analysis?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          images?: Json
          last_scanned?: string | null
          length_m?: number | null
          name: string
          notes?: string | null
          photos?: number
          rating?: Json | null
          score?: number
          style_category?: string | null
          type: string
          user_id: string
          warmth_score?: number | null
          width_m?: number | null
        }
        Update: {
          analysis?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          images?: Json
          last_scanned?: string | null
          length_m?: number | null
          name?: string
          notes?: string | null
          photos?: number
          rating?: Json | null
          score?: number
          style_category?: string | null
          type?: string
          user_id?: string
          warmth_score?: number | null
          width_m?: number | null
        }
        Relationships: []
      }
      scans: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          kind: string
          result: Json | null
          secondary_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          kind: string
          result?: Json | null
          secondary_path?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          kind?: string
          result?: Json | null
          secondary_path?: string | null
          user_id?: string
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
