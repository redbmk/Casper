/* @flow */

import React, { Component, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { compose, withProps } from 'recompose';
import { createSelector } from 'reselect';
import { flatMap, uniqBy, flatten, filter } from 'lodash';
import { connect } from 'react-redux';

import type { Post, Project, Tag } from '../types';
import ProjectCard from '../components/project-card';
import PostCard from '../components/post-card';
import AuthorStat from '../components/author-stat';
import { selectIndividualPosts, selectClientsWithEmptyClient } from '../selectors';

const selectAuthorFilter = ({ match: { params: { slug } } }) => ({ slug });
const selectSummary = createSelector(
  selectClientsWithEmptyClient,
  selectIndividualPosts,
  selectAuthorFilter,
  (clients, individualPosts, authorFilter) => {
    const authorClients = clients.map((client) => {
      const projects = client.projects
        .filter(project => filter(project.authors, authorFilter).length)
        .map((project) => {
          const posts = project.posts.filter(post => filter(post.authors, authorFilter));
          const authors = uniqBy([
            ...project.originalAuthors,
            ...flatten(posts.map(post => post.authors)),
          ], 'id');

          return { ...project, posts, authors };
        });

      if (!projects.length) return null;

      return { ...client, projects };
    }).filter(Boolean);

    const authorProjects = uniqBy(flatten(authorClients.map(client => client.projects)), 'id');
    const authorPosts = individualPosts.filter(post => filter(post.authors, authorFilter).length);

    const numPosts = authorPosts.length + uniqBy(flatMap(authorProjects, 'posts'), 'id').length;

    return {
      clients: authorClients,
      numClients: authorClients.filter(client => client.id).length,
      projects: authorProjects,
      numPosts,
      individualPosts: authorPosts,
    };
  },
);

type Props = {
  loading: boolean,
  clients: Array<Tag>,
  numClients: number,
  projects: Array<Project>,
  numPosts: number,
  individualPosts: Array<Post>,
};

class AuthorPage extends Component<Props> {
  get authorStats() {
    const element = document.getElementById('author-stats');

    let children;

    if (this.props.loading) {
      children = <i className="fa fa-spin fa-spinner" />;
    } else {
      const { numClients, projects, numPosts } = this.props;

      children = (
        <Fragment>
          <AuthorStat singular="client" numItems={numClients} />
          <AuthorStat singular="project" numItems={projects.length} />
          <AuthorStat singular="post" numItems={numPosts} />
        </Fragment>
      );
    }

    return createPortal(children, element);
  }

  render() {
    return (
      <Fragment>
        {this.authorStats}
        {!this.props.loading && this.props.clients.map(client => (
          <div className="client-projects" key={client.id}>
            {client.id ? (
              <a href={`/tag/${client.slug}/`} className="site-title">{client.name}</a>
            ) : (
              <h1 className="site-title">{client.name}</h1>
            )}
            <div className="post-feed">
              {client.projects.map(project => <ProjectCard key={project.id} project={project} />)}
            </div>
          </div>
        ))}
        {this.props.individualPosts.length > 0 && (
          <Fragment>
            <h1 className="site-title">Individual Posts</h1>
            <div className="post-feed">
              {this.props.individualPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </Fragment>
        )}
      </Fragment>
    );
  }
}

export default compose(
  connect(({ loading, posts }) => ({ loading, posts })),
  withProps(selectSummary),
)(AuthorPage);
