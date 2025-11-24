function requiredPublic(value: string | undefined, name: string): string {
	if (!value || value.length === 0) {
		throw new Error(`[Giscus] Missing environment variable: ${name}`);
	}
	return value;
}

export const giscusConfig = {
	// Required: force env-only for repo/category so we never use stale defaults
	repo: requiredPublic(process.env.NEXT_PUBLIC_GISCUS_REPO, 'NEXT_PUBLIC_GISCUS_REPO'),
	repoId: requiredPublic(process.env.NEXT_PUBLIC_GISCUS_REPO_ID, 'NEXT_PUBLIC_GISCUS_REPO_ID'),
	category: requiredPublic(process.env.NEXT_PUBLIC_GISCUS_CATEGORY, 'NEXT_PUBLIC_GISCUS_CATEGORY'),
	categoryId: requiredPublic(process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID, 'NEXT_PUBLIC_GISCUS_CATEGORY_ID'),

	// Optional: sane defaults, overridable via env
	mapping: process.env.NEXT_PUBLIC_GISCUS_MAPPING ?? 'pathname',
	strict: process.env.NEXT_PUBLIC_GISCUS_STRICT ?? '0',
	reactionsEnabled: process.env.NEXT_PUBLIC_GISCUS_REACTIONS_ENABLED ?? '1',
	emitMetadata: process.env.NEXT_PUBLIC_GISCUS_EMIT_METADATA ?? '0',
	inputPosition: process.env.NEXT_PUBLIC_GISCUS_INPUT_POSITION ?? 'top',
	theme: process.env.NEXT_PUBLIC_GISCUS_THEME ?? 'preferred_color_scheme',
	lang: process.env.NEXT_PUBLIC_GISCUS_LANG ?? 'en',
	loading: process.env.NEXT_PUBLIC_GISCUS_LOADING ?? 'lazy',
};

