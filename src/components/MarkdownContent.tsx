'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
// Import only common languages for AI chat
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import { tokens } from '../styles';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rb', ruby);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('kt', kotlin);

/**
 * MarkdownContent - Renders markdown using marked + highlight.js
 *
 * Uses marked for markdown parsing (lightweight, reliable)
 * Uses highlight.js for code block syntax highlighting
 * Adds copy and "Open in Emblem AI" buttons to code blocks
 */
export interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Container styles
 */
const containerStyle: React.CSSProperties = {
  fontFamily: tokens.typography.fontFamily,
  fontSize: tokens.typography.fontSizeMd,
  lineHeight: 1.5,
  color: 'inherit',
  wordBreak: 'break-word',
};

/**
 * Scoped CSS for markdown content + highlight.js dark theme
 */
const scopedStyles = `
.hljs-md p {
  margin: 0 0 0.5em 0;
}
.hljs-md p:last-child {
  margin-bottom: 0;
}
.hljs-md ul,
.hljs-md ol {
  margin: 0.25em 0 0.5em 0;
  padding-left: 1.5em;
}
.hljs-md li {
  margin: 0.1em 0;
  line-height: 1.4;
}
.hljs-md li > p {
  margin: 0;
  display: inline;
}
.hljs-md li > ul,
.hljs-md li > ol {
  margin: 0.1em 0;
}
.hljs-md .code-block-wrapper {
  position: relative;
  margin: 0.5em 0;
}
.hljs-md .code-block-wrapper pre {
  position: relative;
  margin: 0;
  padding: 0.75em 1em;
  border-radius: 6px;
  background: #1e1e1e;
  overflow-x: auto;
}
.hljs-md .code-block-toolbar {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  z-index: 10;
}
.hljs-md .code-block-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 4px;
  color: #888;
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: 0.7;
}
.hljs-md .code-block-wrapper:hover .code-block-btn {
  opacity: 1;
}
.hljs-md .code-block-btn:hover {
  background: #3d3d3d;
  border-color: #555;
  color: #ccc;
}
.hljs-md .code-block-btn.copied {
  color: ${tokens.colors.accentSuccess};
}
.hljs-md code {
  font-family: ${tokens.typography.fontFamilyMono};
  font-size: 0.9em;
}
.hljs-md :not(pre) > code {
  padding: 0.15em 0.4em;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
}
.hljs-md pre code {
  padding: 0;
  background: transparent;
  font-size: 0.875em;
  line-height: 1.5;
}
.hljs-md h1, .hljs-md h2, .hljs-md h3, .hljs-md h4 {
  margin: 0.5em 0 0.25em 0;
  font-weight: 600;
  line-height: 1.3;
}
.hljs-md h1:first-child, .hljs-md h2:first-child, .hljs-md h3:first-child {
  margin-top: 0;
}
.hljs-md h1 { font-size: 1.5em; }
.hljs-md h2 { font-size: 1.25em; }
.hljs-md h3 { font-size: 1.1em; }
.hljs-md h4 { font-size: 1em; }
.hljs-md blockquote {
  margin: 0.5em 0;
  padding: 0.5em 0 0.5em 1em;
  border-left: 3px solid ${tokens.colors.borderSecondary};
  color: ${tokens.colors.textSecondary};
}
.hljs-md a {
  color: ${tokens.colors.accentPrimary};
  text-decoration: underline;
}
.hljs-md hr {
  margin: 1em 0;
  border: none;
  border-top: 1px solid ${tokens.colors.borderSecondary};
}
.hljs-md table {
  width: 100%;
  margin: 0.5em 0;
  border-collapse: collapse;
}
.hljs-md th, .hljs-md td {
  padding: 0.5em;
  border: 1px solid ${tokens.colors.borderPrimary};
  text-align: left;
}
.hljs-md th {
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
}

/* highlight.js dark theme (VS Code Dark+ inspired) */
.hljs {
  color: #d4d4d4;
  background: #1e1e1e;
}
.hljs-keyword,
.hljs-selector-tag,
.hljs-title,
.hljs-section,
.hljs-doctag,
.hljs-name,
.hljs-strong {
  color: #569cd6;
  font-weight: normal;
}
.hljs-built_in,
.hljs-literal,
.hljs-type,
.hljs-params,
.hljs-meta,
.hljs-link {
  color: #4ec9b0;
}
.hljs-string,
.hljs-symbol,
.hljs-bullet,
.hljs-addition {
  color: #ce9178;
}
.hljs-number {
  color: #b5cea8;
}
.hljs-comment,
.hljs-quote,
.hljs-deletion {
  color: #6a9955;
}
.hljs-variable,
.hljs-template-variable,
.hljs-attr {
  color: #9cdcfe;
}
.hljs-regexp,
.hljs-selector-id,
.hljs-selector-class {
  color: #d7ba7d;
}
.hljs-emphasis {
  font-style: italic;
}
`;

// Configure marked with highlight.js
marked.use({
  gfm: true,
  breaks: false,
});

/**
 * Highlight code using highlight.js
 */
function highlightCode(code: string, lang: string): string {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch {
      // Fall through to auto-detect
    }
  }

  // Auto-detect language
  try {
    return hljs.highlightAuto(code).value;
  } catch {
    // Fallback to escaped plain text
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

/**
 * Generate unique ID for code blocks
 */
let codeBlockCounter = 0;
function generateCodeBlockId(): string {
  return `code-block-${++codeBlockCounter}`;
}

/**
 * Process markdown and highlight code blocks
 * Returns HTML with data attributes for code block content
 */
function renderMarkdown(content: string): string {
  // Parse markdown to HTML
  const html = marked.parse(content, { async: false }) as string;

  // Find and highlight code blocks with language
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
  let result = html.replace(codeBlockRegex, (_, lang, code) => {
    const decoded = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
    const highlighted = highlightCode(decoded, lang);
    const id = generateCodeBlockId();
    const encodedCode = encodeURIComponent(decoded);
    return `<div class="code-block-wrapper" data-code-id="${id}" data-code="${encodedCode}"><pre><code class="hljs language-${lang}">${highlighted}</code></pre><div class="code-block-toolbar"><button class="code-block-btn" data-action="copy" data-code-id="${id}" title="Copy code"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><button class="code-block-btn" data-action="emblem" data-code-id="${id}" title="Open in Emblem AI"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></button></div></div>`;
  });

  // Also handle code blocks without language
  const plainCodeRegex = /<pre><code>([\s\S]*?)<\/code><\/pre>/g;
  result = result.replace(plainCodeRegex, (_, code) => {
    const decoded = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
    const highlighted = highlightCode(decoded, '');
    const id = generateCodeBlockId();
    const encodedCode = encodeURIComponent(decoded);
    return `<div class="code-block-wrapper" data-code-id="${id}" data-code="${encodedCode}"><pre><code class="hljs">${highlighted}</code></pre><div class="code-block-toolbar"><button class="code-block-btn" data-action="copy" data-code-id="${id}" title="Copy code"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><button class="code-block-btn" data-action="emblem" data-code-id="${id}" title="Open in Emblem AI"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></button></div></div>`;
  });

  return result;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const [rendered, setRendered] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const html = renderMarkdown(content);
      setRendered(html);
    } catch (err) {
      console.error('[MarkdownContent] Render error:', err);
      // Fallback to escaped plain text
      setRendered(
        content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
      );
    }
  }, [content]);

  // Attach event handlers after render
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-action]') as HTMLElement;
      if (!button) return;

      const action = button.dataset.action;
      const codeId = button.dataset.codeId;
      if (!codeId) return;

      const wrapper = container.querySelector(`[data-code-id="${codeId}"]`) as HTMLElement;
      if (!wrapper) return;

      const encodedCode = wrapper.dataset.code;
      if (!encodedCode) return;

      const code = decodeURIComponent(encodedCode);

      if (action === 'copy') {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(code);
          button.classList.add('copied');
          // Change icon to checkmark temporarily
          button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>`;
          setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>`;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      } else if (action === 'emblem') {
        e.preventDefault();
        // Open Emblem AI with code in URL (no auto-submit)
        const url = `https://build.emblemvault.ai/?q=${encodeURIComponent(code)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [rendered]);

  return (
    <>
      <style>{scopedStyles}</style>
      <div
        ref={containerRef}
        style={containerStyle}
        className={`hljs-md ${className || ''}`}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </>
  );
}

export default MarkdownContent;
