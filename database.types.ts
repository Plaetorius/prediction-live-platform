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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bets: {
        Row: {
          created_at: string
          id: string
          is_answer_a: boolean
          market_id: string
          profile_id: string
          status: Database["public"]["Enums"]["bets_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_answer_a: boolean
          market_id: string
          profile_id: string
          status: Database["public"]["Enums"]["bets_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_answer_a?: boolean
          market_id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["bets_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          rarity: Database["public"]["Enums"]["rarity"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          rarity: Database["public"]["Enums"]["rarity"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rarity?: Database["public"]["Enums"]["rarity"]
        }
        Relationships: []
      }
      lootboxes: {
        Row: {
          cosmetic_id: string | null
          created_at: string
          id: string
          opened_at: string
          profile_id: string
          type: Database["public"]["Enums"]["lootboxes_rewards"] | null
          xp_amount: number | null
        }
        Insert: {
          cosmetic_id?: string | null
          created_at?: string
          id?: string
          opened_at?: string
          profile_id: string
          type?: Database["public"]["Enums"]["lootboxes_rewards"] | null
          xp_amount?: number | null
        }
        Update: {
          cosmetic_id?: string | null
          created_at?: string
          id?: string
          opened_at?: string
          profile_id?: string
          type?: Database["public"]["Enums"]["lootboxes_rewards"] | null
          xp_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lootboxes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          answer_a: string
          answer_b: string
          created_at: string
          duration: number
          est_end_time: number
          id: string
          question: string
          real_end_time: number | null
          start_time: number
          status: Database["public"]["Enums"]["market_status"]
          stream_id: string
          updated_at: string
        }
        Insert: {
          answer_a: string
          answer_b: string
          created_at?: string
          duration?: number
          est_end_time: number
          id?: string
          question: string
          real_end_time?: number | null
          start_time: number
          status?: Database["public"]["Enums"]["market_status"]
          stream_id: string
          updated_at?: string
        }
        Update: {
          answer_a?: string
          answer_b?: string
          created_at?: string
          duration?: number
          est_end_time?: number
          id?: string
          question?: string
          real_end_time?: number | null
          start_time?: number
          status?: Database["public"]["Enums"]["market_status"]
          stream_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "markets_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          picture_url: string | null
          updated_at: string
          username: string
          xp: number | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          picture_url?: string | null
          updated_at?: string
          username: string
          xp?: number | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          picture_url?: string | null
          updated_at?: string
          username?: string
          xp?: number | null
        }
        Relationships: []
      }
      streams: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          name: string
          online: boolean
          platform: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          online?: boolean
          platform: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          online?: boolean
          platform?: string
          updated_at?: string
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
      bets_status: "draft" | "voided" | "win" | "lose" | "accepted" | "error"
      lootboxes_rewards: "xp" | "cosmetic" | "void"
      market_status:
        | "draft"
        | "open"
        | "timeout"
        | "stopped"
        | "error"
        | "voided"
      rarity: "common" | "rare" | "epic" | "legendary"
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
      bets_status: ["draft", "voided", "win", "lose", "accepted", "error"],
      lootboxes_rewards: ["xp", "cosmetic", "void"],
      market_status: ["draft", "open", "timeout", "stopped", "error", "voided"],
      rarity: ["common", "rare", "epic", "legendary"],
    },
  },
} as const
