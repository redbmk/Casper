import { createSelector } from 'reselect';
import {
  filter,
  find,
  flatten,
  keyBy,
  map,
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
        originalAuthors: project.authors,
        authors: uniqBy([
          ...project.authors,
          ...flatten(posts.map(post => post.authors)),
        ], 'id'),
      };
    });
  },
);

export const selectClientsWithEmptyClient = createSelector(
  selectProjects,
  (projects) => {
    const projectsByClientId = {};
    const clientsById = {};

    projects.forEach((project) => {
      const clients = filter(project.tags, { meta_title: 'client' });
      if (!clients.length) clients.push({ id: '', name: 'No client' });

      clients.forEach((client) => {
        if (!clientsById[client.id]) clientsById[client.id] = client;
        if (!projectsByClientId[client.id]) projectsByClientId[client.id] = [];
        projectsByClientId[client.id].push(project);
      });
    });

    return sortBy(
      Object.values(clientsById).map(tag => ({ ...tag, projects: projectsByClientId[tag.id] })),
      [tag => !tag.id, tag => tag.name.toLowerCase(), 'id'],
    );
  },
);

export const selectClients = createSelector(
  selectClientsWithEmptyClient,
  clients => clients.filter(client => client.id),
);

export const selectNonProjectPosts = createSelector(
  selectPosts,
  posts => posts.filter(post => !find(post.tags, { slug: 'projects' })),
);

export const selectIndividualPosts = createSelector(
  selectPosts,
  selectProjects,
  (posts, projects) => {
    const belongsToProject = keyBy(flatten(projects.map(project => [project, ...project.posts])), 'id');

    return posts.filter(({ id }) => !belongsToProject[id]);
  },
);

export const selectAuthors = createSelector(
  selectPosts,
  posts => sortBy(uniqBy(flatten(map(posts, 'authors')), 'id'), 'name'),
);
