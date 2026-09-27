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
      admin_credentials: {
        Row: {
          created_at: string
          id: boolean
          iterations: number
          passcode_hash: string
          salt: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: boolean
          iterations?: number
          passcode_hash: string
          salt: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: boolean
          iterations?: number
          passcode_hash?: string
          salt?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      admin_login_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          requester_hash: string | null
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          requester_hash?: string | null
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          requester_hash?: string | null
          token_hash?: string
          used_at?: string | null
        }
        Relationships: []
      }
      admin_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          requester_hash: string | null
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          requester_hash?: string | null
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          requester_hash?: string | null
          token_hash?: string
          used_at?: string | null
        }
        Relationships: []
      }
      ai_cache_claims: {
        Row: {
          cache_key: string
          claimed_at: string
          expires_at: string
          owner_token: string
        }
        Insert: {
          cache_key: string
          claimed_at?: string
          expires_at: string
          owner_token: string
        }
        Update: {
          cache_key?: string
          claimed_at?: string
          expires_at?: string
          owner_token?: string
        }
        Relationships: []
      }
      ai_rate_limit: {
        Row: {
          bucket: string
          count: number
          window_start: string
        }
        Insert: {
          bucket: string
          count?: number
          window_start: string
        }
        Update: {
          bucket?: string
          count?: number
          window_start?: string
        }
        Relationships: []
      }
      api_cache: {
        Row: {
          created_at: string
          expires_at: string
          feature: string
          key: string
          payload: Json
          provider: string
          translation: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          feature: string
          key: string
          payload: Json
          provider: string
          translation?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          feature?: string
          key?: string
          payload?: Json
          provider?: string
          translation?: string | null
        }
        Relationships: []
      }
      api_usage_daily: {
        Row: {
          calls: number
          day: string
          feature: string
          provider: string
        }
        Insert: {
          calls?: number
          day: string
          feature: string
          provider: string
        }
        Update: {
          calls?: number
          day?: string
          feature?: string
          provider?: string
        }
        Relationships: []
      }
      atlas_context: {
        Row: {
          cache_key: string
          created_at: string
          id: string
          kind: string
          language: string
          last_accessed_at: string | null
          model: string
          payload: Json
          prompt_version: number
          reference: string
          status: string
          term: string
          tokens: number
          translation: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          cache_key: string
          created_at?: string
          id?: string
          kind: string
          language?: string
          last_accessed_at?: string | null
          model?: string
          payload: Json
          prompt_version?: number
          reference?: string
          status?: string
          term: string
          tokens?: number
          translation?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          cache_key?: string
          created_at?: string
          id?: string
          kind?: string
          language?: string
          last_accessed_at?: string | null
          model?: string
          payload?: Json
          prompt_version?: number
          reference?: string
          status?: string
          term?: string
          tokens?: number
          translation?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      bible_verses: {
        Row: {
          book: string
          book_num: number
          chapter: number
          testament: string
          text: string
          tsv: unknown
          verse: number
        }
        Insert: {
          book: string
          book_num: number
          chapter: number
          testament: string
          text: string
          tsv?: unknown
          verse: number
        }
        Update: {
          book?: string
          book_num?: number
          chapter?: number
          testament?: string
          text?: string
          tsv?: unknown
          verse?: number
        }
        Relationships: []
      }
      chapter_cache: {
        Row: {
          book: string
          chapter: number
          translation: string
          updated_at: string
          verses: Json
        }
        Insert: {
          book: string
          chapter: number
          translation: string
          updated_at?: string
          verses: Json
        }
        Update: {
          book?: string
          chapter?: number
          translation?: string
          updated_at?: string
          verses?: Json
        }
        Relationships: []
      }
      concordance_searches: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          term: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          term: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          term?: string
        }
        Relationships: []
      }
      concordance_terms: {
        Row: {
          nt: number
          ot: number
          per_book: Json
          term: string
          total: number
          updated_at: string
          verses: number
          word: string | null
        }
        Insert: {
          nt?: number
          ot?: number
          per_book?: Json
          term: string
          total?: number
          updated_at?: string
          verses?: number
          word?: string | null
        }
        Update: {
          nt?: number
          ot?: number
          per_book?: Json
          term?: string
          total?: number
          updated_at?: string
          verses?: number
          word?: string | null
        }
        Relationships: []
      }
      daily_verse: {
        Row: {
          book: string
          chapter: number
          created_at: string
          day: string
          end_verse: number | null
          season: string | null
          source: string
          source_url: string | null
          title: string
          verse: number
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string
          day: string
          end_verse?: number | null
          season?: string | null
          source?: string
          source_url?: string | null
          title: string
          verse: number
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string
          day?: string
          end_verse?: number | null
          season?: string | null
          source?: string
          source_url?: string | null
          title?: string
          verse?: number
        }
        Relationships: []
      }
      nav_events: {
        Row: {
          book: string | null
          chapter: number | null
          created_at: string
          device_id: string | null
          device_type: string | null
          event: string
          id: string
          reader_type: string | null
          release_version: string | null
          verse: number | null
        }
        Insert: {
          book?: string | null
          chapter?: number | null
          created_at?: string
          device_id?: string | null
          device_type?: string | null
          event: string
          id?: string
          reader_type?: string | null
          release_version?: string | null
          verse?: number | null
        }
        Update: {
          book?: string | null
          chapter?: number | null
          created_at?: string
          device_id?: string | null
          device_type?: string | null
          event?: string
          id?: string
          reader_type?: string | null
          release_version?: string | null
          verse?: number | null
        }
        Relationships: []
      }
      ops_metrics: {
        Row: {
          cache: string | null
          created_at: string
          detail: string | null
          duration_ms: number
          id: number
          kind: string
          outcome: string
          source: string | null
          surface: string
        }
        Insert: {
          cache?: string | null
          created_at?: string
          detail?: string | null
          duration_ms?: number
          id?: number
          kind?: string
          outcome: string
          source?: string | null
          surface: string
        }
        Update: {
          cache?: string | null
          created_at?: string
          detail?: string | null
          duration_ms?: number
          id?: number
          kind?: string
          outcome?: string
          source?: string | null
          surface?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          failure_count: number
          id: string
          last_sent_at: string | null
          last_sent_day: string | null
          p256dh: string
          send_hour: number
          send_minute: number
          timezone: string | null
          translation: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          failure_count?: number
          id?: string
          last_sent_at?: string | null
          last_sent_day?: string | null
          p256dh: string
          send_hour?: number
          send_minute?: number
          timezone?: string | null
          translation?: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          failure_count?: number
          id?: string
          last_sent_at?: string | null
          last_sent_day?: string | null
          p256dh?: string
          send_hour?: number
          send_minute?: number
          timezone?: string | null
          translation?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      seo_backlink_snapshots: {
        Row: {
          authority_score: number | null
          backlinks_total: number | null
          captured_on: string
          created_at: string
          follows: number | null
          id: string
          images: number | null
          nofollows: number | null
          referring_domains: number | null
          referring_ips: number | null
          target: string
          texts: number | null
          top_anchors: Json
          top_domains: Json
        }
        Insert: {
          authority_score?: number | null
          backlinks_total?: number | null
          captured_on?: string
          created_at?: string
          follows?: number | null
          id?: string
          images?: number | null
          nofollows?: number | null
          referring_domains?: number | null
          referring_ips?: number | null
          target: string
          texts?: number | null
          top_anchors?: Json
          top_domains?: Json
        }
        Update: {
          authority_score?: number | null
          backlinks_total?: number | null
          captured_on?: string
          created_at?: string
          follows?: number | null
          id?: string
          images?: number | null
          nofollows?: number | null
          referring_domains?: number | null
          referring_ips?: number | null
          target?: string
          texts?: number | null
          top_anchors?: Json
          top_domains?: Json
        }
        Relationships: []
      }
      share_events: {
        Row: {
          channel: string | null
          created_at: string
          device_id: string | null
          event: string
          id: string
          resource_ref: string | null
          resource_type: string
          translation: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          device_id?: string | null
          event: string
          id?: string
          resource_ref?: string | null
          resource_type?: string
          translation?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          device_id?: string | null
          event?: string
          id?: string
          resource_ref?: string | null
          resource_type?: string
          translation?: string | null
        }
        Relationships: []
      }
      whats_new_events: {
        Row: {
          created_at: string
          device_id: string
          event: string
          id: string
          last_seen_version: string | null
          release_version: string
          unseen_count: number
        }
        Insert: {
          created_at?: string
          device_id: string
          event: string
          id?: string
          last_seen_version?: string | null
          release_version: string
          unseen_count?: number
        }
        Update: {
          created_at?: string
          device_id?: string
          event?: string
          id?: string
          last_seen_version?: string | null
          release_version?: string
          unseen_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_cache_by_reference: {
        Args: { _kind?: string; _limit?: number }
        Returns: {
          entries: number
          label: string
          last_used: string
          reuses: number
          tokens_saved: number
          tokens_stored: number
        }[]
      }
      ai_cache_by_term: {
        Args: { _kind?: string; _limit?: number }
        Returns: {
          entries: number
          label: string
          last_used: string
          reuses: number
          tokens_saved: number
          tokens_stored: number
        }[]
      }
      ai_cache_overview: {
        Args: never
        Returns: {
          active: number
          entries: number
          kind: string
          last_created: string
          reuses: number
          tokens_avoided: number
          tokens_stored: number
        }[]
      }
      bump_api_usage: {
        Args: { _calls?: number; _feature: string; _provider: string }
        Returns: undefined
      }
      claim_ai_cache_key: {
        Args: { _key: string; _lease_seconds?: number; _owner: string }
        Returns: boolean
      }
      concordance_book_counts: {
        Args: { _query: string }
        Returns: {
          book: string
          book_num: number
          hits: number
          testament: string
        }[]
      }
      concordance_term_stats: {
        Args: { _query: string }
        Returns: {
          nt: number
          ot: number
          per_book: Json
          term: string
          total: number
          verses: number
          word: string
        }[]
      }
      concordance_verses: {
        Args: {
          _book?: string
          _limit?: number
          _offset?: number
          _query: string
          _testament?: string
        }
        Returns: {
          book: string
          book_num: number
          chapter: number
          testament: string
          text: string
          total_count: number
          verse: number
        }[]
      }
      consume_ai_quota: {
        Args: { _bucket: string; _limit: number; _window_seconds: number }
        Returns: boolean
      }
      ops_metrics_series: {
        Args: { _since: string }
        Returns: {
          bucket: string
          cache_hits: number
          errors: number
          p95: number
          total: number
        }[]
      }
      ops_metrics_summary: {
        Args: { _since: string }
        Returns: {
          cache_eligible: number
          cache_hits: number
          errors: number
          kind: string
          max_ms: number
          p50: number
          p95: number
          rate_limited: number
          surface: string
          total: number
        }[]
      }
      prune_analytics_events: { Args: never; Returns: undefined }
      prune_ops_metrics: { Args: never; Returns: undefined }
      purge_api_cache: { Args: never; Returns: undefined }
      rebuild_concordance_terms: { Args: never; Returns: number }
      release_ai_cache_key: {
        Args: { _key: string; _owner: string }
        Returns: boolean
      }
      renew_ai_cache_key: {
        Args: { _key: string; _lease_seconds?: number; _owner: string }
        Returns: boolean
      }
      touch_ai_cache: { Args: { _key: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
