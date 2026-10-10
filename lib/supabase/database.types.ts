// Migration-aligned RPC contract. Application writes use these functions, not table DML.
// Runtime result validation lives in lib/workspace.ts. Update both with migration changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type Database = {
  public: {
    Tables: { [_ in never]: never }
    Views: { [_ in never]: never }
    Functions: {
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
