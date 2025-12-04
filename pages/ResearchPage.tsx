import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Page } from '../components/Page';
import { MarkdownContent } from '../components/MarkdownContent';

type ResearchPost = {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  content: string;
};

// Eagerly load all Markdown files in content/research. Add a new .md file and it will appear.
const markdownModules = import.meta.glob('../content/research/*.md', {
  as: 'raw',
  eager: true,
}) as Record<string, string>;

const parseFrontmatter = (raw: string): { meta: Record<string, string>; body: string } => {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  match[1]
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [key, ...rest] = line.split(':');
      if (!key) return;
      meta[key.trim()] = rest.join(':').trim().replace(/^['"]|['"]$/g, '');
    });

  const body = raw.slice(match[0].length);
  return { meta, body };
};

const loadPostsFromMarkdown = (): ResearchPost[] => {
  return Object.entries(markdownModules)
    .map(([path, raw]) => {
      const slug = path.split('/').pop()?.replace(/\.md$/, '') || path;
      const { meta, body } = parseFrontmatter(raw);
      return {
        slug,
        title: meta.title || slug,
        date: meta.date || '1970-01-01',
        summary: meta.summary,
        content: body.trim(),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
};

export function ResearchPage() {
  const { slug } = useParams<{ slug?: string }>();

  const posts = React.useMemo(() => loadPostsFromMarkdown(), []);

  const [activeSlug, setActiveSlug] = React.useState<string | undefined>(
    slug || posts[0]?.slug
  );

  React.useEffect(() => {
    setActiveSlug(slug || posts[0]?.slug);
  }, [slug, posts]);

  const activePost = posts.find((post) => post.slug === activeSlug);

  const renderPostMeta = (post: ResearchPost) => {
    const date = new Date(post.date);
    const formatted = Number.isNaN(date.getTime())
      ? post.date
      : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    return (
      <div className="text-xs text-[var(--color-muted)]">
        {formatted}
        {post.summary ? ` · ${post.summary}` : ''}
      </div>
    );
  };

  if (!posts.length) {
    return (
      <Page title="Research">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[var(--color-muted)]">Research posts will appear here soon.</span>
            <a
              href="mailto:hello@theplannersassistant.uk?subject=Research%20submission"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              Submit research! +
            </a>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Research">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[var(--color-muted)]">
          The Planner’s Assistant should be understood less as a product and more as an active research agenda — a shared, evolving laboratory for rethinking how planning judgement, evidence, and public-sector reasoning can be operationalised. As part of this, we are launching an open call for contributions. If your work touches planning theory, agentic AI, spatial reasoning, or digital governance, we invite you to submit papers and provocations that help shape the platform’s intellectual direction.
        </div>
        <a
          href="mailto:hello@theplannersassistant.uk?subject=Research%20submission"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
        >
          Submit research! +
        </a>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-3">
          <div className="text-sm font-semibold text-[var(--color-ink)]">All posts</div>
          <div className="rounded-2xl border border-[var(--color-edge)] bg-[var(--color-panel)] divide-y divide-[var(--color-edge)]">
            {posts.map((post) => {
              const isActive = post.slug === activeSlug;
              return (
                <Link
                  key={post.slug}
                  to={`/research/${post.slug}`}
                  className={`block px-4 py-3 transition-colors ${
                    isActive ? 'bg-[var(--color-surface)] text-[var(--color-ink)]' : 'hover:bg-[var(--color-surface)]'
                  }`}
                  onClick={() => setActiveSlug(post.slug)}
                >
                  <div className="text-sm font-medium">{post.title}</div>
                  {renderPostMeta(post)}
                </Link>
              );
            })}
          </div>
        </aside>

        <article className="lg:col-span-3">
          {activePost ? (
            <div className="space-y-3 rounded-2xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-6 shadow-sm">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--color-ink)]">{activePost.title}</h2>
                {renderPostMeta(activePost)}
              </div>
              <MarkdownContent markdown={activePost.content} />
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-5 text-[var(--color-ink)]">
              Post not found. Choose another from the sidebar.
            </div>
          )}
        </article>
      </div>
    </Page>
  );
}
