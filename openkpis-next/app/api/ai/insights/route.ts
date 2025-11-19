import { NextRequest, NextResponse } from 'next/server';
import { getInsightSuggestions, type GroupedInsight } from '@/lib/services/ai';

// Increase timeout for insights generation (up to 200 seconds)
export const maxDuration = 200;

type InsightRequestBody = {
  requirements: string;
  analyticsSolution: string;
  aiExpanded?: Record<string, unknown> | null;
  itemsInAnalysis?: {
    kpis?: Array<{ name: string; description?: string; category?: string; tags?: string[] }>;
    metrics?: Array<{ name: string; description?: string; category?: string; tags?: string[] }>;
    dimensions?: Array<{ name: string; description?: string; category?: string; tags?: string[] }>;
  };
};

export async function POST(request: NextRequest) {
  try {
    const { requirements, analyticsSolution, aiExpanded, itemsInAnalysis }: InsightRequestBody = await request.json();

    if (!requirements || !analyticsSolution) {
      return NextResponse.json(
        { error: 'Missing required fields: requirements, analyticsSolution' },
        { status: 400 }
      );
    }

    const insights = await getInsightSuggestions(
      requirements,
      analyticsSolution,
      aiExpanded || null,
      itemsInAnalysis?.kpis || [],
      itemsInAnalysis?.metrics || [],
      itemsInAnalysis?.dimensions || []
    );

    return NextResponse.json<{ insights: GroupedInsight[] }>({ insights });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get insights';
    console.error('[API] AI insights error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

