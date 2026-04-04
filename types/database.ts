// Generated Supabase database types
// Run: npx supabase gen types typescript --project-id kegbfovpvsabcynekmxq > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          tenant_id: string
          role: 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          tenant_id: string
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          tenant_id?: string
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          tenant_id: string
          name: string
          address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          address: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
      }
      guest_tokens: {
        Row: {
          id: string
          property_id: string
          token: string
          expires_at: string
          created_at: string
        }
      }
      guide_sections: {
        Row: {
          id: string
          property_id: string
          title: string
          content: string
          order: number
          created_at: string
        }
      }
      translation_cache: {
        Row: {
          id: string
          property_id: string
          hash: string
          source_text: string
          translated_text: string
          source_lang: string
          target_lang: string
          created_at: string
        }
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
  }
}
