/* @flow */

import React, { Component, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { compose, withProps } from 'recompose';
import { createSelector } from 'reselect';
import { uniq, uniqBy, flatten, remove, filter, find } from 'lodash';
import { connect } from 'react-redux';
import $ from 'jquery';

import { loadPosts } from '../actions';
import type { Post, Project, Tag } from '../types';
import ProjectCard from '../components/project-card';
import PostCard from '../components/post-card';
import readingTime from '../utils/reading-time';

const withMeta = (post) => {
  let excerpt = post.custom_excerpt;

  if (!excerpt) {
    const text = $(post.html.replace(/<img .*?>/g, '')).text().trim();
    excerpt = text.split(/\s+/).slice(0, 33).join(' ');
  }

  return { ...post, excerpt, readingTime: readingTime(post) };
};

const selectPosts = ({ posts }) => [...posts || []];
const selectLoading = ({ posts }) => ({ loading: !posts.length });
const selectAuthorFilter = ({ match: { params: { slug } } }) => ({ slug });
const selectSummary = createSelector(
  selectPosts,
  selectAuthorFilter,
  (posts, authorFilter) => {
    const tags = uniqBy(flatten(posts.map(post => post.tags)), 'id');
    const clientsById = filter(tags, { meta_title: 'client' }).reduce((collection, tag) => ({
      ...collection,
      [tag.id]: { tag, projects: [] },
    }), {});

    const authorPosts = posts.filter(post => find(post.authors, authorFilter)).map(withMeta);

    remove(posts, post => post.tags.find(tag => tag.slug === 'projects'))
      .map(withMeta)
      .forEach((projectPost) => {
        const project = { ...projectPost, posts: [] };

        project.tags.forEach((tag) => {
          if (tag.meta_title === 'client') {
            clientsById[tag.id].projects.push(project);
          } else if (tag.meta_title === 'project') {
            project.posts = uniq([
              ...project.posts,
              ...authorPosts
                .filter(post => post.id !== project.id && find(post.tags, { id: tag.id })),
            ]);
          }
        });

        project.shouldShow = project.posts.length || !!find(project.authors, authorFilter);
        project.authors = uniqBy([
          ...project.authors,
          ...flatten(project.posts.map(post => post.authors)),
        ], 'id');
      });

    const clients = Object.values(clientsById).map((client) => {
      const projects = filter(client.projects, 'shouldShow');
      return projects.length ? { ...client.tag, projects } : null;
    }).filter(Boolean);

    const filteredProjects = uniq(flatten(clients.map(({ projects }) => projects)))
      .map(withMeta);

    const individualPosts = [...authorPosts];
    filteredProjects.forEach((project) => {
      [project, ...project.posts].forEach(({ id }) => remove(individualPosts, { id }));
    });

    const numPosts = individualPosts.length +
      filteredProjects.reduce((sum, project) => sum + project.posts.length, 0);

    return {
      clients,
      projects: filteredProjects,
      numPosts,
      individualPosts,
    };
  },
);

const AuthorStat = ({ singular, numItems }) => numItems > 0 && (
  <Fragment>
    {numItems} {singular}{numItems > 1 ? 's' : ''}
    <span className="bull">&bull;</span>
  </Fragment>
);

type Props = {
  loading: boolean,
  loadPosts: () => void,
  clients: Array<Tag>,
  projects: Array<Project>,
  numPosts: number,
  individualPosts: Array<Post>,
};

class AuthorPage extends Component<Props> {
  componentWillMount() {
    this.props.loadPosts();
  }

  get authorStats() {
    const element = document.getElementById('author-stats');

    let children;

    if (this.props.loading) {
      children = <i className="fa fa-spin fa-spinner" />;
    } else {
      const { clients, projects, numPosts } = this.props;

      children = (
        <Fragment>
          <AuthorStat singular="client" numItems={clients.length} />
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
  connect(({ loading, posts }) => ({ loading, posts }), { loadPosts }),
  withProps(selectSummary),
  withProps(selectLoading),
)(AuthorPage);
