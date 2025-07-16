import * as matter from 'gray-matter';
import * as fs from 'fs';

export interface PostFrontmatter {
  title?: string;
  date?: string;
  slug?: string;
  status?: 'draft' | 'published';
  tags?: string[];
  category?: string;
  summary?: string;
  [key: string]: any;
}

export class FrontmatterParser {
  
  /**
   * Parse frontmatter from a markdown file
   */
  static parseFile(filePath: string): { data: PostFrontmatter; content: string } {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(fileContent);
    
    return {
      data: parsed.data as PostFrontmatter,
      content: parsed.content
    };
  }

  /**
   * Update frontmatter in a markdown file
   */
  static updateFile(filePath: string, newData: Partial<PostFrontmatter>): void {
    const { data, content } = this.parseFile(filePath);
    const updatedData = { ...data, ...newData };
    
    const updatedContent = matter.stringify(content, updatedData);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
  }

  /**
   * Toggle draft status of a post
   */
  static toggleDraftStatus(filePath: string): string {
    const { data } = this.parseFile(filePath);
    const currentStatus = data.status || 'draft';
    const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
    
    this.updateFile(filePath, { status: newStatus });
    return newStatus;
  }


  /**
   * Get post status from frontmatter
   */
  static getPostStatus(filePath: string): string {
    const { data } = this.parseFile(filePath);
    return data.status || 'draft';
  }

  /**
   * Check if file is a Pelican post (has frontmatter)
   */
  static isPelicanPost(filePath: string): boolean {
    try {
      const { data } = this.parseFile(filePath);
      return Object.keys(data).length > 0;
    } catch (error) {
      return false;
    }
  }
}
