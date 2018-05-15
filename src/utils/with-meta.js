import $ from 'jquery';
import { filter } from 'lodash';

import readingTime from './reading-time';

export default (post) => {
  let excerpt = post.custom_excerpt;

  if (!excerpt) {
    excerpt = post.html.replace(/<img [\s\S]*?>/g, '');
    excerpt = excerpt.replace(/<script [\s\S]*?<\/script>/g, '');
    excerpt = $(excerpt).text().trim();
    excerpt = excerpt.split(/\s+/).slice(0, 33).join(' ');
  }

  return {
    ...post,
    excerpt,
    readingTime: readingTime(post),
    isProject: !!post.tags.find(tag => tag.slug === 'projects'),
    projectTags: filter(post.tags, { meta_title: 'project' }).map(tag => tag.id),
  };
};
