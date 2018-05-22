/* @flow */

import React from 'react';
import styled from 'styled-components';

import { InfinityIcon } from './icons';
import type { Post } from '../types';

const Card = styled.article.attrs({
  className: 'read-next-card',
})`
  background-image: url(${props => props.featureImage});
`;

const getPostCount = (posts) => {
  const numPosts = posts.length + 1;
  if (numPosts === 1) return '1 post';
  return `See all ${numPosts} posts`;
};

type Props = {
  url: string,
  title: string,
  featureImage?: string,
  posts: Array<Post>,
  isProject?: bool,
};

const ReadNextCard = ({
  featureImage,
  title,
  url,
  posts,
  isProject,
}: Props) => (
  <Card featureImage={featureImage}>
    <header className="read-next-card-header">
      <small className="read-next-card-header-sitetitle">&mdash; {window.blogInfo.title} &mdash;</small>
      <h3 className="read-next-card-header-title"><a href={url}>{title}</a></h3>
      <div className="read-next-divider"><InfinityIcon /></div>
      <div className="read-next-card-content">
        <ul>
          {posts.slice(0, 3).map(post => (
            <li key={post.id}><a href={post.url}>{post.title}</a></li>
          ))}
        </ul>
      </div>
      <footer className="read-next-card-footer">
        <a href={url}>{isProject ? 'View project overview' : getPostCount(posts)} →</a>
      </footer>
    </header>
  </Card>
);

ReadNextCard.defaultProps = {
  featureImage: window.blogInfo.coverImage,
  isProject: false,
};

export default ReadNextCard;
