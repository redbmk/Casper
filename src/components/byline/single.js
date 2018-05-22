/* @flow */

import React from 'react';

import type { Author } from '../../types';
import { Avatar } from './../icons';

type Props = {
  author: Author,
  className?: string,
};

const SingleByline = ({ author, className }: Props) => (
  <section className={`${className} author-card`}>
    {author.profile_image ? (
      <img className="author-profile-image" src={author.profile_image} alt={author.name} />
    ) : (
      <span className="avatar-wrapper"><Avatar /></span>
    )}
    <section className="author-card-content">
      <h4 className="author-card-name"><a href={`/author/${author.slug}`}>{author.name}</a></h4>
      {author.bio ? (
        <p>{author.bio}</p>
      ) : (
        <p>Read <a href={`/author/${author.slug}`}>more</a> by this author.</p>
      )}
    </section>
    <div className="author-card-read-more">
      <a className="author-card-button" href={`/author/${author.slug}`}>Read more</a>
    </div>
  </section>
);

SingleByline.defaultProps = {
  className: '',
};

export default SingleByline;
