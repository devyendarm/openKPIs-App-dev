import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const base = process.env.NEXT_PUBLIC_APP_URL || 'https://openkpis.org';
	const now = new Date().toISOString();

	// Static top-level routes; dynamic entity URLs can be added later via data fetch
	const urls = [
		'/', '/kpis', '/metrics', '/dimensions', '/events', '/dashboards', '/ai-analyst',
	].map((path) => ({
		url: `${base}${path}`,
		lastModified: now,
		changeFrequency: 'daily' as const,
		priority: 0.7,
	}));

	return urls;
}



