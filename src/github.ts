import * as core from '@actions/core';
import * as github from '@actions/github';

import GitHubClient from './github-client';

class GitHub {
  private isPullRequest: boolean;

  private isPush: boolean;

  private isRelease: boolean;

  private client: GitHubClient | null;

  constructor() {
    this.isPullRequest = github.context.eventName === 'pull_request';
    this.isPush = github.context.eventName === 'push';
    this.isRelease = github.context.eventName === 'release';
    this.client = null;

    if (!this.isPullRequest && !this.isPush && !this.isRelease) {
      throw new Error(
        `Invalid event '${github.context.eventName}', please use one or multiple of [pull_request, push, release]`
      );
    }
  }

  private getClient(): GitHubClient {
    if (this.client == null) {
      this.client = new GitHubClient();
    }

    return this.client;
  }

  public getRefName(): string {
    if (this.isPullRequest) {
      return process.env.GITHUB_HEAD_REF as string;
    }

    if (this.isPush || this.isRelease) {
      return process.env.GITHUB_REF_NAME as string;
    }

    throw new Error(
      `Could not get git ref name for event '${github.context.eventName}'`
    );
  }

  private async getEventComments(): Promise<{ id: number; body?: string }[]> {
    if (this.isPullRequest) {
      return this.getClient().listIssueComments();
    }

    if (this.isPush) {
      return this.getClient().listCommitComments();
    }

    throw new Error(
      `Unable to get comments for event '${github.context.eventName}'`
    );
  }

  private async findDeploymentComment(text: string): Promise<number | null> {
    const comments = await this.getEventComments();

    const comment = comments.find((com) => com.body?.startsWith(text));
    if (comment != null) {
      return comment.id;
    }

    return null;
  }

  public async comment(body: string): Promise<void> {
    if (!core.getBooleanInput('github-comment')) {
      core.info("Ignoring comment because 'github-comment' is false");
      return;
    }

    if (!this.isPullRequest && !this.isPush) {
      core.error(
        `Ignoring comment because '${github.context.eventName}' is not a valid event`
      );
      return;
    }

    const text = body.split('\n')[0];
    const commentId = await this.findDeploymentComment(text);

    if (this.isPullRequest) {
      if (commentId != null) {
        await this.getClient().updateIssueComment(commentId, body);
      } else {
        await this.getClient().createIssueComment(body);
      }

      return;
    }

    if (this.isPush) {
      if (commentId != null) {
        await this.getClient().updateCommitComment(commentId, body);
      } else {
        await this.getClient().createCommitComment(body);
      }
    }
  }
}

export default GitHub;
