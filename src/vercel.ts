import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as crypto from 'crypto';

import VercelClient from './vercel-client';

type EnvType = 'preview' | 'production';
interface ExecReturn {
  stdout: string;
  stderr: string;
}

class Vercel {
  public readonly env: EnvType;

  private readonly teamId: string;

  private readonly projectId: string;

  private readonly token: string;

  private readonly version: string;

  private readonly localBuild: boolean;

  private readonly client: VercelClient;

  private readonly refName: string;

  constructor(refName: string) {
    this.refName = refName;

    this.teamId = core.getInput('vercel-team-id', { required: true });
    this.projectId = core.getInput('vercel-project-id', { required: true });
    this.token = core.getInput('vercel-token', { required: true });
    this.version = core.getInput('vercel-cli-version');
    this.localBuild = core.getBooleanInput('local-build');

    const isProd = core.getBooleanInput('vercel-is-production');
    this.env = isProd ? 'production' : 'preview';

    this.client = new VercelClient();

    // set the environment variables for the Vercel CLI
    core.exportVariable('VERCEL_ORG_ID', this.teamId);
    core.exportVariable('VERCEL_PROJECT_ID', this.projectId);
  }

  private async exec(args: string[]): Promise<ExecReturn> {
    let stdout = '';
    let stderr = '';
    const options: exec.ExecOptions = {
      listeners: {
        stdout: (data) => {
          stdout += data.toString();
        },
        stderr: (data) => {
          stderr += data.toString();
        },
      },
    };

    await exec.exec(
      'npx',
      [
        `vercel@${this.version}`,
        ...args,
        `--token=${this.token}`,
        `--scope=${this.teamId}`,
      ],
      options
    );

    return { stdout, stderr };
  }

  public async pull(): Promise<ExecReturn | null> {
    if (!this.localBuild) {
      core.info('Not running pull because local build is disabled');
      return null;
    }

    const args: string[] = ['pull', '--yes', `--environment=${this.env}`];
    if (this.env === 'preview') {
      args.push(`--git-branch=${this.refName}`);
    }

    return this.exec(args);
  }

  public async build(): Promise<ExecReturn | null> {
    if (!this.localBuild) {
      core.info('Not running build because local build is disabled');
      return null;
    }

    const args: string[] = ['build'];
    if (this.env === 'production') {
      args.push('--prod');
    }

    return this.exec(args);
  }

  public async deploy(): Promise<ExecReturn> {
    const args: string[] = ['deploy'];
    if (this.localBuild) {
      args.push('--prebuilt', '--archive=tgz');
    }
    if (this.env === 'production') {
      args.push('--prod');
    }

    return this.exec(args);
  }

  public async calculateRefNameAlias(): Promise<string> {
    const team = await this.client.team(this.teamId);
    const project = await this.client.project(this.projectId);

    let refNameSlug = this.refName
      .trim()
      .toLowerCase()
      .replace(/[_./]+/g, '-')
      .replace(/--+/, '-')
      .replace(/[^\w\d-]/, '');

    // 63 is the max allowed length for aliases on vercel, so we need to know
    // what's the max length the branch slug can have. The -2 accounts for the
    // dashes used to separate the alias parts.
    // https://vercel.com/docs/concepts/deployments/generated-urls#truncation
    const maxLength = 63 - project.name.length - team.slug.length - 2;
    if (refNameSlug.length > maxLength) {
      core.info(
        'Truncating git ref name slug because it exceeds the max length'
      );

      // vercel uses a hash of 6 characters when the branch name exceeds the max
      // length
      // https://vercel.com/docs/concepts/deployments/generated-urls#truncation
      const hash = crypto
        .createHash('sha256')
        .update(refNameSlug)
        .digest('hex')
        .slice(0, 6);
      refNameSlug = `${refNameSlug.slice(0, maxLength - 7)}-${hash}`;
    }

    const alias = `${project.name}-${refNameSlug}-${team.slug}.vercel.app`;
    core.info(`Calculated alias: ${alias}`);

    return alias;
  }

  public async alias(deployUrl: string, aliasUrl: string): Promise<ExecReturn> {
    return this.exec(['alias', deployUrl, aliasUrl]);
  }

  public async buildCommentBody(deploymentId: string): Promise<string> {
    const deployment = await this.client.deployment(deploymentId);
    const aliases = await this.client.aliases(deployment.id);
    const project = await this.client.project(this.projectId);

    const alias = [deployment.url, ...aliases.aliases.map((a) => a.alias)]
      .map((a) => `<a href="https://${a}" target="_blank">${a}</a>`)
      .join('\n');

    return `:rocket: Successfully deployed '${project.name}' to the following URLs:\n\n${alias}`;
  }
}

export default Vercel;
