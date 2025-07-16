import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { FrontmatterParser } from '../../src/frontmatter';

suite('FrontmatterParser Test Suite', () => {
  let tempDir: string;
  let testFilePath: string;

  setup(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pelican-test-'));
    testFilePath = path.join(tempDir, 'test-article.md');
  });

  teardown(() => {
    // Clean up temporary files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should parse valid Pelican post metadata', () => {
    const content = `Title: test article
Date: 2025-07-16
Slug: test-article
Status: draft
Tags: vscode, pelican
Category: Articles
Summary: My test summary

# Test Article

This is the content of the test article.

## Section 1

Some more content here.`;

    fs.writeFileSync(testFilePath, content);

    const result = FrontmatterParser.parseFile(testFilePath);

    assert.strictEqual(result.data.title, 'test article');
    assert.strictEqual(result.data.date, '2025-07-16');
    assert.strictEqual(result.data.slug, 'test-article');
    assert.strictEqual(result.data.status, 'draft');
    assert.deepStrictEqual(result.data.tags, ['vscode', 'pelican']);
    assert.strictEqual(result.data.category, 'Articles');
    assert.strictEqual(result.data.summary, 'My test summary');
    
    // Check that content is properly separated
    assert.strictEqual(result.content.trim().substring(0, 14), '# Test Article');
  });

  test('should handle quoted values', () => {
    const content = `Title: "Test Article with Quotes"
Date: 2025-07-16
Summary: "This is a summary with: colons and spaces"

Content here.`;

    fs.writeFileSync(testFilePath, content);

    const result = FrontmatterParser.parseFile(testFilePath);

    assert.strictEqual(result.data.title, 'Test Article with Quotes');
    assert.strictEqual(result.data.summary, 'This is a summary with: colons and spaces');
  });

  test('should recognize valid Pelican post', () => {
    const content = `Title: test article
Date: 2025-07-16
Status: draft

Content here.`;

    fs.writeFileSync(testFilePath, content);

    const isPelican = FrontmatterParser.isPelicanPost(testFilePath);
    assert.strictEqual(isPelican, true);
  });

  test('should not recognize invalid Pelican post', () => {
    const content = `# Just a regular markdown file

This has no metadata.`;

    fs.writeFileSync(testFilePath, content);

    const isPelican = FrontmatterParser.isPelicanPost(testFilePath);
    assert.strictEqual(isPelican, false);
  });

  test('should get post status', () => {
    const content = `Title: test article
Status: published

Content here.`;

    fs.writeFileSync(testFilePath, content);

    const status = FrontmatterParser.getPostStatus(testFilePath);
    assert.strictEqual(status, 'published');
  });

  test('should default to draft status when not specified', () => {
    const content = `Title: test article
Date: 2025-07-16

Content here.`;

    fs.writeFileSync(testFilePath, content);

    const status = FrontmatterParser.getPostStatus(testFilePath);
    assert.strictEqual(status, 'draft');
  });

  test('should toggle draft status', () => {
    const content = `Title: test article
Status: draft

Content here.`;

    fs.writeFileSync(testFilePath, content);

    // Toggle from draft to published
    const newStatus = FrontmatterParser.toggleDraftStatus(testFilePath);
    assert.strictEqual(newStatus, 'published');

    // Verify the file was updated
    const updatedStatus = FrontmatterParser.getPostStatus(testFilePath);
    assert.strictEqual(updatedStatus, 'published');

    // Toggle back to draft
    const newStatus2 = FrontmatterParser.toggleDraftStatus(testFilePath);
    assert.strictEqual(newStatus2, 'draft');
  });

  test('should update metadata correctly', () => {
    const content = `Title: Original Title
Date: 2025-07-16
Status: draft

Original content.`;

    fs.writeFileSync(testFilePath, content);

    // Update title and status
    FrontmatterParser.updateFile(testFilePath, { 
      title: 'Updated Title', 
      status: 'published' 
    });

    const result = FrontmatterParser.parseFile(testFilePath);
    assert.strictEqual(result.data.title, 'Updated Title');
    assert.strictEqual(result.data.status, 'published');
    assert.strictEqual(result.data.date, '2025-07-16'); // Should preserve existing data
    assert.strictEqual(result.content.trim(), 'Original content.'); // Should preserve content
  });

  test('should handle empty tags', () => {
    const content = `Title: test article
Tags: 
Date: 2025-07-16

Content here.`;

    fs.writeFileSync(testFilePath, content);

    const result = FrontmatterParser.parseFile(testFilePath);
    assert.strictEqual(result.data.title, 'test article');
    assert.strictEqual(result.data.date, '2025-07-16');
    // Tags should not be in the result if empty
    assert.strictEqual(result.data.tags, undefined);
  });

  test('should handle non-existent file gracefully', () => {
    const nonExistentPath = path.join(tempDir, 'non-existent.md');
    
    const isPelican = FrontmatterParser.isPelicanPost(nonExistentPath);
    assert.strictEqual(isPelican, false);
  });
});
