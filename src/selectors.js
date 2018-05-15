import { createSelector } from 'reselect';
import {
  filter,
  flatten,
  keyBy,
  sortBy,
  uniqBy,
} from 'lodash';

import { withMeta } from './utils';

export const selectPosts = createSelector(
  state => state.posts,
  posts => [...posts || []].map(withMeta),
);

export const selectProjects = createSelector(
  selectPosts,
  (unfilteredPosts) => {
    const projects = [];
    const individualPosts = [];

    unfilteredPosts.forEach((post) => {
      if (post.isProject) {
        projects.push(post);
      } else {
        individualPosts.push(post);
      }
    });

    return projects.map((project) => {
      const { projectTags } = project;
      const name = filter(project.tags, { meta_title: 'client' }).map(tag => tag.name).join(' / ');
      let posts = individualPosts
        .filter(post => post.projectTags.find(tag => projectTags.includes(tag)));

      posts = uniqBy(flatten(posts), 'id');

      return {
        ...project,
        primary_tag: name ? { name } : project.primary_tag,
        posts,
        authors: uniqBy([
          ...project.authors,
          ...flatten(posts.map(post => post.authors)),
        ], 'id'),
      };
    });
  },
);

export const selectClients = createSelector(
  selectProjects,
  (projects) => {
    const projectsByClientId = {};
    const clientsById = {};

    projects.forEach((project) => {
      filter(project.tags, { meta_title: 'client' }).forEach((client) => {
        if (!clientsById[client.id]) clientsById[client.id] = client;
        if (!projectsByClientId[client.id]) projectsByClientId[client.id] = [];
        projectsByClientId[client.id].push(project);
      });
    });

    return sortBy(
      Object.values(clientsById).map(tag => ({ ...tag, projects: projectsByClientId[tag.id] })),
      [tag => tag.name.toLowerCase(), 'id'],
    );
  },
);

export const selectIndividualPosts = createSelector(
  selectPosts,
  selectProjects,
  (posts, projects) => {
    const belongsToProject = keyBy(flatten(projects.map(project => [project, ...project.posts])), 'id');

    return posts.filter(({ id }) => !belongsToProject[id]);
  },
);
