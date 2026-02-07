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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          category: Database["public"]["Enums"]["badge_category"]
          created_at: string
          description: string
          icon: string
          id: string
          is_pro_only: boolean
          name: string
          requirement_type: string
          requirement_value: number
          slug: string
          xp_reward: number
        }
        Insert: {
          category: Database["public"]["Enums"]["badge_category"]
          created_at?: string
          description: string
          icon: string
          id?: string
          is_pro_only?: boolean
          name: string
          requirement_type: string
          requirement_value: number
          slug: string
          xp_reward?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["badge_category"]
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_pro_only?: boolean
          name?: string
          requirement_type?: string
          requirement_value?: number
          slug?: string
          xp_reward?: number
        }
        Relationships: []
      }
      content_uploads: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_name: string | null
          file_type: string | null
          flashcard_count: number | null
          id: string
          processed: boolean | null
          question_count: number | null
          summary: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_name?: string | null
          file_type?: string | null
          flashcard_count?: number | null
          id?: string
          processed?: boolean | null
          question_count?: number | null
          summary?: string | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_name?: string | null
          file_type?: string | null
          flashcard_count?: number | null
          id?: string
          processed?: boolean | null
          question_count?: number | null
          summary?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_uploads_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          front: string
          id: string
          is_active: boolean | null
          last_reviewed_at: string | null
          mastered: boolean | null
          review_count: number | null
          set_id: string | null
          topic_id: string | null
          updated_at: string
          upload_id: string | null
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          front: string
          id?: string
          is_active?: boolean | null
          last_reviewed_at?: string | null
          mastered?: boolean | null
          review_count?: number | null
          set_id?: string | null
          topic_id?: string | null
          updated_at?: string
          upload_id?: string | null
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          front?: string
          id?: string
          is_active?: boolean | null
          last_reviewed_at?: string | null
          mastered?: boolean | null
          review_count?: number | null
          set_id?: string | null
          topic_id?: string | null
          updated_at?: string
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "content_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_tests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          question_ids: string[]
          score: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          question_ids: string[]
          score?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          question_ids?: string[]
          score?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_flashcard_reviewed: boolean | null
          first_test_completed: boolean | null
          first_upload_completed: boolean | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          study_days: string[] | null
          study_goal: Database["public"]["Enums"]["study_goal"] | null
          study_intensity: string | null
          study_minutes_per_day: number | null
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_flashcard_reviewed?: boolean | null
          first_test_completed?: boolean | null
          first_upload_completed?: boolean | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          study_days?: string[] | null
          study_goal?: Database["public"]["Enums"]["study_goal"] | null
          study_intensity?: string | null
          study_minutes_per_day?: number | null
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_flashcard_reviewed?: boolean | null
          first_test_completed?: boolean | null
          first_upload_completed?: boolean | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          study_days?: string[] | null
          study_goal?: Database["public"]["Enums"]["study_goal"] | null
          study_intensity?: string | null
          study_minutes_per_day?: number | null
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answered_correctly: boolean | null
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          is_active: boolean | null
          last_attempted_at: string | null
          options: Json | null
          question: string
          set_id: string | null
          topic_id: string | null
          updated_at: string
          upload_id: string | null
          user_id: string
        }
        Insert: {
          answered_correctly?: boolean | null
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          last_attempted_at?: string | null
          options?: Json | null
          question: string
          set_id?: string | null
          topic_id?: string | null
          updated_at?: string
          upload_id?: string | null
          user_id: string
        }
        Update: {
          answered_correctly?: boolean | null
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          last_attempted_at?: string | null
          options?: Json | null
          question?: string
          set_id?: string | null
          topic_id?: string | null
          updated_at?: string
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "content_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          category: Database["public"]["Enums"]["reward_category"]
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          is_pro_only: boolean
          name: string
          slug: string
          xp_cost: number
        }
        Insert: {
          category: Database["public"]["Enums"]["reward_category"]
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_pro_only?: boolean
          name: string
          slug: string
          xp_cost: number
        }
        Update: {
          category?: Database["public"]["Enums"]["reward_category"]
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_pro_only?: boolean
          name?: string
          slug?: string
          xp_cost?: number
        }
        Relationships: []
      }
      study_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          content_id: string | null
          created_at: string
          description: string | null
          id: string
          scheduled_date: string
          task_type: Database["public"]["Enums"]["content_type"]
          time_minutes: number | null
          title: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          content_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          scheduled_date: string
          task_type: Database["public"]["Enums"]["content_type"]
          time_minutes?: number | null
          title: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          content_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          scheduled_date?: string
          task_type?: Database["public"]["Enums"]["content_type"]
          time_minutes?: number | null
          title?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          dev_mode: boolean
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          dev_mode?: boolean
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          dev_mode?: boolean
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_mastery: {
        Row: {
          created_at: string
          flashcard_mastery_pct: number
          id: string
          mastery_level: Database["public"]["Enums"]["mastery_level"]
          question_accuracy_pct: number
          tests_completed: number
          topic_id: string
          updated_at: string
          user_id: string
          verified_exam_passed: boolean
          xp_earned: number | null
        }
        Insert: {
          created_at?: string
          flashcard_mastery_pct?: number
          id?: string
          mastery_level?: Database["public"]["Enums"]["mastery_level"]
          question_accuracy_pct?: number
          tests_completed?: number
          topic_id: string
          updated_at?: string
          user_id: string
          verified_exam_passed?: boolean
          xp_earned?: number | null
        }
        Update: {
          created_at?: string
          flashcard_mastery_pct?: number
          id?: string
          mastery_level?: Database["public"]["Enums"]["mastery_level"]
          question_accuracy_pct?: number
          tests_completed?: number
          topic_id?: string
          updated_at?: string
          user_id?: string
          verified_exam_passed?: boolean
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_mastery_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          initial_set_generated: boolean | null
          last_regenerated_at: string | null
          name: string
          priority: Database["public"]["Enums"]["topic_priority"] | null
          progress: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          initial_set_generated?: boolean | null
          last_regenerated_at?: string | null
          name: string
          priority?: Database["public"]["Enums"]["topic_priority"] | null
          progress?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          initial_set_generated?: boolean | null
          last_regenerated_at?: string | null
          name?: string
          priority?: Database["public"]["Enums"]["topic_priority"] | null
          progress?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string
          id: string
          mock_tests_count: number
          updated_at: string
          uploads_count: number
          user_id: string
          verified_test_attempts: number
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          mock_tests_count?: number
          updated_at?: string
          uploads_count?: number
          user_id: string
          verified_test_attempts?: number
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          mock_tests_count?: number
          updated_at?: string
          uploads_count?: number
          user_id?: string
          verified_test_attempts?: number
          week_start?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          streak_protection_used_at: string | null
          updated_at: string
          user_id: string
          xp_total: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          streak_protection_used_at?: string | null
          updated_at?: string
          user_id: string
          xp_total?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          streak_protection_used_at?: string | null
          updated_at?: string
          user_id?: string
          xp_total?: number
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          claimed_at: string
          id: string
          reward_id: string
          status: Database["public"]["Enums"]["reward_status"]
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          reward_id: string
          status?: Database["public"]["Enums"]["reward_status"]
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          reward_id?: string
          status?: Database["public"]["Enums"]["reward_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          topic_id: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          topic_id?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          topic_id?: string | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_week_start: { Args: never; Returns: string }
    }
    Enums: {
      badge_category: "learning" | "consistency" | "mastery" | "social"
      content_type: "flashcard" | "question" | "test"
      mastery_level: "novice" | "learning" | "proficient" | "master"
      reward_category: "digital" | "real_world"
      reward_status: "pending" | "fulfilled" | "expired"
      study_goal: "interview" | "exam"
      subscription_plan: "free" | "plus" | "pro"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
      topic_priority: "high" | "medium" | "low"
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
      badge_category: ["learning", "consistency", "mastery", "social"],
      content_type: ["flashcard", "question", "test"],
      mastery_level: ["novice", "learning", "proficient", "master"],
      reward_category: ["digital", "real_world"],
      reward_status: ["pending", "fulfilled", "expired"],
      study_goal: ["interview", "exam"],
      subscription_plan: ["free", "plus", "pro"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
      topic_priority: ["high", "medium", "low"],
    },
  },
} as const
