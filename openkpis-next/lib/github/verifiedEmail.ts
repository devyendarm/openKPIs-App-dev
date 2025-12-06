import { cookies } from 'next/headers';

type GitHubEmail = {
	email: string;
	primary: boolean;
	verified: boolean;
	visibility?: 'public' | null;
};

/**
 * Fetch the user's verified email from GitHub using the provider token found in the secure cookie.
 * Returns the primary verified email if available, otherwise any verified email, otherwise null.
 */
export async function getVerifiedEmailFromGitHubTokenCookie(): Promise<string | null> {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get('openkpis_github_token')?.value;
		if (!token) return null;
		return await getVerifiedEmailFromToken(token);
	} catch {
		return null;
	}
}

/**
 * Fetch the user's verified email from GitHub given an OAuth access token.
 * Requires the token to have permission to read user emails (user:email scope for private emails).
 */
export async function getVerifiedEmailFromToken(token: string): Promise<string | null> {
	try {
		const resp = await fetch('https://api.github.com/user/emails', {
			headers: {
				Authorization: `token ${token}`,
				Accept: 'application/vnd.github+json',
				'User-Agent': 'OpenKPIs',
			},
			cache: 'no-store',
		});

		if (!resp.ok) {
			return null;
		}

		const emails = (await resp.json()) as GitHubEmail[];
		if (!Array.isArray(emails) || emails.length === 0) {
			return null;
		}

		const primaryVerified = emails.find((e) => e.primary && e.verified);
		if (primaryVerified?.email) return primaryVerified.email;

		const anyVerified = emails.find((e) => e.verified);
		return anyVerified?.email ?? null;
	} catch {
		return null;
	}
}


