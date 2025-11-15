import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { ok, badRequest, unauthorized, forbidden, error as errorResp, multiStatus } from '@/lib/api/response';

const TABLE_CONFIG: Record<
  string,
  { table: string; syncPath: (id: string) => string }
> = {
  kpi: { table: 'kpis', syncPath: (id: string) => `/api/kpis/${id}/sync-github` },
  metric: { table: 'metrics', syncPath: (id: string) => `/api/metrics/${id}/sync-github` },
  dimension: { table: 'dimensions', syncPath: (id: string) => `/api/dimensions/${id}/sync-github` },
  event: { table: 'events', syncPath: (id: string) => `/api/events/${id}/sync-github` },
  dashboard: { table: 'dashboards', syncPath: (id: string) => `/api/dashboards/${id}/sync-github` },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    // Require admin or editor role (shared helper)
    const { getUserRoleServer } = await import('@/lib/roles/server');
    const role = await getUserRoleServer();
    const isAuthorized = role === 'admin' || role === 'editor';
    if (!isAuthorized) {
      return forbidden();
    }

    const { itemType, itemId } = await request.json();

    if (!itemType || !itemId) {
      return badRequest('itemType and itemId are required');
    }

    const config = TABLE_CONFIG[itemType as string];

    if (!config) {
      return badRequest(`Unsupported item type: ${itemType}`);
    }

    const admin = createAdminClient();
    const userName = user.user_metadata?.user_name || user.email;
    const timestamp = new Date().toISOString();

    const { data: updated, error: updateError } = await admin
      .from(config.table)
      .update({
        status: 'published',
        last_modified_by: userName,
        last_modified_at: timestamp,
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError || !updated) {
      return errorResp(updateError?.message || 'Failed to update record', 500);
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get('origin') ||
      new URL(request.url).origin;

    const syncResponse = await fetch(`${baseUrl}${config.syncPath(itemId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edited' }),
    });

    if (!syncResponse.ok) {
      const errorBody = await syncResponse.json().catch(() => ({}));
      console.error('[Editor Publish] GitHub sync failed', errorBody);
      return multiStatus('Item published but GitHub sync failed', errorBody);
    }

    return ok({ published: true, item: updated });
  } catch (error: any) {
    console.error('[Editor Publish] Error', error);
    return errorResp(error?.message || 'Failed to publish item', 500);
  }
}
