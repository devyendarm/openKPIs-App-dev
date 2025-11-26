# AI Interactions Logging

## Overview

This system captures all AI interactions (prompts, responses, context, metadata) in Supabase for analysis, debugging, and improvement.

## Why Supabase?

✅ **Perfect for this use case:**
- **JSONB support**: Handles structured and unstructured data efficiently
- **Already in use**: No additional infrastructure needed
- **Performance**: GIN indexes for fast JSON queries
- **Security**: RLS policies for data protection
- **Scalability**: PostgreSQL handles large volumes of data
- **Query flexibility**: Can query JSON fields, full-text search, etc.

## Database Schema

### Table: `prod_ai_interactions`

**Key Features:**
- Captures complete request/response cycle
- Stores both structured (JSONB) and unstructured (text) data
- Links to user sessions and analyses
- Includes performance metrics (tokens, response time)
- Supports error logging

**Main Columns:**
- `user_prompt` - The actual prompt sent to AI
- `request_payload` - Complete OpenAI API request (JSONB)
- `response_content` - AI response text
- `response_data` - Full OpenAI API response (JSONB)
- `parsed_response` - Processed/parsed response (JSONB)
- `ai_interpretation` - What AI understood (JSONB)
- `tokens_used` - Token usage metrics (JSONB)
- `context_data` - Additional context (JSONB)

## Setup

### 1. Create the Table

Run the SQL script in Supabase SQL Editor:

```bash
# Run this in Supabase Dashboard → SQL Editor
scripts/create-ai-interactions-table.sql
```

### 2. Use the Logging Service

Import and use in your AI service functions:

```typescript
import { logAIInteraction, extractUserInfo } from '@/lib/services/aiLogging';
import { createClient } from '@/lib/supabase/server';

// In your AI function:
const startTime = Date.now();
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// ... make AI call ...

// After getting response:
await logAIInteraction(supabase, {
  ...extractUserInfo(user),
  endpoint: '/api/ai/suggest',
  function_name: 'getAISuggestions',
  user_prompt: prompt,
  user_requirements: requirements,
  analytics_solution: 'Google Analytics (GA4)',
  context_data: { kpi_count: 5, platforms: ['web'] },
  request_payload: requestBody,
  model_used: 'gpt-5-mini',
  system_prompt: systemPrompt,
  response_content: content,
  response_data: fullResponse,
  parsed_response: parsedData,
  tokens_used: { input: 500, output: 1500, total: 2000 },
  response_time_ms: Date.now() - startTime,
  finish_reason: 'stop',
  status: 'success',
});
```

## Data Structure Examples

### Example 1: Successful Interaction

```json
{
  "user_id": "uuid",
  "endpoint": "/api/ai/suggest",
  "user_prompt": "I need KPIs for e-commerce conversion tracking",
  "user_requirements": "Track conversion rates for online store",
  "analytics_solution": "Google Analytics (GA4)",
  "context_data": {
    "kpi_count": 5,
    "platforms": ["web", "mobile"]
  },
  "request_payload": {
    "model": "gpt-5-mini",
    "messages": [...],
    "max_completion_tokens": 20000
  },
  "response_content": "{\"kpis\": [...]}",
  "response_data": {
    "choices": [...],
    "usage": {
      "prompt_tokens": 500,
      "completion_tokens": 1500,
      "total_tokens": 2000
    }
  },
  "parsed_response": {
    "kpis": [...],
    "metrics": [...]
  },
  "tokens_used": {
    "input": 500,
    "output": 1500,
    "total": 2000
  },
  "response_time_ms": 2500,
  "status": "success"
}
```

### Example 2: Error Interaction

```json
{
  "user_id": "uuid",
  "endpoint": "/api/ai/expand-requirements",
  "user_prompt": "...",
  "status": "error",
  "error_message": "OpenAI API error: 429 - Rate limit exceeded",
  "error_data": {
    "error": {
      "message": "Rate limit exceeded",
      "type": "rate_limit_error"
    }
  },
  "response_time_ms": 100
}
```

## Querying the Data

### Find all interactions for a user
```sql
SELECT * FROM prod_ai_interactions 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC;
```

### Find interactions by endpoint
```sql
SELECT * FROM prod_ai_interactions 
WHERE endpoint = '/api/ai/suggest'
ORDER BY created_at DESC;
```

### Search prompts (full-text search)
```sql
SELECT * FROM prod_ai_interactions 
WHERE to_tsvector('english', user_prompt) @@ to_tsquery('english', 'conversion & tracking');
```

### Query JSONB fields
```sql
-- Find interactions with specific model
SELECT * FROM prod_ai_interactions 
WHERE request_payload->>'model' = 'gpt-5-mini';

-- Find interactions with high token usage
SELECT * FROM prod_ai_interactions 
WHERE (tokens_used->>'total')::int > 5000;

-- Find interactions with specific context
SELECT * FROM prod_ai_interactions 
WHERE context_data->>'analytics_solution' = 'Google Analytics (GA4)';
```

### Analytics Queries
```sql
-- Average response time by endpoint
SELECT 
  endpoint,
  AVG(response_time_ms) as avg_response_time,
  COUNT(*) as total_requests
FROM prod_ai_interactions
WHERE status = 'success'
GROUP BY endpoint;

-- Token usage statistics
SELECT 
  model_used,
  AVG((tokens_used->>'total')::int) as avg_tokens,
  SUM((tokens_used->>'total')::int) as total_tokens
FROM prod_ai_interactions
WHERE tokens_used IS NOT NULL
GROUP BY model_used;

-- Error rate by endpoint
SELECT 
  endpoint,
  COUNT(*) FILTER (WHERE status = 'error') as errors,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'error') / COUNT(*), 2) as error_rate_pct
FROM prod_ai_interactions
GROUP BY endpoint;
```

## Security & Privacy

- **RLS Enabled**: Users can only see their own interactions
- **Admin Access**: Admins can view all interactions for analytics
- **No Sensitive Data**: API keys are never logged
- **User Control**: Users can request deletion of their data

## Performance Considerations

- **Non-blocking**: Logging never blocks the main AI flow
- **Indexed**: All common query patterns are indexed
- **JSONB**: Efficient storage and querying of JSON data
- **Partitioning**: Can partition by date if volume grows

## Next Steps

1. ✅ Run SQL script to create table
2. ⏳ Integrate logging into AI service functions
3. ⏳ Add logging to all AI endpoints:
   - `/api/ai/suggest`
   - `/api/ai/expand-requirements`
   - `/api/ai/insights`
   - `/api/ai/dashboard`
   - `/api/ai/submit-new-items`
4. ⏳ Create admin dashboard for viewing interactions
5. ⏳ Set up data retention policies

## Benefits

- **Debugging**: See exactly what prompts/responses were used
- **Analytics**: Understand usage patterns, token costs, performance
- **Improvement**: Analyze what works/doesn't work
- **Compliance**: Audit trail of all AI interactions
- **Cost Tracking**: Monitor token usage and costs

