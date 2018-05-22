/* @flow */

import React from 'react';
import { compose, branch, renderNothing } from 'recompose';
import { connect } from 'react-redux';

import type { Tag } from '../types';
import ProjectCard from '../components/project-card';
import PostCard from '../components/post-card';
import { selectClients } from '../selectors';

type Props = {
  clients: Array<Tag>,
};

const ClientsPage = ({ clients }: Props) => clients.map(client => (
  <div className="client-projects" key={client.id}>
    {client.id ? (
      <a href={`/tag/${client.slug}/`} className="site-title">{client.name}</a>
    ) : (
      <h1 className="site-title">{client.name}</h1>
    )}
    <div className="post-feed">
      {client.projects.map(project => (project.isProject ? (
        <ProjectCard key={project.id} project={project} />
      ) : (
        <PostCard key={project.id} post={project} />
      )))}
    </div>
  </div>
));

export default compose(
  connect(props => ({
    loading: !props.loaded,
    clients: selectClients(props),
  })),
  branch(props => props.loading, renderNothing),
)(ClientsPage);
