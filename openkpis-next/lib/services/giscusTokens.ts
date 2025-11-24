const GITHUB_TOKEN_COOKIE = 'openkpis_github_token';

type CookieAccessor = {
	get(name: string): { value: string } | undefined;
};

export function getGithubProviderTokenFromCookies(cookieStore: CookieAccessor | undefined): string | null {
	if (!cookieStore || typeof cookieStore.get !== 'function') {
		return null;
	}

	const cookieValue = cookieStore.get(GITHUB_TOKEN_COOKIE)?.value ?? null;
	return cookieValue && cookieValue.trim().length > 0 ? cookieValue : null;
}

