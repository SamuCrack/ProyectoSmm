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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appearance_config: {
        Row: {
          config_key: string
          config_value: string | null
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value?: string | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      category_user_access: {
        Row: {
          category_id: number
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          category_id: number
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          category_id?: number
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_user_access_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      client_menu_config: {
        Row: {
          created_at: string | null
          enabled: boolean
          icon_name: string
          id: number
          label: string
          menu_key: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          icon_name: string
          id?: number
          label: string
          menu_key: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          icon_name?: string
          id?: number
          label?: string
          menu_key?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      ip_bans: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: number
          ip: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: number
          ip: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: number
          ip?: string
          reason?: string | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: number
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: number
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: number
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          cancel_requested_at: string | null
          charge_user: number
          cost_provider: number | null
          created_at: string | null
          external_order_id: number | null
          fail_reason: string | null
          id: number
          link: string
          mode: string | null
          provider_id: number
          quantity: number
          refund_amount: number | null
          refunded: boolean
          remains: number | null
          service_id: number
          start_count: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_requested_at?: string | null
          charge_user?: number
          cost_provider?: number | null
          created_at?: string | null
          external_order_id?: number | null
          fail_reason?: string | null
          id?: number
          link: string
          mode?: string | null
          provider_id: number
          quantity: number
          refund_amount?: number | null
          refunded?: boolean
          remains?: number | null
          service_id: number
          start_count?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_requested_at?: string | null
          charge_user?: number
          cost_provider?: number | null
          created_at?: string | null
          external_order_id?: number | null
          fail_reason?: string | null
          id?: number
          link?: string
          mode?: string | null
          provider_id?: number
          quantity?: number
          refund_amount?: number | null
          refunded?: boolean
          remains?: number | null
          service_id?: number
          start_count?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_migrations: {
        Row: {
          balance: number
          claimed_at: string | null
          custom_discount: number | null
          email: string
          id: string
          migrated_at: string | null
          original_created_at: string | null
          username: string | null
          whatsapp: string | null
        }
        Insert: {
          balance?: number
          claimed_at?: string | null
          custom_discount?: number | null
          email: string
          id?: string
          migrated_at?: string | null
          original_created_at?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Update: {
          balance?: number
          claimed_at?: string | null
          custom_discount?: number | null
          email?: string
          id?: string
          migrated_at?: string | null
          original_created_at?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          created_at: string | null
          custom_rate: number
          id: number
          service_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_rate: number
          id?: number
          service_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_rate?: number
          id?: number
          service_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          balance: number
          created_at: string | null
          custom_discount: number | null
          email: string | null
          enabled: boolean
          id: string
          last_auth: string | null
          last_ip: string | null
          updated_at: string | null
          username: string | null
          whatsapp: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          custom_discount?: number | null
          email?: string | null
          enabled?: boolean
          id: string
          last_auth?: string | null
          last_ip?: string | null
          updated_at?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          custom_discount?: number | null
          email?: string | null
          enabled?: boolean
          id?: string
          last_auth?: string | null
          last_ip?: string | null
          updated_at?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      provider_services_cache: {
        Row: {
          cached_at: string | null
          cancel_allow: boolean | null
          category: string | null
          description: string | null
          id: number
          max_qty: number | null
          min_qty: number | null
          name: string
          provider_id: number | null
          rate: number | null
          raw_data: Json | null
          refill: boolean | null
          service_id: string
        }
        Insert: {
          cached_at?: string | null
          cancel_allow?: boolean | null
          category?: string | null
          description?: string | null
          id?: number
          max_qty?: number | null
          min_qty?: number | null
          name: string
          provider_id?: number | null
          rate?: number | null
          raw_data?: Json | null
          refill?: boolean | null
          service_id: string
        }
        Update: {
          cached_at?: string | null
          cancel_allow?: boolean | null
          category?: string | null
          description?: string | null
          id?: number
          max_qty?: number | null
          min_qty?: number | null
          name?: string
          provider_id?: number | null
          rate?: number | null
          raw_data?: Json | null
          refill?: boolean | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_cache_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          api_key: string
          api_type: string | null
          api_url: string
          balance_cached: number | null
          created_at: string | null
          enabled: boolean
          id: number
          last_checked: string | null
          name: string
          sort_order: number
        }
        Insert: {
          api_key: string
          api_type?: string | null
          api_url: string
          balance_cached?: number | null
          created_at?: string | null
          enabled?: boolean
          id?: number
          last_checked?: string | null
          name: string
          sort_order?: number
        }
        Update: {
          api_key?: string
          api_type?: string | null
          api_url?: string
          balance_cached?: number | null
          created_at?: string | null
          enabled?: boolean
          id?: number
          last_checked?: string | null
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      recharges: {
        Row: {
          amount: number
          created_at: string | null
          id: number
          notes: string | null
          payment_method: string | null
          status: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: number
          notes?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: number
          notes?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      refills: {
        Row: {
          created_at: string | null
          current_count: number | null
          external_refill_id: string | null
          id: number
          link: string
          order_id: number
          provider_id: number
          quantity: number
          service_id: number
          start_count: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          external_refill_id?: string | null
          id?: number
          link: string
          order_id: number
          provider_id: number
          quantity: number
          service_id: number
          start_count?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          external_refill_id?: string | null
          id?: number
          link?: string
          order_id?: number
          provider_id?: number
          quantity?: number
          service_id?: number
          start_count?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refills_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refills_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refills_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          enabled: boolean
          icon: string | null
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          icon?: string | null
          id?: number
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          icon?: string | null
          id?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      service_updates: {
        Row: {
          created_at: string | null
          id: number
          new_value: string | null
          old_value: string | null
          service_id: number
          service_name: string
          update_type: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          new_value?: string | null
          old_value?: string | null
          service_id: number
          service_name: string
          update_type: string
        }
        Update: {
          created_at?: string | null
          id?: number
          new_value?: string | null
          old_value?: string | null
          service_id?: number
          service_name?: string
          update_type?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          cancel_allow: boolean
          category_id: number | null
          created_at: string | null
          deleted_at: string | null
          deny_link_duplicates: boolean
          enabled: boolean
          id: number
          input_type: string | null
          location_text: string | null
          max_qty: number
          min_qty: number
          name: string
          notes: string | null
          provider_id: number | null
          provider_service_id: string | null
          quality_text: string | null
          rate_per_1000: number
          refill: boolean
          service_sort: number
          service_type: string | null
          speed_text: string | null
          start_text: string | null
          sync_with_provider: boolean
        }
        Insert: {
          cancel_allow?: boolean
          category_id?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deny_link_duplicates?: boolean
          enabled?: boolean
          id?: number
          input_type?: string | null
          location_text?: string | null
          max_qty?: number
          min_qty?: number
          name: string
          notes?: string | null
          provider_id?: number | null
          provider_service_id?: string | null
          quality_text?: string | null
          rate_per_1000?: number
          refill?: boolean
          service_sort?: number
          service_type?: string | null
          speed_text?: string | null
          start_text?: string | null
          sync_with_provider?: boolean
        }
        Update: {
          cancel_allow?: boolean
          category_id?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deny_link_duplicates?: boolean
          enabled?: boolean
          id?: number
          input_type?: string | null
          location_text?: string | null
          max_qty?: number
          min_qty?: number
          name?: string
          notes?: string | null
          provider_id?: number | null
          provider_service_id?: string | null
          quality_text?: string | null
          rate_per_1000?: number
          refill?: boolean
          service_sort?: number
          service_type?: string | null
          speed_text?: string | null
          start_text?: string | null
          sync_with_provider?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_videos: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: number
          platform: string
          sort_order: number | null
          title: string
          updated_at: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: number
          platform?: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: number
          platform?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          video_url?: string
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
      get_restricted_category_ids: {
        Args: never
        Returns: {
          category_id: number
        }[]
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
