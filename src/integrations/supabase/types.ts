export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          bio: string | null;
          target_exam: string | null;
          target_institution: string | null;
          target_score: string | null;
          avatar_url: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          bio?: string | null;
          target_exam?: string | null;
          target_institution?: string | null;
          target_score?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          bio?: string | null;
          target_exam?: string | null;
          target_institution?: string | null;
          target_score?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      kv_store: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          key: string;
          value?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          key?: string;
          value?: Json;
          updated_at?: string;
        };
      };
      topic_tracker: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          section: string;
          topic_name: string;
          status: string;
          confidence: number | null;
          time_spent_minutes: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_id: string;
          section: string;
          topic_name: string;
          status?: string;
          confidence?: number | null;
          time_spent_minutes?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exam_id?: string;
          section?: string;
          topic_name?: string;
          status?: string;
          confidence?: number | null;
          time_spent_minutes?: number | null;
          updated_at?: string;
        };
      };
      topic_history: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          topic_name: string;
          old_status: string | null;
          new_status: string;
          changed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_id: string;
          topic_name: string;
          old_status?: string | null;
          new_status: string;
          changed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exam_id?: string;
          topic_name?: string;
          old_status?: string | null;
          new_status?: string;
          changed_at?: string;
        };
      };
      mock_tests: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          date: string;
          test_name: string;
          sections: Json;
          total_score: number;
          max_score: number;
          percentile: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_id: string;
          date?: string;
          test_name: string;
          sections?: Json;
          total_score?: number;
          max_score?: number;
          percentile?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exam_id?: string;
          date?: string;
          test_name?: string;
          sections?: Json;
          total_score?: number;
          max_score?: number;
          percentile?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      error_log: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          date: string;
          question: string;
          section: string;
          topic: string | null;
          type: string | null;
          cause: string | null;
          fix: string | null;
          mock_number: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_id: string;
          date?: string;
          question: string;
          section: string;
          topic?: string | null;
          type?: string | null;
          cause?: string | null;
          fix?: string | null;
          mock_number?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exam_id?: string;
          date?: string;
          question?: string;
          section?: string;
          topic?: string | null;
          type?: string | null;
          cause?: string | null;
          fix?: string | null;
          mock_number?: number | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
