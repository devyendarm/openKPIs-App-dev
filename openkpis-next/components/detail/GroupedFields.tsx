import React from 'react';
import type { GroupConfig } from '@/src/types/fields';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span className="detail-row-value">{value}</span>
    </div>
  );
}

function renderGroupContent(group: GroupConfig) {
  const visibleFields = group.fields.filter(
    (field) => field.value !== null && field.value !== undefined && field.value !== '',
  );

  if (!visibleFields.length) return null;

  if (group.layout === 'table') {
    return (
      <table className="detail-group-table">
        <thead>
          <tr>
            <th className="detail-group-table-label">Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {visibleFields.map((field) => (
            <tr key={field.key}>
              <td className="detail-group-table-label">{field.label}</td>
              <td>{String(field.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const isColumns = group.layout === 'columns';
  const columns = group.columns ?? 2;

  const gridClasses =
    isColumns && columns === 2
      ? 'detail-group-grid detail-group-grid-2'
      : 'detail-group-grid';

  return (
    <div className={gridClasses}>
      {visibleFields.map((field) => (
        <DetailRow
          key={field.key}
          label={field.label}
          value={String(field.value)}
        />
      ))}
    </div>
  );
}

export function GroupedFields({ groups }: { groups: GroupConfig[] }) {
  return (
    <div className="detail-groups">
      {groups.map((group) => {
        const content = renderGroupContent(group);
        if (!content) return null;

        return (
          <section key={group.id}>
            {group.title && <h3 className="detail-group-title">{group.title}</h3>}
            {content}
          </section>
        );
      })}
    </div>
  );
}

