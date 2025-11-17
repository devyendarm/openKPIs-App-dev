import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    project: process.env.VERCEL_PROJECT_PRODUCTION_URL || null,
    env: process.env.VERCEL_ENV || null,
    git: {
      repo: process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
        ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
        : null,
      branch: process.env.VERCEL_GIT_COMMIT_REF || null,
      sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      message: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
    },
    build: {
      createdAt: process.env.VERCEL_BUILD_CREATED_AT || null,
    },
    runtime: process.env.NEXT_RUNTIME || 'node',
    nodeEnv: process.env.NODE_ENV || null,
  });
}



