// Migration-aligned RPC contract. Application writes use these functions, not table DML.
// Runtime result validation lives in lib/workspace.ts. Update both with migration changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type Database = {
  public: {
    Tables: { [_ in never]: never }
    Views: { [_ in never]: never }
    Functions: {
      browse_practice: { Args: { p_filters: Json; p_page: number }; Returns: Json }
      start_practice: { Args: { p_input: Json }; Returns: Json }
      read_practice_attempt: { Args: { p_id: string }; Returns: Json }
      command_practice: { Args: { p_input: Json }; Returns: Json }
      mark_practice: { Args: { p_question: string; p_attempt: string | null; p_mark: boolean }; Returns: boolean }
      practice_history: { Args: { p_page: number; p_review: boolean; p_unreviewed: boolean }; Returns: Json }
      practice_signals: { Args: Record<string, never>; Returns: Json }
      read_cat_workspace: { Args: Record<string, never>; Returns: Json }
      mutate_cat_workspace: {
        Args: { p_request_id: string; p_expected_revision: number; p_operation: string; p_payload: Json }
        Returns: Json
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
