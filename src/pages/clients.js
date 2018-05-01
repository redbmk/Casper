/* @flow */

import React, { Component, Fragment } from 'react';
import { compose, withProps } from 'recompose';
import { createSelector } from 'reselect';
import { uniq, uniqBy, sortBy, flatten, remove, filter, find } from 'lodash';
import { connect } from 'react-redux';

import { loadPosts } from '../actions';
import type { Tag } from '../types';
import ProjectCard from '../components/project-card';
import PostCard from '../components/post-card';
import { withMeta } from '../utils';

const selectPosts = ({ posts }) => [...posts || []].map(withMeta);
const selectLoading = ({ posts }) => ({ loading: !posts.length });
const selectSummary = createSelector(
  selectPosts,
  (posts) => {
    const tags = uniqBy(flatten(posts.map(post => post.tags)), 'id');
    const clientsById = filter(tags, { meta_title: 'client' }).reduce((collection, tag) => ({
      ...collection,
      [tag.id]: { tag, projects: [] },
    }), {});

    const projectPostIds = new Set();

    remove(posts, post => post.tags.find(tag => tag.slug === 'projects'))
      .forEach((projectPost) => {
        const project = { ...projectPost, posts: [], isProject: true };
        projectPostIds.add(project.id);

        project.tags.forEach((tag) => {
          if (tag.meta_title === 'client') {
            clientsById[tag.id].projects.push(project);
          } else if (tag.meta_title === 'project') {
            project.posts = uniq([
              ...project.posts,
              ...posts
                .filter(post => post.id !== project.id && find(post.tags, { id: tag.id })),
            ]);
          }
        });

        project.authors = uniqBy([
          ...project.authors,
          ...flatten(project.posts.map(post => post.authors)),
        ], 'id');
      });

    posts.filter(post => !projectPostIds.has(post.id)).forEach((post) => {
      post.tags.forEach((tag) => {
        if (tag.meta_title === 'client') {
          clientsById[tag.id].projects.push(post);
        }
      });
    });

    const clients = sortBy(
      Object.values(clientsById).map(({ tag, projects }) => ({ ...tag, projects })),
      'name',
    );

    return { clients };
  },
);

type Props = {
  loading: boolean,
  loadPosts: () => void,
  clients: Array<Tag>,
};

class ClientsPage extends Component<Props> {
  componentWillMount() {
    this.props.loadPosts();
  }

  render() {
    return (
      <Fragment>
        {!this.props.loading && this.props.clients.map(client => (
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
        ))}
      </Fragment>
    );
  }
}

export default compose(
  connect(({ loading, posts }) => ({ loading, posts }), { loadPosts }),
  withProps(selectSummary),
  withProps(selectLoading),
)(ClientsPage);
