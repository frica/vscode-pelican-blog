import * as vscode from 'vscode';

export class ConfigManager {
  private static readonly CONFIG_KEY = 'pelicanBlog';

  /**
   * Get GitHub token from configuration
   */
  static getGitHubToken(): string | undefined {
    const config = vscode.workspace.getConfiguration(this.CONFIG_KEY);
    return config.get('githubToken');
  }

  /**
   * Get GitHub repository owner
   */
  static getGitHubOwner(): string | undefined {
    const config = vscode.workspace.getConfiguration(this.CONFIG_KEY);
    return config.get('githubOwner');
  }

  /**
   * Get GitHub repository name
   */
  static getGitHubRepo(): string | undefined {
    const config = vscode.workspace.getConfiguration(this.CONFIG_KEY);
    return config.get('githubRepo');
  }

  /**
   * Get GitHub workflow ID
   */
  static getWorkflowId(): string | undefined {
    const config = vscode.workspace.getConfiguration(this.CONFIG_KEY);
    return config.get('workflowId');
  }

  /**
   * Get default commit message template
   */
  static getCommitMessageTemplate(): string {
    const config = vscode.workspace.getConfiguration(this.CONFIG_KEY);
    return config.get('commitMessageTemplate', 'add blog post: {title}');
  }

  /**
   * Check if all required configuration is present
   */
  static isConfigured(): boolean {
    return !!(
      this.getGitHubToken() &&
      this.getGitHubOwner() &&
      this.getGitHubRepo() &&
      this.getWorkflowId()
    );
  }
}
