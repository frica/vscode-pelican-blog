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
   * Parse Pelican metadata from a markdown file
   */
  static parseFile(filePath: string): { data: PostFrontmatter; content: string } {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    const metadata: PostFrontmatter = {};
    let contentStart = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Stop at the first blank line (content separator)
      if (line.trim() === '') {
        contentStart = i + 1;
        break;
      }
      
      // Parse metadata lines (Key: Value format)
      const match = line.match(/^([A-Za-z]+):\s*(.*)$/);
      if (match) {
        const key = match[1].toLowerCase();
        let value = match[2].trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Handle special cases
        if (key === 'tags' && value) {
          metadata[key] = value.split(',').map(tag => tag.trim());
        } else if (value) {
          metadata[key] = value;
        }
      } else if (line.trim() && Object.keys(metadata).length === 0) {
        // If we haven't found any metadata and hit a non-empty line, this might not be Pelican format
        break;
      }
    }
    
    const remainingContent = lines.slice(contentStart).join('\n');
    return { data: metadata, content: remainingContent };
  }

  /**
   * Update frontmatter in a markdown file
   */
  static updateFile(filePath: string, newData: Partial<PostFrontmatter>): void {
    const { data, content } = this.parseFile(filePath);
    const updatedData = { ...data, ...newData };
    
    // Build Pelican metadata format
    let metadataLines: string[] = [];
    
    // Convert back to Pelican format with proper capitalization
    Object.keys(updatedData).forEach(key => {
      const value = updatedData[key];
      if (value !== undefined && value !== null) {
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        if (Array.isArray(value)) {
          metadataLines.push(`${capitalizedKey}: ${value.join(', ')}`);
        } else if (typeof value === 'string' && (value.includes(' ') || value.includes(':'))) {
          metadataLines.push(`${capitalizedKey}: "${value}"`);
        } else {
          metadataLines.push(`${capitalizedKey}: ${value}`);
        }
      }
    });
    
    const updatedContent = metadataLines.join('\n') + '\n\n' + content;
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
