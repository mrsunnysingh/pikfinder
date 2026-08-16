import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, XLogo, FacebookLogo, LinkedinLogo, WhatsappLogo, RedditLogo,
  TelegramLogo, LinkSimple, Check, ShareNetwork,
} from '@phosphor-icons/react';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL } from '../tools/registry';
import { getPost, buildArticleJsonLd } from '../lib/blog';
import Markdown from '../lib/blog/Markdown';

// Social share targets. Each builds a standard share-intent URL from the
// canonical post URL + title. Opens in a new tab; no tracking, no SDKs.
function ShareBar({ url, title }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const links = [
    { label: 'Share on X', Icon: XLogo, href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { label: 'Share on Facebook', Icon: FacebookLogo, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: 'Share on LinkedIn', Icon: LinkedinLogo, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: 'Share on WhatsApp', Icon: WhatsappLogo, href: `https://wa.me/?text=${t}%20${u}` },
    { label: 'Share on Telegram', Icon: TelegramLogo, href: `https://t.me/share/url?url=${u}&text=${t}` },
    { label: 'Share on Reddit', Icon: RedditLogo, href: `https://www.reddit.com/submit?url=${u}&title=${t}` },
  ];

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard unavailable */ }
  };

  const nativeShare = async () => {
    if (navigator.share) { try { await navigator.share({ title, url }); } catch { /* dismissed */ } }
    else copyLink();
  };

  return (
    <div className="blog-share">
      <span className="blog-share-label"><ShareNetwork weight="bold" /> Share</span>
      <div className="blog-share-buttons">
        {links.map(({ label, Icon, href }) => (
          <a key={label} className="blog-share-btn" href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label}>
            <Icon weight="fill" />
          </a>
        ))}
        <button className="blog-share-btn" onClick={copyLink} title={copied ? 'Link copied' : 'Copy link'} aria-label="Copy link">
          {copied ? <Check weight="bold" /> : <LinkSimple weight="bold" />}
        </button>
        <button className="blog-share-btn blog-share-native" onClick={nativeShare} title="Share…" aria-label="Share">
          <ShareNetwork weight="bold" />
        </button>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  // Firestore Timestamp → Date. Never return a raw object (crashes React render).
  if (typeof d === 'object') {
    if (typeof d.toDate === 'function') d = d.toDate();
    else if (typeof d.seconds === 'number') d = new Date(d.seconds * 1000);
    else return '';
  }
  const date = new Date(d);
  if (isNaN(date)) return typeof d === 'string' ? d : '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(undefined); // undefined = loading, null = not found
  const url = `${SITE_URL}/blog/${slug}`;

  useEffect(() => {
    let alive = true;
    setPost(undefined);
    Promise.resolve(getPost(slug))
      .then((p) => { if (alive) setPost(p || null); })
      .catch(() => { if (alive) setPost(null); });
    return () => { alive = false; };
  }, [slug]);

  useSeo(
    post
      ? {
          title: `${post.title} | PikFinder`,
          description: post.description,
          canonical: url,
          jsonLd: buildArticleJsonLd(post, url),
        }
      : { title: 'Blog | PikFinder', description: 'Guides for creators from the PikFinder team.', canonical: `${SITE_URL}/blog` }
  );

  if (post === undefined) {
    return (
      <article className="blog-article">
        <div className="blog-article-head">
          <div className="related-skeleton" style={{ height: 40, width: '90%', aspectRatio: 'auto' }} />
          <div className="related-skeleton" style={{ height: 16, width: '70%', aspectRatio: 'auto', marginTop: 12 }} />
        </div>
        <div className="related-skeleton" style={{ height: 280, width: '100%', aspectRatio: 'auto', borderRadius: 'var(--radius-lg)' }} />
      </article>
    );
  }

  if (!post) {
    return (
      <header className="page-header">
        <h1>Post not found</h1>
        <p>This article may have moved or been unpublished.</p>
        <Link to="/blog" className="btn-primary" style={{ marginTop: 'var(--space-md)' }}>Back to the blog</Link>
      </header>
    );
  }

  return (
    <article className="blog-article">
      <div className="blog-article-head">
        <Link to="/blog" className="blog-back"><ArrowLeft /> All articles</Link>
        {post.tags?.[0] && <span className="blog-card-tag">{post.tags[0]}</span>}
        <h1>{post.title}</h1>
        <p className="blog-article-lead">{post.description}</p>
        <div className="blog-article-meta">
          <span>{post.author}</span>
          <span>·</span>
          <span>{formatDate(post.publishedAt)}</span>
          <span>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <ShareBar url={url} title={post.title} />
      </div>

      {post.coverImage && (
        <div className="blog-article-cover">
          <img src={post.coverImage} alt="" />
        </div>
      )}

      <Markdown body={post.body || ''} />

      <div className="blog-share-footer">
        <span className="blog-share-cta">Enjoyed this? Share it</span>
        <ShareBar url={url} title={post.title} />
      </div>
    </article>
  );
}
