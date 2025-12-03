'use client';

import React, { useState, useCallback } from 'react';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  /**
   * If true, only one accordion item can be open at a time (auto-closes others).
   * If false, multiple items can be open simultaneously.
   * @default false
   */
  singleOpen?: boolean;
  /**
   * Additional CSS class name for the accordion container
   */
  className?: string;
  /**
   * Callback fired when an accordion item is opened or closed
   */
  onToggle?: (itemId: string, isOpen: boolean) => void;
}

export default function Accordion({
  items,
  singleOpen = false,
  className = '',
  onToggle,
}: AccordionProps) {
  // Track which items are open
  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    const defaultOpen = new Set<string>();
    items.forEach((item) => {
      if (item.defaultOpen) {
        defaultOpen.add(item.id);
      }
    });
    return defaultOpen;
  });

  const handleToggle = useCallback(
    (itemId: string) => {
      setOpenItems((prev) => {
        const isCurrentlyOpen = prev.has(itemId);
        const newOpenItems = new Set(prev);

        if (singleOpen) {
          // Single open mode: close all others, toggle this one
          newOpenItems.clear();
          if (!isCurrentlyOpen) {
            newOpenItems.add(itemId);
          }
        } else {
          // Multiple open mode: just toggle this one
          if (isCurrentlyOpen) {
            newOpenItems.delete(itemId);
          } else {
            newOpenItems.add(itemId);
          }
        }

        // Call the callback
        if (onToggle) {
          onToggle(itemId, !isCurrentlyOpen);
        }

        return newOpenItems;
      });
    },
    [singleOpen, onToggle],
  );

  return (
    <div className={`accordion ${className}`.trim()}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);

        return (
          <div key={item.id} className="accordion-item">
            <button
              type="button"
              id={`accordion-header-${item.id}`}
              className={`accordion-header ${isOpen ? 'accordion-header--open' : ''}`}
              onClick={() => handleToggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
            >
              <span className="accordion-title">{item.title}</span>
              <span className="accordion-icon" aria-hidden="true">
                {isOpen ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 12H6" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 6v12M6 12h12" />
                  </svg>
                )}
              </span>
            </button>
            {isOpen && (
              <div
                id={`accordion-content-${item.id}`}
                className="accordion-content"
                role="region"
                aria-labelledby={`accordion-header-${item.id}`}
              >
                <div className="accordion-content-inner">{item.content}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

