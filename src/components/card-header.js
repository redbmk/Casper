/* @flow */

import React from 'react';

import FeatureImage from './feature-image';

type Props = {
  url: string,
  image?: string,
  tags?: string,
  title?: string,
  excerpt?: string,
};

const CardHeader = ({
  url,
  image,
  tags,
  title,
  excerpt,
}: Props) => (
  <a href={url} className="post-card-content-link">
    {image && <FeatureImage image={image} />}
    <div className="post-card-content-text">
      <header className="post-card-header">
        {tags && <span className="post-card-tags">{tags}</span>}
        {title && <h2 className="post-card-title">{title}</h2>}
      </header>
      <section className="post-card-excerpt">
        <p>{excerpt}</p>
      </section>
    </div>
  </a>
);

CardHeader.defaultProps = {
  image: null,
  tags: null,
  title: null,
  excerpt: '',
};

export default CardHeader;
