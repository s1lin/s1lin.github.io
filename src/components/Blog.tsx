import { Fragment } from "react";
import { Barcode, Kicker } from "@/components/bits";
import { Runhead } from "@/components/Runhead";
import { Comments } from "@/components/social/Comments";
import { POSTS, type Post } from "@/content/posts";

const RUN = "随筆 · Blog";

function Endmark({ back }: { back?: boolean }) {
  return (
    <div className="endmark mono">
      <p>© 2026 s1lin</p>
      {back && (
        <p>
          <a href="/blog/">← All posts</a>
        </p>
      )}
      <p>
        <a href="/">The issue →</a>
      </p>
    </div>
  );
}

/** The blog's front page: every post, newest first. */
function BlogIndex() {
  return (
    <>
      <a className="skip" href="#posts">
        Skip to the posts
      </a>
      <Runhead label={RUN} home="/" />
      <main>
        <section className="spread blog">
          <div className="wrap grid">
            <div className="blog__intro">
              <Kicker ja="随筆">Blog</Kicker>
              <h1 className="display">
                Notes <em>between issues.</em>
              </h1>
            </div>
            <p className="blog__aside">
              Longer pieces, newest first, in the language they were written in. Some ran somewhere else first; they
              are kept here as they ran.
            </p>
            <ol className="posts" id="posts">
              {POSTS.map((p) => (
                <li key={p.slug}>
                  <a href={`/blog/${p.slug}/`}>
                    <span className="posts__meta">
                      No. {p.no}
                      <Barcode id={p.id} />
                    </span>
                    <span className="posts__title" lang={p.lang}>
                      {p.title}
                    </span>
                    <span className="posts__dek">{p.dek}</span>
                  </a>
                </li>
              ))}
            </ol>
            <Endmark />
          </div>
        </section>
      </main>
    </>
  );
}

/** One post as one spread: its head and spec sheet on the left, the text on the right. */
function PostPage({ post }: { post: Post }) {
  return (
    <>
      <a className="skip" href="#text">
        Skip to the text
      </a>
      <Runhead label={RUN} home="/" />
      <main>
        <article className="spread post">
          <div className="wrap grid">
            {/* its own grid, so the head held on the left stops with the text, short of the foot */}
            <div className="post__main">
              <header className="post__head">
                <Kicker ja="随筆">
                  <a href="/blog/">Blog</a> · No. {post.no}
                </Kicker>
                <h1 className={post.title.length > 16 ? "post__title post__title--long" : "post__title"} lang={post.lang}>
                  {post.title}
                </h1>
                <p className="dek">{post.dek}</p>
                <dl className="spec">
                  {post.spec.map(([dt, dd]) => (
                    <Fragment key={dt}>
                      <dt>{dt}</dt>
                      <dd>{dd}</dd>
                    </Fragment>
                  ))}
                </dl>
                <p className="post__code">
                  <Barcode id={post.id} />
                </p>
              </header>

              <div className="post__text figs" id="text" lang={post.lang}>
                {post.epigraph && (
                  <figure className="post__epigraph">
                    <blockquote>{post.epigraph.text}</blockquote>
                    <figcaption>—— {post.epigraph.by}</figcaption>
                  </figure>
                )}
                {post.body}
                <p className="post__signed">{post.signed}</p>
                {post.refs && (
                  <section className="post__refs" aria-labelledby="refs-h">
                    <h2 id="refs-h">引用</h2>
                    <ol>
                      {post.refs.map((r, i) => (
                        <li key={i} id={`ref-${i + 1}`}>
                          {r}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                {post.note && (
                  <p className="post__note" lang="en">
                    {post.note}
                  </p>
                )}
              </div>
              <div className="post__social">
                <Comments target={`site:s1lin:blog/${post.slug}`} lang="en" />
              </div>
            </div>

            <Endmark back />
          </div>
        </article>
      </main>
    </>
  );
}

/** A page of the blog: a post by its slug, or the index without one. */
export function BlogPage({ slug }: { slug?: string }) {
  const post = slug && POSTS.find((p) => p.slug === slug);
  return post ? <PostPage post={post} /> : <BlogIndex />;
}
