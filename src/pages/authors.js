/* @flow */

import React, { Component, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { compose, withProps } from 'recompose';
import { createSelector } from 'reselect';
import { keyBy, uniqBy, sortBy, flatten, filter, find } from 'lodash';
import { connect } from 'react-redux';

import { loadPosts } from '../actions';
import type { Author } from '../types';
import AuthorCard from '../components/author-card';
import Stat from '../components/author-stat';
import { selectPosts } from '../selectors';

const selectSummary = createSelector(
  selectPosts,
  (posts) => {
    const nonProjectPosts = posts.filter(post => !find(post.tags, { slug: 'projects' }));
    const projects = posts
      .filter(post => find(post.tags, { slug: 'projects' }))
      .map((project) => {
        const projectClients = filter(project.tags, { meta_title: 'client' });
        const projectIds = keyBy(filter(project.tags, { meta_title: 'project' }), 'id');
        const projectPosts = nonProjectPosts
          .filter(post => post.tags.find(tag => projectIds[tag.id]))
          .map(post => ({ ...post, authorIds: keyBy(post.authors, 'id') }));

        const projectAuthors = flatten(project.authors, ...projectPosts.map(post => post.authors));

        return {
          ...project,
          clients: projectClients,
          posts: projectPosts,
          authorIds: keyBy(projectAuthors, 'id'),
        };
      });

    const authors = sortBy(uniqBy(flatten(posts.map(post => post.authors)), 'id'), 'name');

    return {
      authors,
      numProjects: projects.length,
      numClients: uniqBy(flatten(projects.map(project => project.clients)), 'id').length,
      numPosts: nonProjectPosts.length,
    };
  },
);

type Props = {
  loading: boolean,
  loadPosts: () => void,
  authors: Array<Author>,
  numClients: number,
  numProjects: number,
  numPosts: number,
};

class AuthorsPage extends Component<Props> {
  componentWillMount() {
    this.props.loadPosts();
  }

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

export default compose(
  connect(({ loading, posts }) => ({ loading, posts }), { loadPosts }),
  withProps(selectSummary),
)(AuthorsPage);
