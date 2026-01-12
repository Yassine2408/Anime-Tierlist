export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Replace this placeholder with your generated Supabase types when available.
export interface Database {
  public: {
    Tables: {
      tier_lists: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          is_public: boolean;
          share_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          is_public?: boolean;
          share_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          is_public?: boolean;
          share_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tier_list_items: {
        Row: {
          id: string;
          tier_list_id: string;
          anime_id: number;
          tier_rank: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tier_list_id: string;
          anime_id: number;
          tier_rank: string;
          position: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tier_list_id?: string;
          anime_id?: number;
          tier_rank?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tier_list_items_tier_list_id_fkey";
            columns: ["tier_list_id"];
            isOneToOne: false;
            referencedRelation: "tier_lists";
            referencedColumns: ["id"];
          }
        ];
      };
      anime_feedback: {
        Row: {
          id: string;
          user_id: string;
          anime_id: number;
          rating: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          anime_id: number;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          anime_id?: number;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      episode_feedback: {
        Row: {
          id: string;
          user_id: string;
          anime_id: number;
          episode: number;
          rating: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          anime_id: number;
          episode: number;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          anime_id?: number;
          episode?: number;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

