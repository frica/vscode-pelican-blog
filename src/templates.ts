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
  content: `Title: {title}
Date: {date}
Status: draft
Tags: 
Category: Articles
Summary: 
---

# {title}

Write your blog post content here...

## Heading
`
    }
  ];

  /**
   * Load user templates from the 'templates' folder in the workspace.
   */
  private static async loadUserTemplates(): Promise<PostTemplate[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return [];
    }
    const templatesDir = path.join(workspaceFolder.uri.fsPath, 'templates');
    if (!fs.existsSync(templatesDir)) {
      return [];
    }
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));
    const templates: PostTemplate[] = [];
    for (const file of files) {
      const filePath = path.join(templatesDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Optionally, parse first line as description if it starts with <!-- desc: ... -->
        let description = '';
        const descMatch = content.match(/^<!--\s*desc:(.*?)-->/i);
        if (descMatch) {
          description = descMatch[1].trim();
        }
        templates.push({
          name: path.basename(file, '.md'),
          description: description || 'User template',
          content
        });
      } catch (e) {
      }
    }
    vscode.window.showInformationMessage(`Total user templates loaded: ${templates.length}`);
    return templates;
  }

  /**
   * Get all templates, with user templates taking precedence by name.
   */
  private static async getAllTemplates(): Promise<PostTemplate[]> {
    const userTemplates = await this.loadUserTemplates();
    const userTemplateNames = new Set(userTemplates.map(t => t.name));
    // Filter out default templates that are overridden by user templates
    const filteredDefaults = this.DEFAULT_TEMPLATES.filter(t => !userTemplateNames.has(t.name));
    return [...userTemplates, ...filteredDefaults];
  }

  /**
   * Create a new post from template
   */
  static async createNewPost(): Promise<void> {

    // Load templates (user + default)
    const templates = await this.getAllTemplates();
    if (templates.length === 0) {
      vscode.window.showErrorMessage('No templates found. Add templates to the templates folder or use built-in defaults.');
      return;
    }

    // Select template, show dashes as spaces and capitalize first letter in the label
    const templateItems = templates.map(template => {
      const label = template.name.replace(/-/g, ' ');
      const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
      return {
        label: capitalized,
        description: template.description,
        template: template
      };
    });

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
      case 'Misc':
        return 'articles';
      default:
        return 'articles';
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

    // Code block snippet
    const CODE_BLOCK_SNIPPET = `\t:::$\{1:language}
    $\{2:code}`;

    // Image snippet
    const IMAGE_SNIPPET = `![\${1:alt text}](\${2:image-url})`;

    // Link snippet
    const LINK_SNIPPET = `[$\{1:link text}]($\{2:url})`;

    // Internal link snippet
    const INTERNAL_LINK_SNIPPET = `[$\{1:link text}]({filename}/$\{2:location}/$\{3:filename.md})`;

    // Quote snippet
    const QUOTE_SNIPPET = `> $\{1:quote}`;

    // Table snippet
    const TABLE_SNIPPET = `| $\{1:Header 1} | $\{2:Header 2} |
|-------------|-------------|
| $\{3:Cell 1}  | $\{4:Cell 2}  |`;

    const snippets = {
      'code-block': CODE_BLOCK_SNIPPET,
      'image': IMAGE_SNIPPET,
      'link': LINK_SNIPPET,
      'internal-link': INTERNAL_LINK_SNIPPET,
      'quote': QUOTE_SNIPPET,
      'table': TABLE_SNIPPET
    };

    const snippet = snippets[snippetName as keyof typeof snippets];
    if (snippet) {
      await editor.insertSnippet(new vscode.SnippetString(snippet));
    }
  }
}
