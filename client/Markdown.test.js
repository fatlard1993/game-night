import { describe, expect, test } from 'bun:test';

import { renderMarkdown } from './Markdown';

describe('renderMarkdown', () => {
	test('renders markdown', () => {
		expect(renderMarkdown('# Title\n\n**bold**')).toContain('<h1>Title</h1>');
		expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
	});

	test('supports [!NOTE]-style alerts', () => {
		expect(renderMarkdown('> [!NOTE]\n> First team to 10 points wins.')).toContain('<blockquote class="NOTE">');
	});

	test('hooks code fences into the language-tagged pre styling', () => {
		expect(renderMarkdown('```js\nconst a = 1;\n```')).toContain('<pre class="language-js">');
	});

	test('raw HTML renders as text instead of executing', () => {
		expect(renderMarkdown('hello <script>alert(1)</script>')).not.toContain('<script');
		expect(renderMarkdown('<img src="x" onerror="alert(1)">')).not.toContain('<img');
		expect(renderMarkdown('a <b>bold</b> claim')).not.toContain('<b>');
		expect(renderMarkdown('a <b>bold</b> claim')).toContain('&lt;b&gt;');
	});

	test('executable link protocols are dropped', () => {
		expect(renderMarkdown('[link](javascript:alert(1))')).not.toContain('javascript:');
		expect(renderMarkdown('[link](JAVASCRIPT:alert(1))')).not.toContain('alert');
		expect(renderMarkdown('[ok](https://example.com)')).toContain('href="https://example.com"');
	});

	test('tolerates empty input', () => {
		expect(renderMarkdown('')).toBe('');
		expect(renderMarkdown()).toBe('');
	});
});
