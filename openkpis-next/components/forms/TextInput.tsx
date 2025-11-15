import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}

export default function TextInput({ value, onChange, placeholder, required, type = 'text' }: TextInputProps) {
  return (
    <input
      type={type}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '0.75rem',
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: '6px',
        fontSize: '1rem',
      }}
      placeholder={placeholder}
    />
  );
}


