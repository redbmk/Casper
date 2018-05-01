import $ from 'jquery';

import readingTime from '../utils/reading-time';

export default (post) => {
  let excerpt = post.custom_excerpt;

  if (!excerpt) {
    const text = $(post.html.replace(/<img .*?>/g, '')).text().trim();
    excerpt = text.split(/\s+/).slice(0, 33).join(' ');
  }

  return { ...post, excerpt, readingTime: readingTime(post) };
};
