import { createSelector } from 'reselect';
import { filter } from 'lodash';

import { withMeta } from './utils';

export const selectPosts = createSelector(
  state => state.posts,
  posts => [...posts || []].map(withMeta),
);

export const selectProjects = createSelector(
  selectPosts,
  posts => posts.filter(post => post.tags.find(tag => tag.slug === 'projects'))
    .map((project) => {
      const name = filter(project.tags, { meta_title: 'client' }).map(tag => tag.name).join(' / ');

      return {
        ...project,
        primary_tag: name ? { name } : project.primary_tag,
      };
    }),
);
