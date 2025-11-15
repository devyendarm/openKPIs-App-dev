import React, { useState } from 'react';

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export default function TagsInput({ value, onChange, placeholder }: TagsInputProps) {
  const [tagInput, setTagInput] = useState('');

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setTagInput('');
    }
  }

  return (
    <div>
      <input
        type="text"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
          }
        }}
        placeholder={placeholder || 'Add a tag and press Enter'}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderRadius: '6px',
          fontSize: '1rem',
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        {value.map((tag) => (
          <span
            key={tag}
            style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: 'var(--ifm-color-primary)',
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                padding: 0,
                fontSize: '1rem',
              }}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}


