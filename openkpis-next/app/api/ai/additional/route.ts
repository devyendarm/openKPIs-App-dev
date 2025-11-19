import { NextRequest, NextResponse } from 'next/server';
import { getAdditionalSuggestions, type AISuggestion } from '@/lib/services/ai';

type AdditionalRequestBody = {
  requirements: string;
  analyticsSolution: string;
  existingSuggestions?: {
    kpis?: AISuggestion[];
    metrics?: AISuggestion[];
    dimensions?: AISuggestion[];
  };
};

export async function POST(request: NextRequest) {
  try {
    const { requirements, analyticsSolution, existingSuggestions } = (await request.json()) as AdditionalRequestBody;

    if (!requirements || !analyticsSolution) {
      return NextResponse.json(
        { error: 'Requirements and analytics solution are required' },
        { status: 400 }
      );
    }

    // Flatten existing suggestions into a single array
    const allExisting: AISuggestion[] = [
      ...(existingSuggestions?.kpis || []),
      ...(existingSuggestions?.metrics || []),
      ...(existingSuggestions?.dimensions || []),
    ];

    const additional = await getAdditionalSuggestions(
      requirements,
      analyticsSolution,
      allExisting
    );

    return NextResponse.json(additional);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get additional suggestions';
    console.error('[AI Additional] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

