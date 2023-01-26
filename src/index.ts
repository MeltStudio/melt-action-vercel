import * as core from '@actions/core';

import GitHub from './github';
import Vercel from './vercel';

async function run(): Promise<void> {
  try {
    const github = new GitHub();
    const vercel = new Vercel(github.getRefName());

    core.startGroup('Pulling Vercel environment');
    await vercel.pull();
    core.endGroup();

    core.startGroup('Building application');
    await vercel.build();
    core.endGroup();

    core.startGroup('Deploying to Vercel');
    const { stdout: vercelDeploymentUrl } = await vercel.deploy();
    core.setOutput('deployment-url', vercelDeploymentUrl);
    core.endGroup();

    if (vercelDeploymentUrl && vercel.env === 'preview') {
      core.startGroup('Setting Vercel deployment alias');
      const refNameAlias = await vercel.calculateRefNameAlias();
      await vercel.alias(vercelDeploymentUrl, refNameAlias);
      core.setOutput('preview-alias-url', refNameAlias);
      core.endGroup();
    }

    core.startGroup('Creating GitHub comment');
    const body = await vercel.buildCommentBody(vercelDeploymentUrl);
    await github.comment(body);
    core.endGroup();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run().catch((error) => {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
});
