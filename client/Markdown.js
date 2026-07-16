import { marked } from 'marked';
import { Component, styled } from '@vanilla-bean/components';

const escapeHtml = text =>
	text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// breaks: true, game rules are often written as plain lines; GFM line breaks keep
// single newlines visible instead of collapsing them into one paragraph.
// The html renderer and walkTokens sanitize: descriptions arrive from third parties (Steam
// store, pasted text) and land in innerHTML, so raw HTML renders as visible text instead of
// executing, and executable link protocols are dropped. Markdown covers the rest.
marked.use({
	breaks: true,
	gfm: true,
	renderer: {
		html({ text }) {
			return escapeHtml(text);
		},
	},
	walkTokens: token => {
		if ((token.type === 'link' || token.type === 'image') && /^\s*(javascript|vbscript|data):/i.test(token.href)) {
			token.href = '#';
		}
	},
});

const StyledMarkdown = styled(
	Component,
	({ colors }) => `
		line-height: 1.5;
		overflow-wrap: break-word;

		h1, h2 {
			border-bottom: 1px solid ${colors.alpha(colors.gray, 0.4)};
			padding-bottom: 3px;
		}

		ul, ol {
			padding-left: 24px;
			margin: 6px 0;
		}

		li {
			margin: 3px 0;
		}

		p {
			margin: 6px 0 12px;
		}

		a {
			color: ${colors.light(colors.blue)};
		}

		img {
			max-width: 100%;
			border-radius: 6px;
		}

		code:not([class*='language-']) {
			background-color: ${colors.alpha(colors.black, 0.5)};
			padding: 1px 5px;
			border-radius: 3px;
		}

		blockquote {
			margin: 6px 0;
			padding: 3px 12px;
			border-left: 4px solid ${colors.alpha(colors.blue, 0.5)};
			background-color: ${colors.alpha(colors.white, 0.03)};

			&.WARNING, &.CAUTION { border-color: ${colors.alpha(colors.red, 0.6)}; }
			&.NOTE, &.TIP { border-color: ${colors.alpha(colors.green, 0.6)}; }
		}

		table {
			border-collapse: collapse;
			margin: 6px 0;

			th, td {
				border: 1px solid ${colors.alpha(colors.gray, 0.5)};
				padding: 4px 9px;
			}

			th {
				background-color: ${colors.alpha(colors.white, 0.05)};
			}
		}

		hr {
			border: none;
			border-top: 1px solid ${colors.alpha(colors.gray, 0.4)};
			margin: 12px 0;
		}
	`,
);

// Mirrors the transforms in vanilla-bean-components' parseMarkdown: the pre/code class shuffle
// hooks the theme's pre[class*="language-"] styling, the blockquote one supports [!NOTE] alerts
export const renderMarkdown = md =>
	marked
		.parse(md || '')
		.replaceAll(/<pre><code class="language-([^\s"]+)/g, `<pre class="language-$1"><code class="language-$1`)
		.replaceAll(/<blockquote>\s?<p>\s?\[!(\w+)]/g, `<blockquote class="$1"><p><strong>$1</strong></p><p>`);

export default class Markdown extends StyledMarkdown {
	static schema = {
		md: {
			set(value) {
				this.elem.innerHTML = renderMarkdown(value);
			},
		},
	};

	build() {
		this.elem.innerHTML = renderMarkdown(this.options.md);
	}
}
