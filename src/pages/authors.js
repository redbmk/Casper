/* @flow */

import React, { Component, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { connect } from 'react-redux';

import type { Author } from '../types';
import AuthorCard from '../components/author-card';
import Stat from '../components/author-stat';
import { selectAuthors, selectProjects, selectClients, selectNonProjectPosts } from '../selectors';

type Props = {
  loading: boolean,
  authors: Array<Author>,
  numClients: number,
  numProjects: number,
  numPosts: number,
};

class AuthorsPage extends Component<Props> {
  get stats() {
    const element = document.getElementById('author-stats');

    let children;

    if (this.props.loading) {
      children = <i className="fa fa-spin fa-spinner" />;
    } else {
      const {
        authors,
        numClients,
        numProjects,
        numPosts,
      } = this.props;

      children = (
        <Fragment>
          <Stat
            singular="author"
            numItems={authors.length}
            hideBull={!numClients && !numProjects && !numPosts}
          />
          <Stat
            singular="client"
            numItems={numClients}
            hideBull={!numProjects && !numPosts}
          />
          <Stat
            singular="project"
            numItems={numProjects}
            hideBull={!numPosts}
          />
          <Stat
            singular="post"
            numItems={numPosts}
            hideBull
          />
        </Fragment>
      );
    }

    return createPortal(children, element);
  }

  render() {
    return (
      <Fragment>
        {this.stats}
        <div className="post-feed">
          {this.props.authors.map(author => <AuthorCard key={author.id} author={author} />)}
        </div>
      </Fragment>
    );
  }
}

export default connect(props => ({
  loading: !props.loaded,
  authors: selectAuthors(props),
  numClients: selectClients(props).length,
  numProjects: selectProjects(props).length,
  numPosts: selectNonProjectPosts(props).length,
}))(AuthorsPage);
