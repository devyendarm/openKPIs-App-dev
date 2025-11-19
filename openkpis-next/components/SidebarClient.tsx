'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export interface SidebarItem {
  id: string;
  slug: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
}

interface SidebarClientProps {
  section: 'kpis' | 'dimensions' | 'events' | 'metrics';
  items: SidebarItem[];
}

export default function SidebarClient({ section, items }: SidebarClientProps) {
  const pathname = usePathname();
  const basePath = `/${section}`;
  const currentSlug = pathname.split('/').pop() || '';

  return (
    <aside
      style={{
        position: 'sticky',
        top: '80px',
        height: 'calc(100vh - 80px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'var(--ifm-background-color)',
        borderRight: '1px solid var(--ifm-color-emphasis-200)',
        padding: '1rem',
        fontSize: '0.9375rem',
        minWidth: 0,
        maxWidth: '100%',
      }}
      className="docs-sidebar"
    >
      <div style={{ paddingRight: '0.5rem' }}>
        <nav>
          <a
            href={basePath}
            style={{
              display: 'block',
              padding: '0.625rem 1rem',
              margin: '0.125rem 0.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              color: pathname === basePath ? 'white' : 'var(--ifm-color-emphasis-700)',
              backgroundColor: pathname === basePath ? 'var(--ifm-color-primary)' : 'transparent',
              fontWeight: pathname === basePath ? '500' : '400',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (pathname !== basePath) {
                e.currentTarget.style.backgroundColor = 'var(--ifm-color-emphasis-100)';
                e.currentTarget.style.color = 'var(--ifm-color-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== basePath) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--ifm-color-emphasis-700)';
              }
            }}
          >
            All {section.charAt(0).toUpperCase() + section.slice(1)}
          </a>

          {items.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((item) => {
                const href = `${basePath}/${item.slug}`;
                const isActive = currentSlug === item.slug;

                return (
                  <li key={item.id} style={{ marginBottom: '0.125rem' }}>
                    <a
                      href={href}
                      style={{
                        display: 'block',
                        padding: '0.625rem 1rem',
                        margin: '0.125rem 0.5rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: isActive ? 'white' : 'var(--ifm-color-emphasis-700)',
                        backgroundColor: isActive ? 'var(--ifm-color-primary)' : 'transparent',
                        fontWeight: isActive ? '500' : '400',
                        fontSize: '0.9375rem',
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--ifm-color-emphasis-100)';
                          e.currentTarget.style.color = 'var(--ifm-color-primary)';
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--ifm-color-emphasis-700)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }}
                    >
                      {item.name}
                      {item.status === 'draft' && (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.375rem',
                            backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#fbbf24',
                            color: isActive ? 'white' : '#78350f',
                            borderRadius: '3px',
                            fontWeight: '500',
                          }}
                        >
                          Draft
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ifm-color-emphasis-500)' }}>
              No items found
            </div>
          )}
        </nav>
      </div>

      <style jsx>{`
        .docs-sidebar::-webkit-scrollbar {
          width: 6px;
        }
        .docs-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        .docs-sidebar::-webkit-scrollbar-thumb {
          background: var(--ifm-color-emphasis-300);
          border-radius: 3px;
        }
        .docs-sidebar::-webkit-scrollbar-thumb:hover {
          background: var(--ifm-color-emphasis-400);
        }
      `}</style>
    </aside>
  );
}


