export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      paper_field_values: {
        Row: {
          citations: Json | null
          confidence: string | null
          extracted_at: string | null
          field_id: string
          field_name: string
          field_type: Database["public"]["Enums"]["field_type"]
          id: string
          paper_id: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          citations?: Json | null
          confidence?: string | null
          extracted_at?: string | null
          field_id: string
          field_name: string
          field_type: Database["public"]["Enums"]["field_type"]
          id?: string
          paper_id: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          citations?: Json | null
          confidence?: string | null
          extracted_at?: string | null
          field_id?: string
          field_name?: string
          field_type?: Database["public"]["Enums"]["field_type"]
          id?: string
          paper_id?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "paper_field_values_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          abstract: string | null
          authors: string[] | null
          created_at: string | null
          doi: string | null
          full_text: string | null
          id: string
          journal: string | null
          pmid: string | null
          publication_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          abstract?: string | null
          authors?: string[] | null
          created_at?: string | null
          doi?: string | null
          full_text?: string | null
          id?: string
          journal?: string | null
          pmid?: string | null
          publication_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          abstract?: string | null
          authors?: string[] | null
          created_at?: string | null
          doi?: string | null
          full_text?: string | null
          id?: string
          journal?: string | null
          pmid?: string | null
          publication_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      screening_configurations: {
        Row: {
          created_at: string | null
          description: string | null
          fields: Json
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
          visibility: Database["public"]["Enums"]["config_visibility"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
          visibility?: Database["public"]["Enums"]["config_visibility"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
          visibility?: Database["public"]["Enums"]["config_visibility"]
        }
        Relationships: []
      }
      user_active_configuration: {
        Row: {
          configuration_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          configuration_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          configuration_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_configuration_configuration_id_fkey"
            columns: ["configuration_id"]
            isOneToOne: false
            referencedRelation: "screening_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      config_visibility: "default" | "community" | "private"
      field_type:
        | "text"
        | "number"
        | "select"
        | "multi_select"
        | "boolean"
        | "date"
        | "url"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

// Custom types for better type safety
export type FieldType = Database["public"]["Enums"]["field_type"]
export type ConfigVisibility = Database["public"]["Enums"]["config_visibility"]

export interface CustomField {
  id: string
  name: string
  type: FieldType
  enabled: boolean
  prompt?: string
  isAI?: boolean
  options?: string[]
}

export interface ScreeningConfiguration {
  id: string
  name: string
  description: string | null
  visibility: ConfigVisibility
  user_id: string | null
  fields: CustomField[]
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface PaperFieldValue {
  id: string
  paper_id: string
  field_id: string
  field_name: string
  field_type: FieldType
  value: any
  confidence: 'high' | 'medium' | 'low' | 'unknown' | null
  citations: Array<{
    text: string
    location: string
  }> | null
  extracted_at: string | null
  updated_at: string | null
} 