/* @flow */

import React, { Component } from 'react';
import { compose, withProps } from 'recompose';
import { createSelector } from 'reselect';
import { connect } from 'react-redux';
import { filter } from 'lodash';

import { loadPosts } from '../actions';
import type { Project } from '../types';
import PostCard from '../components/post-card';
import Loading from '../components/loading';
import { withMeta } from '../utils';

const selectPosts = ({ posts }) => [...posts || []];
const selectProjects = createSelector(
  selectPosts,
  posts => posts.filter(post => post.tags.find(tag => tag.slug === 'projects'))
    .map(withMeta)
    .map((project) => {
      const name = filter(project.tags, { meta_title: 'client' }).map(tag => tag.name).join(' / ');

      return {
        ...project,
        primary_tag: name ? { name } : project.primary_tag,
      };
    }),
);

type Props = {
  loading: boolean,
  loadPosts: () => void,
  projects: Array<Project>,
};

class AuthorPage extends Component<Props> {
  componentWillMount() {
    this.props.loadPosts();
  }

  render() {
    if (this.props.loading) return <h1><Loading text="Loading projects..." /></h1>;

    return (
      <div className="post-feed">
        {this.loading}
        {this.props.projects.map(project => <PostCard key={project.id} post={project} />)}
      </div>
    );
  }
}

export default compose(
  connect(({ loading, posts }) => ({ loading, posts }), { loadPosts }),
  withProps(props => ({ projects: selectProjects(props) })),
)(AuthorPage);
