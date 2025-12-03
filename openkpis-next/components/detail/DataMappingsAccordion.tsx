'use client';

import React from 'react';
import Accordion, { type AccordionItem } from './Accordion';
import CodeBlockToolbar from '@/components/CodeBlockToolbar';

interface DataMappingsAccordionProps {
  dataLayerMapping?: string | null;
  adobeClientDataLayer?: string | null;
  xdmMapping?: string | null;
}

// Normalize JSON mappings (same logic as in page.tsx)
function normalizeJsonMapping(raw?: string | null): string | null {
  if (!raw) return null;
  let text = raw;

  // Try to parse JSON if it looks like JSON
  try {
    const trimmed = text.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    }
  } catch {
    // ignore parse errors and fall back to string normalization
  }

  // Replace HTML <br> tags with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip a leading "json" marker if present
  text = text.replace(/^\s*json\s*/i, '');

  return text;
}

function renderCodeBlock(code: string | null, language: string, blockId: string) {
  if (!code) return null;
  
  return (
    <div style={{ position: 'relative', background: 'var(--ifm-color-emphasis-50)', borderRadius: '8px', overflow: 'hidden' }}>
      <pre
        id={blockId}
        style={{
          margin: 0,
          padding: '1.25rem',
          overflowX: 'auto',
          fontFamily: 'var(--ifm-font-family-monospace)',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          background: 'var(--ifm-color-emphasis-50)',
        }}
      >
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
      <CodeBlockToolbar code={code} language={language} blockId={blockId} />
    </div>
  );
}

export default function DataMappingsAccordion({
  dataLayerMapping,
  adobeClientDataLayer,
  xdmMapping,
}: DataMappingsAccordionProps) {
  const normalizedDataLayer = normalizeJsonMapping(dataLayerMapping);
  const normalizedAdobeClient = normalizeJsonMapping(adobeClientDataLayer);
  const normalizedXdm = normalizeJsonMapping(xdmMapping);

  // Only show accordion if at least one mapping exists
  if (!normalizedDataLayer && !normalizedAdobeClient && !normalizedXdm) {
    return null;
  }

  const accordionItems: AccordionItem[] = [];

  if (normalizedDataLayer) {
    accordionItems.push({
      id: 'data-layer-mapping',
      title: 'Data Layer Mapping',
      content: renderCodeBlock(normalizedDataLayer, 'json', 'data-layer-mapping'),
    });
  }

  if (normalizedAdobeClient) {
    accordionItems.push({
      id: 'adobe-client-data-layer',
      title: 'Adobe Client Data Layer',
      content: renderCodeBlock(normalizedAdobeClient, 'json', 'adobe-client-data-layer'),
    });
  }

  if (normalizedXdm) {
    accordionItems.push({
      id: 'xdm-mapping',
      title: 'XDM Mapping',
      content: renderCodeBlock(normalizedXdm, 'json', 'xdm-mapping'),
    });
  }

  if (accordionItems.length === 0) {
    return null;
  }

  return (
    <section id="data-mappings" style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Data Mappings</h2>
      <Accordion items={accordionItems} singleOpen={false} />
    </section>
  );
}

