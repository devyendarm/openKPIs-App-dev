'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		// Log to console; if Sentry is configured, it can capture here
		console.error('[GlobalError]', error);
	}, [error]);

	return (
		<html>
			<body>
				<main style={{ maxWidth: '768px', margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' }}>
					<h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Something went wrong</h1>
					<p style={{ color: 'var(--ifm-color-emphasis-700)', marginBottom: '1.25rem' }}>
						An unexpected error occurred. Please try again.
					</p>
					<button className="btn btn-primary" onClick={() => reset()}>Try again</button>
				</main>
			</body>
		</html>
	);
}



