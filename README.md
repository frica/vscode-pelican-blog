# Pelican Blog Extension

A VS Code extension for managing your Pelican blog posts, making it easier to write, publish, and manage your blog content with some useful workflow features.

> [!WARNING]  
> The extension is in a very early stage. I'm working on it for my own needs and currently it's tied to my blog structure. The templates are for example specific for my usage, at the moment.

## Features implemented

- :white_check_mark: **Draft Management**: Toggle draft status of your posts
- :white_check_mark: **Post Templates**: Create new posts from pre-built templates (Articles, Notes, Books Reviews)
- :white_check_mark: **Preview Integration**: Start/stop Pelican development server and open preview in browser (with auto-reload)
- :white_check_mark: **Snippet Insertion**: Quick insertion of common Markdown elements

## Features WIP

- **One-click Publish**: Quickly publish your blog posts with Git integration and GitHub Actions
- **Build Status Monitoring**: Check GitHub Actions build status directly from VS Code

## Installation

1. Clone this repository
2. Open in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to compile and run the extension in a new Extension Development Host window

## Configuration (WIP)

Before using the extension, configure the following settings in VS Code:

1. Open Settings (Ctrl+,)
2. Search for "Pelican Blog"
3. Configure:
   - **GitHub Token**: Personal access token for GitHub API
   - **GitHub Owner**: Repository owner username
   - **GitHub Repo**: Repository name
   - **Workflow ID**: GitHub Actions workflow ID
   - **Commit Message Template**: Template for commit messages (use {title} for post title)

## Usage

### Core Commands

- `Pelican Blog: Publish Post` - Publish the current post with Git and GitHub Actions
- `Pelican Blog: Toggle Draft Status` - Toggle between draft and published status

### Enhanced Commands

- `Pelican Blog: Create New Post` - Create a new post from templates (see Custom Templates below)
- `Pelican Blog: Start Preview Server` - Start Pelican development server
- `Pelican Blog: Stop Preview Server` - Stop the development server
- `Pelican Blog: Open Preview` - Open blog preview in browser
- `Pelican Blog: Restart Preview Server` - Restart the development server
- `Pelican Blog: Check Build Status` - Check GitHub Actions build status
- `Pelican Blog: Insert Snippet` - Insert common Markdown snippets

## Custom Post Templates

You can define your own post templates by adding Markdown files to a folder named `templates` at the root of your blog workspace (next to `package.json`).

- Each `.md` file in the `templates` folder becomes a selectable template in the "Create New Post" command.
- The template name shown in the picker is based on the filename (without extension), with dashes (`-`) shown as spaces.
- Optionally, you can add a description to the top of your template file using an HTML comment:

   ```markdown
   <!-- desc: My custom template description -->
   Title: {title}
   Date: {date}
   Status: draft
   Category: Custom
   Summary:

   # {title}
   ...
   ```

- You can use placeholders like `{title}`, `{date}`, `{slug}`, `{description}` in your template content. These will be replaced when creating a new post.
- User templates override built-in templates if they have the same name.

**Example:**

If you add a file `my-note-template.md` to the `templates` folder, it will appear as "My note template" in the template picker.

### Context Menu

Right-click on any Markdown file to access Pelican Blog commands from the context menu.

### Status Bar

The status bar shows the current post status (Draft/Published) and can be clicked to toggle status.

## Development

### Setup

1. Install dependencies: `npm install`
2. Compile TypeScript: `npm run compile`
3. Run tests: `npm test`
4. Start development: `npm run watch`

## Requirements

- VS Code **1.74.0**
- Node.js (for development)
- TypeScript (for development)

## License

MIT
