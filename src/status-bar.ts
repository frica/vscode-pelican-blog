import * as vscode from 'vscode';
import { FrontmatterParser } from './frontmatter';

export class StatusBarProvider {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this.statusBarItem.command = 'pelican-blog.toggleDraft';
    this.statusBarItem.tooltip = 'Click to toggle draft status';
  }

  /**
   * Update status bar with current post status
   */
  updateStatus(filePath: string): void {
    if (!FrontmatterParser.isPelicanPost(filePath)) {
      this.statusBarItem.hide();
      return;
    }

    const status = FrontmatterParser.getPostStatus(filePath);
    const icon = status === 'draft' ? '$(edit)' : '$(check)';
    const text = status === 'draft' ? 'Draft' : 'Published';
    
    this.statusBarItem.text = `${icon} ${text}`;
    this.statusBarItem.show();
  }

  /**
   * Hide status bar item
   */
  hide(): void {
    this.statusBarItem.hide();
  }

  /**
   * Dispose of the status bar item
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
