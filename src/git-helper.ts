import { Octokit } from "@octokit/rest";
import { simpleGit } from "simple-git";

export interface BuildStatus {
  status: 'success' | 'failure' | 'pending' | 'in_progress';
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export class GitHelper {
  private git = simpleGit();
  private octokit: Octokit;

  constructor(githubToken: string) {
    this.octokit = new Octokit({ auth: githubToken });
  }

  /**
   * Commit and push changes to the remote repository
   * @param message Commit message
   */
  async commitAndPushChanges(message: string): Promise<void> {
    await this.git.add(".");
    await this.git.commit(message);
    await this.git.push();
  }

  /**
   * Trigger GitHub actions
   */
  async triggerGitHubActions(repo: string, owner: string, workflowId: string): Promise<void> {
    await this.octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref: 'main', // or your desired branch
    });
  }

  /**
   * Get the latest workflow run status
   */
  async getLatestBuildStatus(repo: string, owner: string, workflowId: string): Promise<BuildStatus | null> {
    try {
      const { data } = await this.octokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
        per_page: 1,
        page: 1
      });

      if (data.workflow_runs.length === 0) {
        return null;
      }

      const latestRun = data.workflow_runs[0];
      return {
        status: latestRun.status as 'success' | 'failure' | 'pending' | 'in_progress',
        conclusion: latestRun.conclusion,
        html_url: latestRun.html_url,
        created_at: latestRun.created_at,
        updated_at: latestRun.updated_at
      };
    } catch (error) {
      console.error('Error fetching build status:', error);
      return null;
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(repo: string, owner: string): Promise<any> {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo
      });
      return data;
    } catch (error) {
      console.error('Error fetching repository info:', error);
      return null;
    }
  }

  /**
   * Get commit status
   */
  async getCommitStatus(repo: string, owner: string, sha: string): Promise<any> {
    try {
      const { data } = await this.octokit.repos.getCombinedStatusForRef({
        owner,
        repo,
        ref: sha
      });
      return data;
    } catch (error) {
      console.error('Error fetching commit status:', error);
      return null;
    }
  }
}
