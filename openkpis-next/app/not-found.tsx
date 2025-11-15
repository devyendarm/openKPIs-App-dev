'use client';

export default function NotFound() {
	return (
		<main style={{ maxWidth: '768px', margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' }}>
			<h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Page not found</h1>
			<p style={{ color: 'var(--ifm-color-emphasis-700)', marginBottom: '1.25rem' }}>
				The page you’re looking for doesn’t exist or was moved.
			</p>
			<a href="/" className="btn btn-primary">Go Home</a>
		</main>
	);
}



