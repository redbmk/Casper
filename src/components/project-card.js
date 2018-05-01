/* @flow */

import React from 'react';
import type { Project } from '../types';

import FeatureImage from './feature-image';
import CardHeader from './card-header';
import CardFooter from './card-footer';

export default ({ project }: { project: Project }) => (
  <article
    className={[
      'post-card',
      !project.feature_image && 'no-image',
      project.posts.length && 'has-sub-posts',
    ].filter(Boolean).join(' ')}
  >
    <a href={project.url} className="post-card-image-link">
      {project.feature_image && <FeatureImage image={project.feature_image} />}
    </a>
    <div className="post-card-content">
      <CardHeader
        url={project.url}
        tags={project.project_tag && project.project_tag.name}
        title={project.title}
        excerpt={project.excerpt}
      />
      {project.posts.map(post => (
        <CardHeader
          key={post.id}
          url={post.url}
          tags={post.title}
          excerpt={post.excerpt}
          image={post.feature_image}
        />
      ))}
      <CardFooter authors={project.authors} />
    </div>
  </article>
);
