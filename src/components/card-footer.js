/* @flow */

import React from 'react';

import { Avatar } from './icons';
import type { Author } from '../types';

type Props = {
  authors: Array<Author>,
  readingTime?: string,
};

const CardFooter = ({ authors, readingTime }: Props) => (
  <footer className="post-card-meta">
    <ul className="author-list">
      {authors.map(author => (
        <li key={author.id} className="author-list-item">
          <div className="author-name-tooltip">{author.name}</div>
          <a
            href={`/author/${author.slug}/`}
            className={[
              'static-avatar',
              !author.profile_image && 'author-profile-image',
            ].filter(Boolean).join(' ')}
          >
            {author.profile_image ? (
              <img alt={author.name} src={author.profile_image} className="author-profile-image" />
            ) : (
              <Avatar />
            )}
          </a>
        </li>
      ))}
    </ul>
    <span className="reading-time">{readingTime}</span>
  </footer>
);

CardFooter.defaultProps = {
  readingTime: '',
};

export default CardFooter;
