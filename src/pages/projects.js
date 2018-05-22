/* @flow */

import React from 'react';
import { connect } from 'react-redux';

import type { Project } from '../types';
import PostCard from '../components/post-card';
import Loading from '../components/loading';
import { selectProjects } from '../selectors';

type Props = {
  loading: boolean,
  projects: Array<Project>,
};

const AuthorPage = ({ loading, projects }: Props) => {
  if (loading) return <h1><Loading text="Loading projects..." /></h1>;

  return (
    <div className="post-feed">
      {projects.map(project => <PostCard key={project.id} post={project} />)}
    </div>
  );
};

export default connect(props => ({
  loading: !props.loaded,
  projects: selectProjects(props),
}))(AuthorPage);
