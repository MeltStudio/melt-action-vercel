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

class VercelClient {
  private client: Axios;

  constructor() {
    const token = core.getInput('vercel-token', { required: true });
    const scope = core.getInput('vercel-scope', { required: true });

    this.client = axios.create({
      baseURL: 'https://api.vercel.com/v9',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        teamId: scope,
      },
    });
  }

  public async team(teamId: string): Promise<VercelTeam> {
    const response = await this.client.get<VercelTeam>(`/v2/teams/${teamId}`);

    return response.data;
  }

  public async project(projectId: string): Promise<VercelProject> {
    const response = await this.client.get<VercelProject>(
      `/v9/projects/${projectId}`
    );

    return response.data;
  }
}

export default VercelClient;
