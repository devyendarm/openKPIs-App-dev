import React from 'react';

interface FormFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function FormField({ label, description, required, children }: FormFieldProps) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
        {label} {required ? <span style={{ color: 'red' }}>*</span> : null}
      </label>
      {children}
      {description ? (
        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-600)' }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}


