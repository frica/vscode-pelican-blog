import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

export class PreviewServerManager {
  private static instance: PreviewServerManager;
  private pelicanProcess: ChildProcess | null = null;
  private isRunning = false;
  private readonly defaultPort = 8000;

  private constructor() {}

  static getInstance(): PreviewServerManager {
    if (!PreviewServerManager.instance) {
      PreviewServerManager.instance = new PreviewServerManager();
    }
    return PreviewServerManager.instance;
  }

  /**
   * Start the Pelican development server
   */
  async startServer(): Promise<void> {
    if (this.isRunning) {
      vscode.window.showInformationMessage('Pelican server is already running.');
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found.');
      return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;
    
    try {
      // First, try to generate the site
      await this.generateSite(workspacePath);
      
      // Then start the development server
      this.pelicanProcess = spawn('pelican', ['--listen', '--autoreload'], {
        cwd: workspacePath,
        stdio: 'pipe'
      });

      this.pelicanProcess.on('spawn', () => {
        this.isRunning = true;
        vscode.window.showInformationMessage(`Pelican server started on http://localhost:${this.defaultPort}`);
      });

      this.pelicanProcess.on('error', (error) => {
        vscode.window.showErrorMessage(`Failed to start Pelican server: ${error.message}`);
        this.isRunning = false;
      });

      this.pelicanProcess.on('exit', (code) => {
        this.isRunning = false;
        if (code !== 0) {
          vscode.window.showErrorMessage(`Pelican server exited with code ${code}`);
        } else {
          vscode.window.showInformationMessage('Pelican server stopped.');
        }
      });

      // Handle output
      this.pelicanProcess.stdout?.on('data', (data) => {
        console.log(`Pelican stdout: ${data}`);
      });

      this.pelicanProcess.stderr?.on('data', (data) => {
        console.error(`Pelican stderr: ${data}`);
      });

    } catch (error) {
      vscode.window.showErrorMessage(`Error starting Pelican server: ${error}`);
    }
  }

  /**
   * Stop the Pelican development server
   */
  stopServer(): void {
    if (this.pelicanProcess && this.isRunning) {
      this.pelicanProcess.kill();
      this.pelicanProcess = null;
      this.isRunning = false;
      vscode.window.showInformationMessage('Pelican server stopped.');
    } else {
      vscode.window.showInformationMessage('Pelican server is not running.');
    }
  }

  /**
   * Generate the Pelican site
   */
  private async generateSite(workspacePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const generateProcess = spawn('pelican', ['content'], {
        cwd: workspacePath,
        stdio: 'pipe'
      });

      generateProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Pelican generate failed with code ${code}`));
        }
      });

      generateProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Open preview in browser
   */
  async openPreview(): Promise<void> {
    if (!this.isRunning) {
      await this.startServer();
      // Wait a bit for server to start
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const url = `http://localhost:${this.defaultPort}`;
    await vscode.env.openExternal(vscode.Uri.parse(url));
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Restart the server
   */
  async restartServer(): Promise<void> {
    this.stopServer();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.startServer();
  }

  /**
   * Get server status
   */
  getServerStatus(): string {
    return this.isRunning ? 
      `Running on http://localhost:${this.defaultPort}` : 
      'Stopped';
  }
}
