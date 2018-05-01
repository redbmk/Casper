/* @flow */

export type Author = {
  id: string,
  name: string,
  slug: string,
  profile_image?: string,
};

export type Post = {
  id: string,
  url: string,
  slug: string,
};

export type Project = {
  posts: Array<Post>,
} & Post;

export type Tag = {
  id: string,
  projects: Array<Project>,
};
