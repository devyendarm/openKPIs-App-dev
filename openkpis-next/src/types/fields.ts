export type FieldValue = string | number | null | undefined;

export type FieldConfig = {
  key: string; // unique key within a group
  label: string;
  value: FieldValue;
};

export type GroupLayout = 'rows' | 'columns' | 'table';

export type GroupConfig = {
  id: string;
  title?: string; // optional group heading ("Governance", "Business Context", etc.)
  layout: GroupLayout;
  columns?: number; // used only for 'columns' layout
  fields: FieldConfig[];
};


