import React from 'react';

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function Textarea({ value, onChange, placeholder, rows = 4 }: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      style={{
        width: '100%',
        padding: '0.75rem',
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: '6px',
        fontSize: '1rem',
        fontFamily: 'inherit',
      }}
      placeholder={placeholder}
    />
  );
}


