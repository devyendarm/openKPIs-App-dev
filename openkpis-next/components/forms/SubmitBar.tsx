import React from 'react';
import Link from 'next/link';

interface SubmitBarProps {
  submitting: boolean;
  submitLabel: string;
  cancelHref: string;
}

export default function SubmitBar({ submitting, submitLabel, cancelHref }: SubmitBarProps) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '0.75rem 2rem',
          backgroundColor: 'var(--ifm-color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 500,
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
        }}
      >
        {submitting ? 'Please wait…' : submitLabel}
      </button>
      <Link
        href={cancelHref}
        style={{
          padding: '0.75rem 2rem',
          backgroundColor: 'transparent',
          color: 'var(--ifm-font-color-base)',
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Cancel
      </Link>
    </div>
  );
}


