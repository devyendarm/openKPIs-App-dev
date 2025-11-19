import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withTablePrefix } from '@/src/types/entities';

type ItemType = 'kpi' | 'event' | 'dimension' | 'metric' | 'dashboard';

type AnalysisItem = {
  item_type: ItemType;
  item_id: string;
};

type ExportableEntity = {
  id: string;
  slug: string | null;
  name: string;
  sql_query?: string | null;
  data_layer_mapping?: string | Record<string, unknown> | null;
  xdm_mapping?: string | Record<string, unknown> | null;
  amplitude_implementation?: string | null;
  description?: string | null;
  category?: string | null;
  formula?: string | null;
  status?: string | null;
  created_at?: string | null;
  item_type?: ItemType;
};

type DownloadRequestBody = {
  items: AnalysisItem[];
};

export async function POST(request: NextRequest) {
  try {
    const { items }: DownloadRequestBody = await request.json();
    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'sql';
    const solution = searchParams.get('solution');

    const supabase = await createClient();

    // Fetch full item data from database
    const itemData: ExportableEntity[] = [];
    for (const item of items) {
      const tableName = (() => {
        switch (item.item_type) {
          case 'kpi':
            return withTablePrefix('kpis');
          case 'event':
            return withTablePrefix('events');
          case 'dimension':
            return withTablePrefix('dimensions');
          case 'metric':
            return withTablePrefix('metrics');
          default:
            return withTablePrefix('dashboards');
        }
      })();

      const { data } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', item.item_id)
        .single();

      if (data) {
        itemData.push({ ...data, item_type: item.item_type });
      }
    }

    let content = '';
    let contentType = 'text/plain';
    let filename = 'analysis';

    if (type === 'sql') {
      // Combine all SQL queries
      content = itemData
        .map((item) => {
          if (item.sql_query) {
            return `-- ${item.name}\n-- ${item.item_type?.toUpperCase() || 'UNKNOWN'}\n${item.sql_query}\n\n`;
          }
          return null;
        })
        .filter(Boolean)
        .join('---\n\n');
      
      contentType = 'text/sql';
      filename = 'analysis_compiled.sql';
    } else if (type === 'datalayer') {
      // Consolidated data layer based on solution
      const dataLayer: Record<string, unknown> = {};
      
      itemData.forEach((item) => {
        if (solution === 'ga4' && item.data_layer_mapping) {
          // Parse and merge GA4 mappings
          try {
            const mapping = typeof item.data_layer_mapping === 'string' 
              ? JSON.parse(item.data_layer_mapping) 
              : item.data_layer_mapping;
            Object.assign(dataLayer, mapping);
          } catch {
            // If not JSON, treat as text
            if (item.slug) {
              dataLayer[item.slug] = item.data_layer_mapping;
            }
          }
        } else if (solution === 'adobe' && item.xdm_mapping) {
          // Parse and merge Adobe XDM mappings
          try {
            const mapping = typeof item.xdm_mapping === 'string'
              ? JSON.parse(item.xdm_mapping as string)
              : item.xdm_mapping;
            Object.assign(dataLayer, mapping);
          } catch {
            if (item.slug) {
              dataLayer[item.slug] = item.xdm_mapping;
            }
          }
        } else if (solution === 'amplitude' && item.amplitude_implementation && item.slug) {
          dataLayer[item.slug] = item.amplitude_implementation;
        }
      });

      content = JSON.stringify(dataLayer, null, 2);
      contentType = 'application/json';
      filename = `data_layer_${solution}.json`;
    } else if (type === 'excel') {
      // Excel export - simplified JSON structure for now
      // In production, use a library like xlsx
      const excelData = itemData.map((item) => ({
        Type: item.item_type,
        Name: item.name,
        Description: item.description || '',
        Category: item.category || '',
        Formula: item.formula || '',
        SQL: item.sql_query || '',
        Status: item.status || '',
        Created: item.created_at || '',
      }));

      content = JSON.stringify(excelData, null, 2);
      contentType = 'application/json';
      filename = 'analysis_dashboard.json';
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate download';
    console.error('Error generating download:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

