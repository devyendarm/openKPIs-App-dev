/**
 * GitHub Service
 * Handles GitHub API operations for syncing content
 */

import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

// Note: Content PRs go to GITHUB_CONTENT_REPO_NAME repository (not the app repo)
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'devyendarm';
const GITHUB_CONTENT_REPO = process.env.GITHUB_CONTENT_REPO_NAME || process.env.GITHUB_CONTENT_REPO || 'openKPIs-Content';

interface EntityRecord {
  id?: string;
  slug?: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[] | string;
  status?: string;
  created_by?: string;
  created_at?: string;
  formula?: string;
}

export interface GitHubSyncParams {
  tableName: 'kpis' | 'events' | 'dimensions' | 'metrics' | 'dashboards';
  record: EntityRecord;
  action: 'created' | 'edited';
  userLogin: string;
  userName?: string;
  userEmail?: string;
  contributorName?: string; // Original contributor (created_by)
  editorName?: string | null; // Editor who made the edit (last_modified_by)
}

export async function syncToGitHub(params: GitHubSyncParams): Promise<{
  success: boolean;
  commit_sha?: string;
  pr_number?: number;
  pr_url?: string;
  branch?: string;
  file_path?: string;
  error?: string;
}> {
  try {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = resolvePrivateKey();
    const installationIdStr = process.env.GITHUB_INSTALLATION_ID;

    if (!appId || !privateKey || !installationIdStr) {
      throw new Error('GitHub credentials not configured (check GITHUB_APP_ID, GITHUB_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY_B64)');
    }

    const installationId = parseInt(installationIdStr, 10);

    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: Number(appId),
        privateKey,
        installationId,
      },
    });

    const yamlContent = generateYAML(params.tableName, params.record);
    const fileName = `${params.record.slug || params.record.name || params.record.id}.yml`;
    const filePath = `data-layer/${params.tableName}/${fileName}`;
    const branchName = `${params.action}-${params.tableName}-${params.record.slug}-${Date.now()}`;

    // Get main branch
    const { data: mainRef } = await octokit.git.getRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      ref: 'heads/main',
    });

    // Create branch
    await octokit.git.createRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      ref: `refs/heads/${branchName}`,
      sha: mainRef.object.sha,
    });

    // Check if file exists
    let existingFileSha: string | undefined;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_CONTENT_REPO,
        path: filePath,
        ref: branchName,
      });
      if (existingFile && typeof existingFile === 'object' && 'sha' in existingFile) {
        existingFileSha = existingFile.sha as string;
      }
    } catch {
      // File doesn't exist – continue
    }

    // Create/update file
    const { data: commitData } = await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      path: filePath,
      message: params.action === 'created'
        ? `Add ${params.tableName.slice(0, -1)}: ${params.record.name}`
        : `Update ${params.tableName.slice(0, -1)}: ${params.record.name}`,
      content: Buffer.from(yamlContent).toString('base64'),
      branch: branchName,
      sha: existingFileSha,
      committer: {
        name: 'OpenKPIs Bot',
        email: 'bot@openkpis.org',
      },
      author: {
        name: params.userName || params.userLogin,
        email: params.userEmail || `${params.userLogin}@users.noreply.github.com`,
      },
    });

    // Build PR body with contributor and editor information
    let prBody = `**Contributed by**: @${params.contributorName || params.userLogin}\n`;
    if (params.action === 'edited' && params.editorName && params.editorName !== params.contributorName) {
      prBody += `**Edited by**: @${params.editorName}\n`;
    }
    prBody += `\n**Action**: ${params.action}\n**Type**: ${params.tableName}\n\n---\n\n${params.record.description || 'No description provided.'}`;

    // Create PR
    const { data: prData } = await octokit.pulls.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      title: params.action === 'created'
        ? `Add ${params.tableName.slice(0, -1)}: ${params.record.name}`
        : `Update ${params.tableName.slice(0, -1)}: ${params.record.name}`,
      head: branchName,
      base: 'main',
      body: prBody,
      maintainer_can_modify: true,
    });

    return {
      success: true,
      commit_sha: commitData.commit.sha,
      pr_number: prData.number,
      pr_url: prData.html_url,
      branch: branchName,
      file_path: filePath,
    };
  } catch (error: unknown) {
    console.error('GitHub sync error:', error);
    const err = error as { message?: string };
    return {
      success: false,
      error: err.message || 'Failed to sync to GitHub',
    };
  }
}

function resolvePrivateKey(): string | undefined {
  // Use GITHUB_APP_PRIVATE_KEY_B64 from environment
  const b64Key = process.env.GITHUB_APP_PRIVATE_KEY_B64;

  if (b64Key) {
    try {
      const key = Buffer.from(b64Key.trim(), 'base64').toString('utf8');
      if (key.includes('BEGIN') && key.includes('END')) {
        return key.replace(/\r\n/g, '\n');
      }
    } catch {
      // ignore decode errors
    }
  }

  return undefined;
}

function generateYAML(tableName: string, record: EntityRecord): string {
  const timestamp = new Date().toISOString();
  
  if (tableName === 'kpis') {
    return `# KPI: ${record.name}
# Generated: ${timestamp}
# Contributed by: ${record.created_by}

KPI Name: ${record.name}
${record.formula ? `Formula: ${record.formula}` : ''}
${record.description ? `Description: |\n  ${record.description.split('\n').join('\n  ')}` : ''}
${record.category ? `Category: ${record.category}` : ''}
${record.tags && Array.isArray(record.tags) && record.tags.length > 0 ? `Tags: [${record.tags.join(', ')}]` : ''}
Status: ${record.status}
Contributed By: ${record.created_by}
Created At: ${record.created_at}
`;
  }
  
  if (tableName === 'events') {
    return `# Event: ${record.name}
# Generated: ${timestamp}
# Contributed by: ${record.created_by}

Event Name: ${record.name}
${record.description ? `Description: |\n  ${record.description.split('\n').join('\n  ')}` : ''}
${record.category ? `Category: ${record.category}` : ''}
${record.tags && Array.isArray(record.tags) && record.tags.length > 0 ? `Tags: [${record.tags.join(', ')}]` : ''}
Status: ${record.status}
Contributed By: ${record.created_by}
Created At: ${record.created_at}
`;
  }

  if (tableName === 'dimensions') {
    return `# Dimension: ${record.name}
# Generated: ${timestamp}
# Contributed by: ${record.created_by}

Dimension Name: ${record.name}
${record.description ? `Description: |\n  ${record.description.split('\n').join('\n  ')}` : ''}
${record.category ? `Category: ${record.category}` : ''}
${record.tags && Array.isArray(record.tags) && record.tags.length > 0 ? `Tags: [${record.tags.join(', ')}]` : ''}
Status: ${record.status}
Contributed By: ${record.created_by}
Created At: ${record.created_at}
`;
  }

  if (tableName === 'metrics') {
    return `# Metric: ${record.name}
# Generated: ${timestamp}
# Contributed by: ${record.created_by}

Metric Name: ${record.name}
${record.formula ? `Formula: ${record.formula}` : ''}
${record.description ? `Description: |\n  ${record.description.split('\n').join('\n  ')}` : ''}
${record.category ? `Category: ${record.category}` : ''}
${record.tags && Array.isArray(record.tags) && record.tags.length > 0 ? `Tags: [${record.tags.join(', ')}]` : ''}
Status: ${record.status}
Contributed By: ${record.created_by}
Created At: ${record.created_at}
`;
  }

  if (tableName === 'dashboards') {
    return `# Dashboard: ${record.name}
# Generated: ${timestamp}
# Contributed by: ${record.created_by}

Dashboard Name: ${record.name}
${record.description ? `Description: |\n  ${record.description.split('\n').join('\n  ')}` : ''}
${record.category ? `Category: ${record.category}` : ''}
${record.tags && Array.isArray(record.tags) && record.tags.length > 0 ? `Tags: [${record.tags.join(', ')}]` : ''}
Status: ${record.status}
Contributed By: ${record.created_by}
Created At: ${record.created_at}
`;
  }

  return '';
}

