'use client';

import React from 'react';
import '@/app/styles/components.css';

interface GitHubForkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDontShowAgain: () => void;
}

export default function GitHubForkModal({
  isOpen,
  onClose,
  onConfirm,
  onDontShowAgain,
}: GitHubForkModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-title" className="modal-title">
          Create with GitHub Fork + PR
        </h2>

        <div className="modal-body">
          <p>
            This option will create a <strong>fork</strong> of the OpenKPIs repository in your GitHub account and open a Pull Request for your contribution.
          </p>

          <div className="modal-section">
            <h3 className="modal-section-title">Benefits:</h3>
            <ul className="modal-list">
              <li>✅ Real GitHub contributions (green squares on your profile)</li>
              <li>✅ Fork count increases on your GitHub</li>
              <li>✅ Professional PR workflow</li>
              <li>✅ Public contribution history</li>
            </ul>
          </div>

          <div className="modal-note">
            <p>
              <strong>Note:</strong> The fork will be a full copy of the repository. This is the standard open-source contribution workflow.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            onClick={onConfirm}
            className="modal-button modal-button-primary"
          >
            Enable & Create
          </button>
          <button
            type="button"
            onClick={onDontShowAgain}
            className="modal-button modal-button-secondary"
          >
            Enable & Don&apos;t Show Again
          </button>
          <button
            type="button"
            onClick={onClose}
            className="modal-button modal-button-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

