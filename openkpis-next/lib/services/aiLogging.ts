/**
 * AI Interactions Logging Service
 * Captures all AI prompts, responses, context, and metadata for analysis
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { withTablePrefix } from '@/src/types/entities';

const AI_INTERACTIONS_TABLE = withTablePrefix('ai_interactions');

export interface AIInteractionLog {
  // User identification
  user_id?: string | null;
  user_email?: string | null;
  user_name?: string | null;
  
  // Session/Context linking
  analysis_id?: string | null;
  session_id?: string | null;
  
  // AI Request Details
  endpoint: string;
  function_name?: string;
  
  // User Input
  user_prompt: string;
  user_requirements?: string | null;
  analytics_solution?: string | null;
  context_data?: Record<string, unknown> | null;
  
  // AI Request Payload
  request_payload: Record<string, unknown>;
  model_used?: string | null;
  system_prompt?: string | null;
  
  // AI Response
  response_content?: string | null;
  response_data?: Record<string, unknown> | null;
  parsed_response?: Record<string, unknown> | null;
  
  // What AI Understood
  ai_interpretation?: Record<string, unknown> | null;
  extracted_intent?: Record<string, unknown> | null;
  
  // Metadata
  tokens_used?: { input?: number; output?: number; total?: number } | null;
  response_time_ms?: number | null;
  finish_reason?: string | null;
  
  // Status
  status: 'success' | 'error' | 'timeout' | 'filtered';
  error_message?: string | null;
  error_data?: Record<string, unknown> | null;
}

/**
 * Log an AI interaction to the database
 * This is a non-blocking operation - errors are logged but don't throw
 */
export async function logAIInteraction(
  client: SupabaseClient,
  log: AIInteractionLog
): Promise<void> {
  try {
    const { error } = await client
      .from(AI_INTERACTIONS_TABLE)
      .insert({
        user_id: log.user_id || null,
        user_email: log.user_email || null,
        user_name: log.user_name || null,
        analysis_id: log.analysis_id || null,
        session_id: log.session_id || null,
        endpoint: log.endpoint,
        function_name: log.function_name || null,
        user_prompt: log.user_prompt,
        user_requirements: log.user_requirements || null,
        analytics_solution: log.analytics_solution || null,
        context_data: log.context_data ? (log.context_data as unknown) : null,
        request_payload: log.request_payload as unknown,
        model_used: log.model_used || null,
        system_prompt: log.system_prompt || null,
        response_content: log.response_content || null,
        response_data: log.response_data ? (log.response_data as unknown) : null,
        parsed_response: log.parsed_response ? (log.parsed_response as unknown) : null,
        ai_interpretation: log.ai_interpretation ? (log.ai_interpretation as unknown) : null,
        extracted_intent: log.extracted_intent ? (log.extracted_intent as unknown) : null,
        tokens_used: log.tokens_used ? (log.tokens_used as unknown) : null,
        response_time_ms: log.response_time_ms || null,
        finish_reason: log.finish_reason || null,
        status: log.status,
        error_message: log.error_message || null,
        error_data: log.error_data ? (log.error_data as unknown) : null,
      });

    if (error) {
      // Log error but don't throw - logging should never break the main flow
      console.error('[AI Logging] Failed to log interaction:', error);
    }
  } catch (err) {
    // Catch any unexpected errors
    console.error('[AI Logging] Unexpected error logging interaction:', err);
  }
}

/**
 * Helper to extract user info from Supabase user object
 */
export function extractUserInfo(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null): {
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
} {
  if (!user) {
    return { user_id: null, user_email: null, user_name: null };
  }

  return {
    user_id: user.id,
    user_email: user.email || null,
    user_name: (user.user_metadata?.user_name || user.user_metadata?.full_name || user.email) as string | null,
  };
}

