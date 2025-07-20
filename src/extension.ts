import * as vscode from 'vscode';
import { FrontmatterParser } from './frontmatter';
import { GitHelper } from './git-helper';
import { StatusBarProvider } from './status-bar';
import { ConfigManager } from './config';
import { TemplateManager } from './templates';
import { PreviewServerManager } from './preview-server';

export function activate(context: vscode.ExtensionContext) {
  const statusBarProvider = new StatusBarProvider();
  const previewServer = PreviewServerManager.getInstance();

  // Listen to active editor changes to update status bar
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor && editor.document) {
      statusBarProvider.updateStatus(editor.document.fileName);
    } else {
      statusBarProvider.hide();
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument(event => {
    if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
      statusBarProvider.updateStatus(event.document.fileName);
    }
  }, null, context.subscriptions);

  // Command: Publish Post
  let publishCommand = vscode.commands.registerCommand('pelican-blog.publish', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document) {
      vscode.window.showErrorMessage('No active markdown file.');
      return;
    }
    
    if (!ConfigManager.isConfigured()) {
      vscode.window.showErrorMessage('GitHub configuration is incomplete.');
      return;
    }

    const filePath = editor.document.fileName;
    if (!FrontmatterParser.isPelicanPost(filePath)) {
      vscode.window.showErrorMessage('This is not a Pelican post.');
      return;
    }

    const gitHelper = new GitHelper(ConfigManager.getGitHubToken()!);
    const postTitle = FrontmatterParser.parseFile(filePath).data.title || 'Untitled Post';
    const messageTemplate = ConfigManager.getCommitMessageTemplate();
    const commitMessage = messageTemplate.replace('{title}', postTitle);
    await gitHelper.commitAndPushChanges(commitMessage);
    await gitHelper.triggerGitHubActions(
      ConfigManager.getGitHubRepo()!,
      ConfigManager.getGitHubOwner()!,
      ConfigManager.getWorkflowId()!
    );
    vscode.window.showInformationMessage('Post published and GitHub Actions triggered!');
  });

  // Command: Toggle Draft
  let toggleDraftCommand = vscode.commands.registerCommand('pelican-blog.toggleDraft', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document) {
      vscode.window.showErrorMessage('No active markdown file.');
      return;
    }

    const filePath = editor.document.fileName;
    if (!FrontmatterParser.isPelicanPost(filePath)) {
      vscode.window.showErrorMessage('This is not a Pelican post.');
      return;
    }

    const newStatus = FrontmatterParser.toggleDraftStatus(filePath);
    vscode.window.showInformationMessage(`Post status set to ${newStatus}.`);
    statusBarProvider.updateStatus(filePath);
  });


  // Command: Create New Post
  let createPostCommand = vscode.commands.registerCommand('pelican-blog.createPost', async () => {
    await TemplateManager.createNewPost();
  });


  // Command: Start Preview Server
  let startServerCommand = vscode.commands.registerCommand('pelican-blog.startServer', async () => {
    await previewServer.startServer();
  });

  // Command: Stop Preview Server
  let stopServerCommand = vscode.commands.registerCommand('pelican-blog.stopServer', () => {
    previewServer.stopServer();
  });

  // Command: Open Preview
  let openPreviewCommand = vscode.commands.registerCommand('pelican-blog.openPreview', async () => {
    await previewServer.openPreview();
  });

  // Command: Restart Preview Server
  let restartServerCommand = vscode.commands.registerCommand('pelican-blog.restartServer', async () => {
    await previewServer.restartServer();
  });

  // Command: Check Build Status
  let checkBuildStatusCommand = vscode.commands.registerCommand('pelican-blog.checkBuildStatus', async () => {
    if (!ConfigManager.isConfigured()) {
      vscode.window.showErrorMessage('GitHub configuration is incomplete.');
      return;
    }

    const gitHelper = new GitHelper(ConfigManager.getGitHubToken()!);
    const buildStatus = await gitHelper.getLatestBuildStatus(
      ConfigManager.getGitHubRepo()!,
      ConfigManager.getGitHubOwner()!,
      ConfigManager.getWorkflowId()!
    );

    if (buildStatus) {
      const statusMessage = `Build Status: ${buildStatus.status}\nConclusion: ${buildStatus.conclusion}\nUpdated: ${buildStatus.updated_at}`;
      vscode.window.showInformationMessage(statusMessage, 'Open in GitHub').then(selection => {
        if (selection === 'Open in GitHub') {
          vscode.env.openExternal(vscode.Uri.parse(buildStatus.html_url));
        }
      });
    } else {
      vscode.window.showInformationMessage('No build status available.');
    }
  });

  // Command: Insert Snippet
  let insertSnippetCommand = vscode.commands.registerCommand('pelican-blog.insertSnippet', async () => {
    const snippetOptions = [
      { label: 'Code Block', value: 'code-block' },
      { label: 'Image', value: 'image' },
      { label: 'Link', value: 'link' },
      { label: 'Internal Post Link', value: 'internal-link' },
      { label: 'Quote', value: 'quote' },
      { label: 'Table', value: 'table' }
    ];

    const selectedSnippet = await vscode.window.showQuickPick(snippetOptions, {
      placeHolder: 'Select a snippet to insert'
    });

    if (selectedSnippet) {
      await TemplateManager.insertSnippet(selectedSnippet.value);
    }
  });

  context.subscriptions.push(publishCommand);
  context.subscriptions.push(toggleDraftCommand);
  context.subscriptions.push(createPostCommand);
  context.subscriptions.push(startServerCommand);
  context.subscriptions.push(stopServerCommand);
  context.subscriptions.push(openPreviewCommand);
  context.subscriptions.push(restartServerCommand);
  context.subscriptions.push(checkBuildStatusCommand);
  context.subscriptions.push(insertSnippetCommand);
}

export function deactivate() {}

