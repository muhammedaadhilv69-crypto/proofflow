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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          actor_id: string
          actor_type: string
          created_at: string
          deliverable_id: string | null
          event_type: string
          id: string
          metadata: Json
          project_id: string | null
          version_id: string | null
          workspace_id: string
        }
        Insert: {
          actor_id: string
          actor_type: string
          created_at?: string
          deliverable_id?: string | null
          event_type: string
          id?: string
          metadata?: Json
          project_id?: string | null
          version_id?: string | null
          workspace_id: string
        }
        Update: {
          actor_id?: string
          actor_type?: string
          created_at?: string
          deliverable_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          project_id?: string | null
          version_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_records: {
        Row: {
          approval_number: string
          approved_at: string
          client_email: string
          client_id: string
          client_name: string
          created_at: string
          deliverable_id: string
          id: string
          ip_address: string | null
          project_id: string
          status: string
          user_agent: string | null
          version_id: string
          workspace_id: string
        }
        Insert: {
          approval_number: string
          approved_at?: string
          client_email: string
          client_id: string
          client_name: string
          created_at?: string
          deliverable_id: string
          id?: string
          ip_address?: string | null
          project_id: string
          status?: string
          user_agent?: string | null
          version_id: string
          workspace_id: string
        }
        Update: {
          approval_number?: string
          approved_at?: string
          client_email?: string
          client_id?: string
          client_name?: string
          created_at?: string
          deliverable_id?: string
          id?: string
          ip_address?: string | null
          project_id?: string
          status?: string
          user_agent?: string | null
          version_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_records_client_id_workspace_id_fkey"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "approval_records_client_workspace_fk"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "approval_records_version_id_workspace_id_deliverable_id_pr_fkey"
            columns: [
              "version_id",
              "workspace_id",
              "deliverable_id",
              "project_id",
            ]
            isOneToOne: false
            referencedRelation: "versions"
            referencedColumns: [
              "id",
              "workspace_id",
              "deliverable_id",
              "project_id",
            ]
          },
          {
            foreignKeyName: "approval_records_version_workspace_fk"
            columns: [
              "version_id",
              "workspace_id",
              "deliverable_id",
              "project_id",
            ]
            isOneToOne: false
            referencedRelation: "versions"
            referencedColumns: [
              "id",
              "workspace_id",
              "deliverable_id",
              "project_id",
            ]
          },
          {
            foreignKeyName: "approval_records_workspace_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_email: string
          author_name: string
          author_type: string
          author_user_id: string | null
          body: string
          comment_type: string
          created_at: string
          id: string
          version_id: string
          workspace_id: string
        }
        Insert: {
          author_email: string
          author_name: string
          author_type: string
          author_user_id?: string | null
          body: string
          comment_type?: string
          created_at?: string
          id?: string
          version_id: string
          workspace_id: string
        }
        Update: {
          author_email?: string
          author_name?: string
          author_type?: string
          author_user_id?: string | null
          body?: string
          comment_type?: string
          created_at?: string
          id?: string
          version_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_version_id_workspace_id_fkey"
            columns: ["version_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "versions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "comments_version_workspace_fk"
            columns: ["version_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "versions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "comments_workspace_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string
          current_version_id: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_current_version_fk"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "versions"
            referencedColumns: ["deliverable_id", "id"]
          },
          {
            foreignKeyName: "deliverables_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "deliverables_project_workspace_fk"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "deliverables_workspace_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          id: string
          mime_type: string
          original_filename: string
          size_bytes: number
          storage_path: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type: string
          original_filename: string
          size_bytes: number
          storage_path: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string
          original_filename?: string
          size_bytes?: number
          storage_path?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_workspace_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json
          read: boolean
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          read?: boolean
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          read?: boolean
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_workspace_id_fkey"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "projects_client_workspace_fk"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "projects_workspace_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          bucket_key: string
          hit_count: number
          window_started_at: string
        }
        Insert: {
          bucket_key: string
          hit_count?: number
          window_started_at?: string
        }
        Update: {
          bucket_key?: string
          hit_count?: number
          window_started_at?: string
        }
        Relationships: []
      }
      review_tokens: {
        Row: {
          client_email: string
          client_id: string
          client_name: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          revoked_at: string | null
          token_hash: string
          version_id: string
          workspace_id: string
        }
        Insert: {
          client_email: string
          client_id: string
          client_name: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          token_hash: string
          version_id: string
          workspace_id: string
        }
        Update: {
          client_email?: string
          client_id?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          token_hash?: string
          version_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_tokens_client_id_workspace_id_fkey"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "review_tokens_client_workspace_fk"
            columns: ["client_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "review_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_tokens_version_id_workspace_id_fkey"
            columns: ["version_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "versions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "review_tokens_version_workspace_fk"
            columns: ["version_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "versions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "review_tokens_workspace_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      versions: {
        Row: {
          created_at: string
          deliverable_id: string
          description: string | null
          file_id: string
          id: string
          locked_at: string | null
          project_id: string
          status: string
          uploaded_by: string
          version_number: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          deliverable_id: string
          description?: string | null
          file_id: string
          id?: string
          locked_at?: string | null
          project_id: string
          status?: string
          uploaded_by: string
          version_number: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          deliverable_id?: string
          description?: string | null
          file_id?: string
          id?: string
          locked_at?: string | null
          project_id?: string
          status?: string
          uploaded_by?: string
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "versions_deliverable_id_project_id_workspace_id_fkey"
            columns: ["deliverable_id", "project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id", "project_id", "workspace_id"]
          },
          {
            foreignKeyName: "versions_deliverable_workspace_fk"
            columns: ["deliverable_id", "project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id", "project_id", "workspace_id"]
          },
          {
            foreignKeyName: "versions_file_id_workspace_id_fkey"
            columns: ["file_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "versions_file_workspace_fk"
            columns: ["file_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versions_workspace_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          revoked_at: string | null
          role: string
          token_hash: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          revoked_at?: string | null
          role?: string
          token_hash: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
          role?: string
          token_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invitation: { Args: { p_token: string }; Returns: Json }
      add_agency_comment: {
        Args: {
          p_body: string
          p_user_id: string
          p_version_id: string
          p_workspace_id: string
        }
        Returns: Json
      }
      add_review_comment: {
        Args: {
          p_body: string
          p_change_request?: boolean
          p_ip_address?: string
          p_token: string
          p_user_agent?: string
        }
        Returns: Json
      }
      approve_version: {
        Args: { p_ip_address?: string; p_token: string; p_user_agent?: string }
        Returns: Json
      }
      consume_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      create_review_token: {
        Args: {
          p_created_by: string
          p_version_id: string
          p_workspace_id: string
        }
        Returns: Json
      }
      create_version: {
        Args: {
          p_deliverable_id: string
          p_description: string
          p_file_id: string
          p_mime_type: string
          p_original_filename: string
          p_project_id: string
          p_size_bytes: number
          p_storage_path: string
          p_uploaded_by: string
          p_version_id: string
          p_workspace_id: string
        }
        Returns: Json
      }
      create_workspace_invitation: {
        Args: { p_email: string; p_workspace_id: string }
        Returns: Json
      }
      ensure_workspace_for_user: {
        Args: { p_user_id: string; p_workspace_name: string }
        Returns: Json
      }
      is_workspace_member: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
      is_workspace_owner: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
      record_review_opened: {
        Args: { p_actor_id: string; p_version_id: string }
        Returns: boolean
      }
      remove_workspace_member: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: boolean
      }
      revoke_workspace_invitation: {
        Args: { p_invitation_id: string; p_workspace_id: string }
        Returns: boolean
      }
      update_workspace_member_role: {
        Args: { p_role: string; p_user_id: string; p_workspace_id: string }
        Returns: Json
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
