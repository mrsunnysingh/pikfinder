// src/lib/blog/Markdown.jsx
// A tiny, dependency-free Markdown-subset renderer that outputs React elements
// (never dangerouslySetInnerHTML), so the blog keeps the app's zero-XSS posture.
// Supports: ## / ### headings, - bullet lists, blank-line paragraphs, and inline
// **bold**, `code`, and [text](url) links (http/https or site-relative only).

import React from 'react';
import { Link } from 'react-router-dom';

// Allow only safe link targets.
function safeHref(url) {
  if (/^\//.test(url)) return { href: url, internal: true };
  if (/^https?:\/\//i.test(url)) return { href: url, internal: false };
  return null;
}

// Parse inline **bold**, `code`, and [text](url) into React nodes.
function parseInline(text, keyBase) {
  const nodes = [];
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[2] !== undefined) {
      nodes.push(<strong key={key}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      nodes.push(<code key={key}>{m[3]}</code>);
    } else if (m[4] !== undefined) {
      const link = safeHref(m[5]);
      if (!link) nodes.push(m[4]);
      else if (link.internal) nodes.push(<Link key={key} to={link.href}>{m[4]}</Link>);
      else nodes.push(<a key={key} href={link.href} target="_blank" rel="noopener noreferrer">{m[4]}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function Markdown({ body = '' }) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let para = [];
  let list = [];

  const flushPara = () => {
    if (para.length) { blocks.push({ type: 'p', text: para.join(' ') }); para = []; }
  };
  const flushList = () => {
    if (list.length) { blocks.push({ type: 'ul', items: list.slice() }); list = []; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) { flushPara(); flushList(); blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '') }); }
    else if (/^##\s+/.test(line)) { flushPara(); flushList(); blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '') }); }
    else if (/^[-*]\s+/.test(line)) { flushPara(); list.push(line.replace(/^[-*]\s+/, '')); }
    else if (line.trim() === '') { flushPara(); flushList(); }
    else { flushList(); para.push(line.trim()); }
  }
  flushPara(); flushList();

  return (
    <div className="blog-prose">
      {blocks.map((b, i) => {
        if (b.type === 'h2') return <h2 key={i}>{parseInline(b.text, `h2${i}`)}</h2>;
        if (b.type === 'h3') return <h3 key={i}>{parseInline(b.text, `h3${i}`)}</h3>;
        if (b.type === 'ul') return <ul key={i}>{b.items.map((it, j) => <li key={j}>{parseInline(it, `li${i}-${j}`)}</li>)}</ul>;
        return <p key={i}>{parseInline(b.text, `p${i}`)}</p>;
      })}
    </div>
  );
}
