import React from 'react';
import Link from 'next/link';
import '@/app/styles/components.css';

interface SubmitBarProps {
  submitting: boolean;
  submitLabel: string;
  cancelHref: string;
  // Fork+PR options
  useForkPR?: boolean;
  forkPreferenceEnabled?: boolean | null;
  forkPreferenceLoading?: boolean;
  onForkPROptionClick?: () => void;
}

export default function SubmitBar({ 
  submitting, 
  submitLabel, 
  cancelHref,
  useForkPR = false,
  forkPreferenceEnabled = null,
  forkPreferenceLoading = false,
  onForkPROptionClick,
}: SubmitBarProps) {
  // Show fork option if preference is loaded (backend handles feature flag)
  const showForkOption = !forkPreferenceLoading;
  const buttonClass = useForkPR 
    ? 'submit-button submit-button-success' 
    : 'submit-button submit-button-primary';

  return (
    <div className="submit-bar">
      {/* Primary action buttons */}
      <div className="submit-bar-actions">
        <button
          type="submit"
          disabled={submitting}
          className={buttonClass}
        >
          {submitting 
            ? 'Please wait…' 
            : useForkPR 
              ? 'Create with GitHub Fork + PR' 
              : submitLabel || 'Quick Create'}
        </button>
        <Link
          href={cancelHref}
          className="btn"
        >
          Cancel
        </Link>
      </div>

      {/* Helper text and fork option */}
      {showForkOption && (
        <div className={`submit-bar-helper ${useForkPR ? 'submit-bar-helper-success' : ''}`}>
          {useForkPR ? (
            <>
              <p>
                <strong>✓ GitHub Fork + PR mode enabled</strong>
              </p>
              <p className="submit-bar-helper-text">
                This will create a fork in your GitHub account and open a PR for contribution credit.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Quick Create</strong> - No GitHub fork or contribution credit (tracked only in OpenKPIs)
              </p>
              {onForkPROptionClick && (
                <button
                  type="button"
                  onClick={onForkPROptionClick}
                  disabled={submitting}
                  className="submit-bar-helper-button"
                >
                  Advanced: Create with GitHub Fork + PR (for contribution credit)
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


