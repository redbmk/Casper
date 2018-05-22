/* @flow */

import React, { Component, Fragment } from 'react';

import type { Author } from '../../types';
import { Avatar } from './../icons';

type Props = {
  authors: Array<Author>,
  header?: string,
  className?: string,
};

type State = {
  hovered?: string,
};

class MultipleByline extends Component<Props, State> {
  state = {
    hovered: null,
  };

  hoverTimeout: ?number;

  hoverIn({ id }) {
    clearTimeout(this.hoverTimeout);
    this.setState({ hovered: id });
  }

  hoverOut({ id }) {
    this.hoverTimeout = setTimeout(() => {
      if (this.state.hovered === id) {
        this.setState({ hovered: null });
      }
    }, 800);
  }

  renderAuthor = (author) => {
    const url = `/author/${author.slug}`;

    const hovered = this.state.hovered === author.id;

    return (
      <li
        key={author.id}
        className="author-list-item"
        onFocus={() => this.hoverIn(author)}
        onMouseEnter={() => this.hoverIn(author)}
        onMouseLeave={() => this.hoverOut(author)}
        onBlur={() => this.hoverOut(author)}
      >
        <div className={hovered ? 'author-card hovered' : 'author-card'}>
          <div className="basic-info">
            {author.profile_image ? (
              <img className="author-profile-image" src={author.profile_image} alt={author.name} />
            ) : (
              <span className="avatar-wrapper"><Avatar /></span>
            )}
            <h2>{author.name}</h2>
          </div>
          <div className="bio">
            {author.bio ? (
              <Fragment>
                <p>{author.bio}</p>
                <p><a href={url}>More</a> by {author.name}.</p>
              </Fragment>
            ) : (
              <p>Read <a href={url}>more</a> by this author.</p>
            )}
          </div>
        </div>
        {author.profile_image ? (
          <a href={url} className="moving-avatar">
            <img className="author-profile-image" src={author.profile_image} alt={author.name} />
          </a>
        ) : (
          <a href={url} className="moving-avatar author-profile-image">
            <Avatar />
          </a>
        )}
      </li>
    );
  }

  render() {
    const {
      authors,
      header = 'This post was a collaboration between',
      className = '',
    } = this.props;

    return (
      <section className={`${className} post-full-authors`}>
        <div className="post-full-authors-content">
          <p>{header}</p>
          <p>{authors.map(author => author.name).join(', ')}</p>
        </div>
        <ul className="author-list">{authors.map(this.renderAuthor)}</ul>
      </section>
    );
  }
}

export default MultipleByline;
