import * as core from '@actions/core';
import * as github from '@actions/github';

type NoPromise<T> = T extends Promise<infer U> ? U : T;
type Octokit = ReturnType<typeof github.getOctokit>;
type CommitComments = NoPromise<
  ReturnType<Octokit['rest']['repos']['listCommentsForCommit']>
>['data'];
type IssueComments = NoPromise<
  ReturnType<Octokit['rest']['issues']['listComments']>
>['data'];

class GitHubClient {
  private client: Octokit;

  constructor() {
    const token = core.getInput('github-token', { required: true });

    this.client = github.getOctokit(token);
  }

  public async listCommitComments(): Promise<CommitComments> {
    core.info(`Fetching comments for commit '${github.context.sha}'`);

    const response = await this.client.rest.repos.listCommentsForCommit({
      ...github.context.repo,
      commit_sha: github.context.sha,
    });

    return response.data;
  }

  public async createCommitComment(body: string): Promise<void> {
    core.info(`Creating comment on commit '${github.context.sha}'`);

    await this.client.rest.repos.createCommitComment({
      ...github.context.repo,
      commit_sha: github.context.sha,
      body,
    });
  }

  public async updateCommitComment(
    commentId: number,
    body: string
  ): Promise<void> {
    core.info(`Updating comment on commit '${github.context.sha}'`);

    await this.client.rest.repos.updateCommitComment({
      ...github.context.repo,
      comment_id: commentId,
      body,
    });
  }

  public async listIssueComments(): Promise<IssueComments> {
    core.info(`Fetching comments for issue '${github.context.issue.number}'`);

    const response = await this.client.rest.issues.listComments({
      ...github.context.repo,
      issue_number: github.context.issue.number,
    });

    return response.data;
  }

  public async createIssueComment(body: string): Promise<void> {
    core.info(`Creating comment on issue '${github.context.issue.number}'`);

    await this.client.rest.issues.createComment({
      ...github.context.repo,
      issue_number: github.context.issue.number,
      body,
    });
  }

  public async updateIssueComment(
    commentId: number,
    body: string
  ): Promise<void> {
    core.info(`Updating comment on issue '${github.context.issue.number}'`);

    await this.client.rest.issues.updateComment({
      ...github.context.repo,
      comment_id: commentId,
      body,
    });
  }
}

export default GitHubClient;
