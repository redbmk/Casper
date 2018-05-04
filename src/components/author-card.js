/* @flow */

import React from 'react';

import type { Author } from '../types';
import FeatureImage from './feature-image';
import SocialLink from './social-link';
import CardFooter from './card-footer';

type Props = {
  author: Author,
};

export default ({ author }: Props) => (
  <article key={author.id} className="post-card">
    {author.cover_image && (
      <a href={`/author/${author.slug}`} className="post-card-image-link">
        <FeatureImage image={author.cover_image} />
      </a>
    )}
    <div className="post-card-content">
      <a href={`/author/${author.slug}`} className="post-card-content-link">
        <div className="post-card-content-text">
          <header className="post-card-header">
            <h2 className="post-card-title">{author.name}</h2>
          </header>
          <section className="post-card-excerpt">
            {author.bio && <h2 className="author-bio">{author.bio}</h2>}
          </section>
        </div>
      </a>
      <CardFooter
        authors={[author]}
        readingTime={(
          <div className="author-meta">
            {author.website && (
              <SocialLink type="wb" url={author.website} />
            )}
            {author.twitter && (
              <SocialLink type="tw" url={`https://twitter.com/${author.twitter}`} />
            )}
            {author.facebook && (
              <SocialLink type="fb" url={`https://facebook.com/${author.facebook}`} />
            )}
            <SocialLink
              type="rss"
              url={`https://feedly.com/i/subscription/feed/${window.location.origin}/author/${author.slug}/rss/`}
            />
          </div>
        )}
      />
    </div>
  </article>
);
