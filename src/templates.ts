import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FrontmatterParser } from './frontmatter';

export interface PostTemplate {
  name: string;
  description: string;
  content: string;
}

export class TemplateManager {
  private static readonly DEFAULT_TEMPLATES: PostTemplate[] = [
    {
      name: 'Basic Post',
      description: 'A basic blog post template',
      content: `Title: "{title}"
Date: {date}
Slug: {slug}
Status: draft
Tags: 
Category: Articles
Summary: ""
---

# {title}

Write your blog post content here...

## Heading
`
    },
    {
      name: 'Notes Post',
      description: 'Template for Notes posts',
      content: `Title: "{title}"
Date: {date}
Slug: {slug}
Status: draft
Category: Notes
summary: "Semaine du au"

# {title}

## Prerequisites
`
    },
    {
      name: 'Book review Post',
      description: 'Template for book review',
      content: `Title: "{title}"
Date: {date}
Slug: {slug}
Status: draft
Tags:
Category: Books
Summary:

# {title}

## Overview

## Conclusion

**Overall Rating:** ⭐⭐⭐⭐⭐ (X/5)
`
    }
  ];

  /**
   * Create a new post from template
   */
  static async createNewPost(): Promise<void> {
    // Select template
    const templateItems = this.DEFAULT_TEMPLATES.map(template => ({
      label: template.name,
      description: template.description,
      template: template
    }));

    const selectedTemplate = await vscode.window.showQuickPick(templateItems, {
      placeHolder: 'Select a post template'
    });

    if (!selectedTemplate) {
      return;
    }

    // Get post details
    const title = await vscode.window.showInputBox({
      prompt: 'Enter post title',
      placeHolder: 'My Awesome Blog Post'
    });

    if (!title) {
      return;
    }

    const slug = await vscode.window.showInputBox({
      prompt: 'Enter post slug (optional)',
      placeHolder: 'my-awesome-blog-post',
      value: this.titleToSlug(title)
    });

    if (!slug) {
      return;
    }

    // Get file location
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    // Determine category subdirectory based on template content
    const category = this.extractCategoryFromTemplate(selectedTemplate.template.content);
    const categoryDir = this.getCategoryDirectory(category);
    
    // Create the category directory path
    const contentDir = path.join(workspaceFolder.uri.fsPath, 'content', categoryDir);
    
    // Ensure the directory exists
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    const fileName = `${slug}.md`;
    const filePath = path.join(contentDir, fileName);

    // Create content from template
    const currentDate = new Date().toISOString().split('T')[0];
    let content = selectedTemplate.template.content;
    
    content = content.replace(/{title}/g, title);
    content = content.replace(/{date}/g, currentDate);
    content = content.replace(/{slug}/g, slug);
    content = content.replace(/{description}/g, title.toLowerCase());
    content = content.replace(/{product}/g, title);

    // Write file
    fs.writeFileSync(filePath, content);

    // Open the new file
    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage(`New post created: ${categoryDir}/${fileName}`);
  }

  private static extractCategoryFromTemplate(content: string): string {
    const match = content.match(/Category: (\w+)/);
    return match ? match[1] : 'Other';
  }

  private static getCategoryDirectory(category: string): string {
    switch (category) {
      case 'Articles':
        return 'articles';
      case 'Notes':
        return 'notes';
      case 'Books':
        return 'books';
      default:
        return 'other';
    }
  }

  /**
   * Convert title to slug
   */
  private static titleToSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Insert snippet at cursor position
   */
  static async insertSnippet(snippetName: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const snippets = {
      'code-block': '```\\n${1:language}\\n${2:code}\\n```\\n',
      'image': '![${1:alt text}](${2:image-url})\\n',
      'link': '[${1:link text}](${2:url})\\n',
      'quote': '> ${1:quote}\\n',
      'table': '| ${1:Header 1} | ${2:Header 2} |\\n|-------------|-------------|\\n| ${3:Cell 1}  | ${4:Cell 2}  |\\n'
    };

    const snippet = snippets[snippetName as keyof typeof snippets];
    if (snippet) {
      await editor.insertSnippet(new vscode.SnippetString(snippet));
    }
  }
}
