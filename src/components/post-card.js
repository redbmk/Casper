/* @flow */

import React from 'react';
import type { Post } from '../types';

import FeatureImage from './feature-image';
import CardHeader from './card-header';
import CardFooter from './card-footer';

export default ({ post }: { post: Post }) => (
  <article
    className={[
      'post-card',
      !post.feature_image && 'no-image',
    ].filter(Boolean).join(' ')}
  >
    <a href={post.url} className="post-card-image-link">
      {post.feature_image && <FeatureImage image={post.feature_image} />}
    </a>
    <div className="post-card-content">
      <CardHeader
        url={post.url}
        tags={post.primary_tag && post.primary_tag.name}
        title={post.title}
        excerpt={post.excerpt}
      />
      <CardFooter {...post} />
    </div>
  </article>
);
