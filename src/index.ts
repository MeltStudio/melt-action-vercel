import * as core from '@actions/core';

import { validateEvent } from './github';
import Vercel from './vercel';

async function run(): Promise<void> {
  try {
    validateEvent();

    const vercel = new Vercel();

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

    // TODO: add github comment
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
