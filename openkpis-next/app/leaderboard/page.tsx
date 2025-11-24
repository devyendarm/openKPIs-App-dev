import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { computeLeaderboard } from '@/lib/services/leaderboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const contributors = await computeLeaderboard(supabase);

  return (
    <main className="page-main-wide">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-header-title">Contributor Leaderboard</h1>
          <p className="page-header-subtitle">Top contributors to the OpenKPIs repository</p>
        </div>
      </div>

      <div className="card">
        <table className="table table--striped">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Contributor</th>
              <th className="text-right">KPIs</th>
              <th className="text-right">Events</th>
              <th className="text-right">Dimensions</th>
              <th className="text-right">Metrics</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {!contributors || contributors.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">No contributors yet</div>
                </td>
              </tr>
            ) : (
              contributors.map((contributor, index) => (
                <tr key={contributor.userId}>
                  <td>
                    <span className={`rank-badge ${
                      index === 0 ? 'rank-badge--gold' : index === 1 ? 'rank-badge--silver' : index === 2 ? 'rank-badge--bronze' : ''
                    }`}>{index + 1}</span>
                  </td>
                  <td>
                    <div className="contrib">
                      <div>
                        <div className="contrib-name">
                          {contributor.full_name || contributor.github_username || contributor.userId}
                        </div>
                        {contributor.github_username && (
                          <a
                            href={`https://github.com/${contributor.github_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link"
                          >
                            @{contributor.github_username}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-right">{contributor.total_kpis}</td>
                  <td className="text-right">{contributor.total_events}</td>
                  <td className="text-right">{contributor.total_dimensions}</td>
                  <td className="text-right">{contributor.total_metrics}</td>
                  <td className="text-right">
                    {contributor.total_contributions}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

