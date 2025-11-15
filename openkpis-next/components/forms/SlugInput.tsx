import React, { useMemo } from 'react';

interface SlugInputProps {
  nameValue: string;
  slugValue: string;
  onChange: (value: string) => void;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function SlugInput({ nameValue, slugValue, onChange }: SlugInputProps) {
  const slugPreview = useMemo(() => generateSlug(slugValue || nameValue), [slugValue, nameValue]);

  return (
    <div>
      <input
        type="text"
        value={slugValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder="auto-generated-from-name"
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          backgroundColor: 'var(--ifm-color-emphasis-50)',
        }}
      />
      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-600)' }}>
        Preview: {slugPreview || '—'}
      </p>
    </div>
  );
}


