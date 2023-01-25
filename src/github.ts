import * as github from '@actions/github';

function isPullRequest(): boolean {
  return github.context.eventName === 'pull_request';
}

function isPush(): boolean {
  return github.context.eventName === 'push';
}

function isRelease(): boolean {
  return github.context.eventName === 'release';
}

export function validateEvent(): void {
  if (isPullRequest() || isPush() || isRelease()) {
    return;
  }

  throw new Error(
    `Invalid event '${github.context.eventName}', please use one or multiple of [pull_request, push, release]`
  );
}

export function getRefName(): string {
  if (isPullRequest()) {
    return process.env.GITHUB_HEAD_REF as string;
  }

  if (isPush() || isRelease()) {
    return process.env.GITHUB_REF_NAME as string;
  }

  throw new Error(
    `Could not get git ref name for event '${github.context.eventName}'`
  );
}
