import * as core from '@actions/core';
import type { Axios } from 'axios';
import axios from 'axios';

interface VercelTeam {
  slug: string;
}

interface VercelProject {
  name: string;
  link?: {
    productionBranch?: string;
  };
}

interface VercelDeployment {
  id: string;
  alias: string[];
  url: string;
}

interface VercelAliases {
  aliases: { alias: string }[];
}

class VercelClient {
  private client: Axios;

  constructor() {
    const token = core.getInput('vercel-token', { required: true });
    const teamId = core.getInput('vercel-team-id', { required: true });

    this.client = axios.create({
      baseURL: 'https://api.vercel.com',
      headers: { Authorization: `Bearer ${token}` },
      params: { teamId },
    });
  }

  public async team(teamId: string): Promise<VercelTeam> {
    core.info(`Fetching team '${teamId}' information from Vercel`);
    const response = await this.client.get<VercelTeam>(`/v2/teams/${teamId}`);

    return response.data;
  }

  public async project(projectId: string): Promise<VercelProject> {
    core.info(`Fetching project '${projectId}' information from Vercel`);
    const response = await this.client.get<VercelProject>(
      `/v9/projects/${projectId}`
    );

    return response.data;
  }

  public async deployment(deploymentId: string): Promise<VercelDeployment> {
    const cleanId = deploymentId.replace(/^https:\/\//, '');

    core.info(`Fetching deployment '${cleanId}' information from Vercel`);
    const response = await this.client.get<VercelDeployment>(
      `/v13/deployments/${cleanId}`
    );

    return response.data;
  }

  public async aliases(deploymentId: string): Promise<VercelAliases> {
    core.info(`Fetching deployment '${deploymentId}' aliases from Vercel`);
    const response = await this.client.get<VercelAliases>(
      `/v13/deployments/${deploymentId}/aliases`
    );

    return response.data;
  }
}

export default VercelClient;
