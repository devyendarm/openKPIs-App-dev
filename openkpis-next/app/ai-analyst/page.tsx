'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AddToAnalysisButton from '@/components/AddToAnalysisButton';
import { supabase } from '@/lib/supabase/client';
import { isAuthenticated, signInWithGitHub } from '@/lib/supabase/auth';
import GitHubSignIn from '@/components/GitHubSignIn';
import type { User } from '@supabase/supabase-js';
import StepNavigation from './components/StepNavigation';
import Step1Requirements from './components/Step1Requirements';
import Step2ExpandedRequirements from './components/Step2ExpandedRequirements';
import Step3Insights from './components/Step3Insights';
import Step4Dashboards from './components/Step4Dashboards';
import type { AnalyticsSolution, Suggestion, AIExpanded, GroupedInsight, ExistingItem } from './types';

export default function AIAnalysisPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [step, setStep] = useState<number>(1);
  const [analyticsSolution, setAnalyticsSolution] = useState<AnalyticsSolution>('Google Analytics (GA4)');
  const [requirements, setRequirements] = useState('');
  const [kpiCount, setKpiCount] = useState<number>(5);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiExpanded, setAiExpanded] = useState<any>(null);
  const [editingAiExpanded, setEditingAiExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    kpis: Suggestion[];
    metrics: Suggestion[];
    dimensions: Suggestion[];
  }>({
    kpis: [],
    metrics: [],
    dimensions: [],
  });
  const [additionalSuggestions, setAdditionalSuggestions] = useState<{
    kpis: Suggestion[];
    metrics: Suggestion[];
    dimensions: Suggestion[];
  }>({
    kpis: [],
    metrics: [],
    dimensions: [],
  });
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [selectedInsights, setSelectedInsights] = useState<Set<string>>(new Set());
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [activeAccordion, setActiveAccordion] = useState<'kpis' | 'metrics' | 'dimensions' | null>('kpis');
  const [activeDashboardTab, setActiveDashboardTab] = useState<number>(0);
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [itemsInAnalysis, setItemsInAnalysis] = useState<{
    kpis: Array<{ name: string; description?: string; category?: string; tags?: string[] }>;
    metrics: Array<{ name: string; description?: string; category?: string; tags?: string[] }>;
    dimensions: Array<{ name: string; description?: string; category?: string; tags?: string[] }>;
  }>({
    kpis: [],
    metrics: [],
    dimensions: [],
  });
  const [selectedItemsToRemove, setSelectedItemsToRemove] = useState<{
    kpis: Set<string>;
    metrics: Set<string>;
    dimensions: Set<string>;
  }>({
    kpis: new Set(),
    metrics: new Set(),
    dimensions: new Set(),
  });
  const [newItems, setNewItems] = useState<{
    kpis: Set<string>;
    metrics: Set<string>;
    dimensions: Set<string>;
  }>({
    kpis: new Set(),
    metrics: new Set(),
    dimensions: new Set(),
  });
  const [submittedItems, setSubmittedItems] = useState<{
    kpis: Set<string>;
    metrics: Set<string>;
    dimensions: Set<string>;
  }>({
    kpis: new Set(),
    metrics: new Set(),
    dimensions: new Set(),
  });
  const [existingItems, setExistingItems] = useState<{
    kpis: Array<{ id: string; name: string; description?: string; category?: string; tags?: string[]; slug: string }>;
    metrics: Array<{ id: string; name: string; description?: string; category?: string; tags?: string[]; slug: string }>;
    dimensions: Array<{ id: string; name: string; description?: string; category?: string; tags?: string[]; slug: string }>;
  }>({
    kpis: [],
    metrics: [],
    dimensions: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuggested, setSelectedSuggested] = useState<{
    kpis: Set<string>;
    metrics: Set<string>;
    dimensions: Set<string>;
  }>({
    kpis: new Set(),
    metrics: new Set(),
    dimensions: new Set(),
  });
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
  }>({ visible: false, x: 0, y: 0, content: null });

  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      const authenticated = await isAuthenticated();
      if (authenticated) {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      }
      setAuthLoading(false);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadExistingItems = async () => {
      try {
        const [kpisRes, metricsRes, dimensionsRes] = await Promise.all([
          supabase.from('kpis').select('id, name, description, category, tags, slug').eq('status', 'published').order('name'),
          supabase.from('metrics').select('id, name, description, category, tags, slug').eq('status', 'published').order('name'),
          supabase.from('dimensions').select('id, name, description, category, tags, slug').eq('status', 'published').order('name'),
        ]);
        setExistingItems({
          kpis: (kpisRes.data || []).map((kpi: any) => ({
            id: kpi.id, name: kpi.name, description: kpi.description, category: kpi.category, slug: kpi.slug,
            tags: Array.isArray(kpi.tags) ? kpi.tags : typeof kpi.tags === 'string' ? JSON.parse(kpi.tags || '[]') : [],
          })),
          metrics: (metricsRes.data || []).map((metric: any) => ({
            id: metric.id, name: metric.name, description: metric.description, category: metric.category, slug: metric.slug,
            tags: Array.isArray(metric.tags) ? metric.tags : typeof metric.tags === 'string' ? JSON.parse(metric.tags || '[]') : [],
          })),
          dimensions: (dimensionsRes.data || []).map((dim: any) => ({
            id: dim.id, name: dim.name, description: dim.description, category: dim.category, slug: dim.slug,
            tags: Array.isArray(dim.tags) ? dim.tags : typeof dim.tags === 'string' ? JSON.parse(dim.tags || '[]') : [],
          })),
        });
      } catch (error) {
        console.error('Error loading existing items:', error);
      }
    };
    loadExistingItems();
  }, [user]);

  if (!user) {
    return (
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--ifm-color-emphasis-100)', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)' }}>
          <div style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '1rem' }}>🔒 AI Analyst</div>
          <p style={{ fontSize: '1.125rem', color: 'var(--ifm-color-emphasis-700)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            Please log in to use the advanced AI Analyst feature. Sign in with GitHub to get personalized KPI recommendations, dashboard suggestions, and insights.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
            <GitHubSignIn />
          </div>
        </div>
      </main>
    );
  }

  const handleAnalyze = async () => {
    if (!requirements.trim()) { alert('Please enter business requirements'); return; }
    if (!analyticsSolution) { alert('Please select an analytics solution'); return; }
    setLoading(true);
    try {
      const expandResponse = await fetch('/api/ai/expand-requirements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements, analyticsSolution, platforms, kpiCount }),
      });
      if (!expandResponse.ok) {
        const error = await expandResponse.json();
        throw new Error(error.error || 'Failed to expand requirements');
      }
      const expandedData = await expandResponse.json();
      setAiExpanded(expandedData.ai_expanded || null);

      const suggestResponse = await fetch('/api/ai/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements, analyticsSolution, kpiCount }),
      });
      if (!suggestResponse.ok) {
        const error = await suggestResponse.json();
        let errorMessage = error.error || 'Failed to get suggestions';
        if (suggestResponse.status === 401 || errorMessage.includes('API key')) {
          errorMessage += '\n\nPlease check your OPENAI_API_KEY in your .env.local file.';
          errorMessage += '\nMake sure you have a valid project API key (sk-proj-...) from https://platform.openai.com/account/api-keys';
        }
        throw new Error(errorMessage);
      }
      const data = await suggestResponse.json();
      setSuggestions({ kpis: data.kpis || [], metrics: data.metrics || [], dimensions: data.dimensions || [] });
      setStep(2);

      const detectNewItems = () => {
        const newKpis = new Set<string>(); const newMetrics = new Set<string>(); const newDimensions = new Set<string>();
        const existingNames = {
          kpis: new Set(existingItems.kpis.map(k => k.name.toLowerCase())),
          metrics: new Set(existingItems.metrics.map(m => m.name.toLowerCase())),
          dimensions: new Set(existingItems.dimensions.map(d => d.name.toLowerCase())),
        };
        (data.kpis || []).forEach((kpi: Suggestion) => { if (!existingNames.kpis.has(kpi.name.toLowerCase())) newKpis.add(kpi.name); });
        (data.metrics || []).forEach((metric: Suggestion) => { if (!existingNames.metrics.has(metric.name.toLowerCase())) newMetrics.add(metric.name); });
        (data.dimensions || []).forEach((dim: Suggestion) => { if (!existingNames.dimensions.has(dim.name.toLowerCase())) newDimensions.add(dim.name); });
        setNewItems({ kpis: newKpis, metrics: newMetrics, dimensions: newDimensions });
      };
      detectNewItems();
      setStep(2);
    } catch (error: any) {
      console.error('Error analyzing:', error);
      alert(error.message || 'Failed to get AI suggestions. Please try again.');
      if ((error.message || '').includes('API key')) {
        console.error('Configuration Error:\n1. Check that OPENAI_API_KEY is set in your .env.local file\n2. Key should start with "sk-proj-"\n3. Verify at https://platform.openai.com/account/api-keys\n4. Ensure billing is enabled\n5. Restart dev server');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromAnalysis = (type: 'kpis' | 'metrics' | 'dimensions', itemNames: string[]) => {
    setItemsInAnalysis(prev => ({ ...prev, [type]: prev[type].filter(item => !itemNames.includes(item.name)) }));
  };

  const handleAddToAnalysis = (type: 'kpi' | 'metric' | 'dimension', item: Suggestion) => {
    if (type === 'kpi') { setSelectedKPIs(prev => [...new Set([...prev, item.name])]); }
    const itemData = { name: item.name, description: item.description, category: item.category, tags: item.tags };
    setItemsInAnalysis(prev => {
      const typeKey = `${type}s` as 'kpis' | 'metrics' | 'dimensions';
      const existing = prev[typeKey].find(i => i.name === item.name);
      if (existing) return prev;
      return { ...prev, [typeKey]: [...prev[typeKey], itemData] };
    });
  };

  const handleLoadAdditional = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/additional', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements, analyticsSolution, existingSuggestions: suggestions }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get additional suggestions');
      }
      const data = await response.json();
      setAdditionalSuggestions({ kpis: data.kpis || [], metrics: data.metrics || [], dimensions: data.dimensions || [] });
      setStep(3);
    } catch (error: any) {
      console.error('Error loading additional:', error);
      alert(error.message || 'Failed to get additional suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMoreInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements, analyticsSolution, aiExpanded, itemsInAnalysis }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get insights');
      }
      const data = await response.json();
      setInsights((prev) => [...prev, ...(data.insights || [])]);
    } catch (error: any) {
      console.error('Error generating insights:', error);
      alert(error.message || 'Failed to get insights');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDashboards = async () => {
    if (selectedInsights.size === 0) { alert('Please select at least one insight before viewing dashboard suggestions'); return; }
    setLoading(true);
    try {
      const selectedInsightsArray = Array.from(selectedInsights).map(id => insights.find(i => i.id === id)).filter(Boolean);
      const response = await fetch('/api/ai/dashboard', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements, analyticsSolution, selectedInsights: selectedInsightsArray, aiExpanded }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get dashboard suggestions');
      }
      const data = await response.json();
      setDashboards(data.dashboards || []);
      setStep(4);
    } catch (error: any) {
      console.error('Error loading dashboards:', error);
      alert(error.message || 'Failed to get dashboard suggestions');
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckbox = (type: 'kpis' | 'metrics' | 'dimensions', itemName: string) => {
    setSelectedSuggested(prev => {
      const newSet = new Set(prev[type]);
      if (newSet.has(itemName)) newSet.delete(itemName); else newSet.add(itemName);
      return { ...prev, [type]: newSet };
    });
  };

  const handleBulkAddToAnalysis = async () => {
    const kpiNames: string[] = [];
    selectedSuggested.kpis.forEach(name => kpiNames.push(name));
    setSelectedKPIs(prev => [...new Set([...prev, ...kpiNames])]);

    const itemsToSubmit: Array<{ type: 'kpi' | 'metric' | 'dimension'; item: Suggestion }> = [];
    selectedSuggested.kpis.forEach(kpiName => { if (newItems.kpis.has(kpiName)) { const item = suggestions.kpis.find(k => k.name === kpiName); if (item) itemsToSubmit.push({ type: 'kpi', item }); } });
    selectedSuggested.metrics.forEach(metricName => { if (newItems.metrics.has(metricName)) { const item = suggestions.metrics.find(m => m.name === metricName); if (item) itemsToSubmit.push({ type: 'metric', item }); } });
    selectedSuggested.dimensions.forEach(dimName => { if (newItems.dimensions.has(dimName)) { const item = suggestions.dimensions.find(d => d.name === dimName); if (item) itemsToSubmit.push({ type: 'dimension', item }); } });

    if (itemsToSubmit.length > 0 && user) {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/submit-new-items', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itemsToSubmit }),
        });
        if (response.ok) {
          const submittedNames = { kpis: new Set<string>(), metrics: new Set<string>(), dimensions: new Set<string>() };
          itemsToSubmit.forEach(({ type, item }) => {
            if (type === 'kpi') submittedNames.kpis.add(item.name);
            else if (type === 'metric') submittedNames.metrics.add(item.name);
            else if (type === 'dimension') submittedNames.dimensions.add(item.name);
          });
          setSubmittedItems(prev => ({
            kpis: new Set([...prev.kpis, ...submittedNames.kpis]),
            metrics: new Set([...prev.metrics, ...submittedNames.metrics]),
            dimensions: new Set([...prev.dimensions, ...submittedNames.dimensions]),
          }));
        }
      } catch (error) {
        console.error('Error submitting new items:', error);
      } finally {
        setLoading(false);
      }
    }

    setItemsInAnalysis(prev => ({
      kpis: [...prev.kpis, ...suggestions.kpis.filter(kpi => selectedSuggested.kpis.has(kpi.name))
        .map(kpi => ({ name: kpi.name, description: kpi.description, category: kpi.category, tags: kpi.tags }))]
        .filter((item, index, self) => index === self.findIndex(t => t.name === item.name)),
      metrics: [...prev.metrics, ...suggestions.metrics.filter(metric => selectedSuggested.metrics.has(metric.name))
        .map(metric => ({ name: metric.name, description: metric.description, category: metric.category, tags: metric.tags }))]
        .filter((item, index, self) => index === self.findIndex(t => t.name === item.name)),
      dimensions: [...prev.dimensions, ...suggestions.dimensions.filter(dim => selectedSuggested.dimensions.has(dim.name))
        .map(dim => ({ name: dim.name, description: dim.description, category: dim.category, tags: dim.tags }))]
        .filter((item, index, self) => index === self.findIndex(t => t.name === item.name)),
    }));

    setSelectedSuggested({ kpis: new Set(), metrics: new Set(), dimensions: new Set() });
  };

  const toggleItemToRemove = (type: 'kpis' | 'metrics' | 'dimensions', itemName: string) => {
    setSelectedItemsToRemove(prev => {
      const newSet = new Set(prev[type]);
      if (newSet.has(itemName)) newSet.delete(itemName); else newSet.add(itemName);
      return { ...prev, [type]: newSet };
    });
  };

  const handleRemoveSelectedItems = () => {
    setItemsInAnalysis(prev => ({
      kpis: prev.kpis.filter(item => !selectedItemsToRemove.kpis.has(item.name)),
      metrics: prev.metrics.filter(item => !selectedItemsToRemove.metrics.has(item.name)),
      dimensions: prev.dimensions.filter(item => !selectedItemsToRemove.dimensions.has(item.name)),
    }));
    setSelectedKPIs(prev => prev.filter(kpi => !selectedItemsToRemove.kpis.has(kpi)));
    setSelectedItemsToRemove({ kpis: new Set(), metrics: new Set(), dimensions: new Set() });
  };

  const handleClearList = () => {
    setSelectedSuggested({ kpis: new Set(), metrics: new Set(), dimensions: new Set() });
  };

  const handleSaveAnalysis = async () => {
    if (!user) { alert('Please log in to save your analysis'); return; }
    setSavingAnalysis(true);
    try {
      const response = await fetch('/api/ai/save-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsInAnalysis, dashboards, insights, requirements, analyticsSolution }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save analysis');
      }
      const result = await response.json();
      alert(`Analysis saved successfully! ${result.savedItems} items added to your analysis.`);
    } catch (error: any) {
      console.error('Error saving analysis:', error);
      alert(error.message || 'Failed to save analysis. Please try again.');
    } finally {
      setSavingAnalysis(false);
    }
  };

  const showTooltip = (e: React.MouseEvent, item: Suggestion | { name: string; description?: string; category?: string; tags?: string[] }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.right + 10,
      y: rect.top,
      content: (
        <div style={{ padding: '0.75rem', maxWidth: '300px' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>{item.name}</div>
          {'description' in item && item.description && (
            <div style={{ fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-700)', marginBottom: '0.5rem' }}>
              {item.description}
            </div>
          )}
          {'category' in item && item.category && (
            <div style={{ fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: '0.25rem' }}>
              <strong>Category:</strong> {item.category}
            </div>
          )}
          {'tags' in item && item.tags && (item.tags as any[]).length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-600)' }}>
              <strong>Tags:</strong> {Array.isArray(item.tags) ? (item.tags as any[]).join(', ') : item.tags as any}
            </div>
          )}
        </div>
      ),
    });
  };

  const hideTooltip = () => { setTooltip({ visible: false, x: 0, y: 0, content: null }); };

  const addItemFromExisting = (type: 'kpis' | 'metrics' | 'dimensions', item: typeof existingItems.kpis[0]) => {
    const suggestion: Suggestion = { name: item.name, description: item.description || '', category: item.category || undefined, tags: item.tags || [] };
    setSuggestions(prev => ({ ...prev, [type]: [...prev[type], suggestion] }));
    const itemType = type.slice(0, -1) as 'kpi' | 'metric' | 'dimension';
    handleAddToAnalysis(itemType, suggestion);
    if (type === 'kpis') setSelectedKPIs(prev => [...new Set([...prev, item.name])]);
  };

  const filteredExistingItems = {
    kpis: existingItems.kpis.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))),
    metrics: existingItems.metrics.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))),
    dimensions: existingItems.dimensions.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))),
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin {0%{transform:rotate(0)}100%{transform:rotate(360deg)}}@keyframes pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.2)}}` }} />
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem' }}>AI Analyst</h1>
          <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>Get personalized KPI recommendations based on your business requirements and analytics solution</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
          {[1, 2, 3, 4].map((num) => (
            <div key={num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: step >= num ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-200)', color: step >= num ? 'white' : 'var(--ifm-color-emphasis-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, marginBottom: '0.5rem', zIndex: 2 }}>{num}</div>
              <div style={{ fontSize: '0.75rem', textAlign: 'center', color: step >= num ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-600)' }}>
                {num === 1 && 'Requirements'}
                {num === 2 && 'KPI Suggestions'}
                {num === 3 && 'Insights'}
                {num === 4 && 'Dashboards'}
              </div>
              {num < 4 && (
                <div style={{ position: 'absolute', top: '20px', left: '50%', width: '100%', height: '2px', backgroundColor: step > num ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-200)', zIndex: 1 }} />
              )}
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '3rem', maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', margin: '0 auto 1.5rem', border: '4px solid var(--ifm-color-emphasis-200)', borderTop: '4px solid var(--ifm-color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--ifm-font-color-base)' }}>Analyzing Your Requirements</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)', marginBottom: '1.5rem' }}>
                Our AI is processing your business requirements and generating {kpiCount} personalized KPIs with proportional Metrics and Dimensions...
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {[0, 1, 2].map((i) => (<div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ifm-color-primary)', animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />))}
              </div>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2.5rem', minHeight: '400px', position: 'relative', opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s ease', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', border: '1px solid var(--ifm-color-emphasis-200)' }}>
          {step === 1 && (
            <Step1Requirements
              analyticsSolution={analyticsSolution}
              setAnalyticsSolution={setAnalyticsSolution}
              requirements={requirements}
              setRequirements={setRequirements}
              kpiCount={kpiCount}
              setKpiCount={setKpiCount}
              platforms={platforms}
              setPlatforms={setPlatforms}
              loading={loading}
              onAnalyze={handleAnalyze}
            />
          )}

          {step === 2 && (
            <Step2ExpandedRequirements
              userRequirement={requirements}
              aiExpanded={aiExpanded}
              editingAiExpanded={editingAiExpanded}
              setEditingAiExpanded={setEditingAiExpanded}
              setAiExpanded={setAiExpanded}
              suggestions={suggestions}
              existingItems={existingItems}
              itemsInAnalysis={itemsInAnalysis}
              onAddToAnalysis={handleAddToAnalysis}
              onAddExistingToAnalysis={addItemFromExisting}
              onRemoveFromAnalysis={handleRemoveFromAnalysis}
              onNext={async () => {
                if (insights.length === 0) {
                  setLoading(true);
                  try {
                    const response = await fetch('/api/ai/insights', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ requirements, analyticsSolution, aiExpanded }),
                    });
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to get insights');
                    }
                    const data = await response.json();
                    setInsights(data.insights || []);
                    setStep(3);
                  } catch (error: any) {
                    console.error('Error loading insights:', error);
                    alert(error.message || 'Failed to get insights');
                  } finally {
                    setLoading(false);
                  }
                } else {
                  setStep(3);
                }
              }}
            />
          )}

          {step === 3 && (
            <Step3Insights
              insights={insights}
              selectedInsights={selectedInsights}
              setSelectedInsights={setSelectedInsights}
              aiExpanded={aiExpanded}
              requirements={requirements}
              analyticsSolution={analyticsSolution}
              loading={loading}
              onGenerateMore={handleGenerateMoreInsights}
              onSaveAnalysis={handleSaveAnalysis}
              onNext={() => handleLoadDashboards()}
            />
          )}

          {step === 4 && (
            <Step4Dashboards dashboards={dashboards} loading={loading} onSaveAnalysis={handleSaveAnalysis} />
          )}
        </div>
      </main>
    </>
  );
}


