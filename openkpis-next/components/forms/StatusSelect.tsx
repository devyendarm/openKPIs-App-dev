import React from 'react';

export type ItemStatus = 'draft' | 'published';

interface StatusSelectProps {
  value: ItemStatus;
  onChange: (value: ItemStatus) => void;
}

export default function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ItemStatus)}
      style={{
        width: '100%',
        padding: '0.75rem',
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: '6px',
        fontSize: '1rem',
      }}
    >
      <option value="draft">Draft</option>
      <option value="published">Published</option>
    </select>
  );
}
