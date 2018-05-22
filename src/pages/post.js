/* @flow */

import React, { Component, Fragment } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { compose, branch, renderComponent, withProps } from 'recompose';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { uniqBy, flatMap, find, filter } from 'lodash';
import moment from 'moment';
import { URL } from 'whatwg-url';

import type { Post, Project, Tag } from '../types';
import { selectPosts, selectProjects, selectClients, selectNonProjectPosts } from '../selectors';
import Byline from '../components/byline';
import PostCard from '../components/post-card';
import ReadNextCard from '../components/read-next-card';
import { Point, Twitter, Facebook } from '../components/icons';

const { blogInfo, HTMLElement } = window;

const FeatureImage = styled.figure.attrs({
  className: 'post-full-image',
})`
  background-image: url(${props => props.url});
`;

const shareTwitter = (event) => {
  event.preventDefault();
  window.open(event.currentTarget.href, 'share-twitter', 'width=550,height=235');
};

const shareFacebook = (event) => {
  event.preventDefault();
  window.open(event.currentTarget.href, 'share-facebook', 'width=580,height=296');
};

type Props = {
  post: Post,
  project?: Project,
  projects: Array<Project>,
  readNextData?: {
    primaryTag?: Tag,
    prevPost?: Post,
    nextPost?: Post,
  },
};

type State = {
  documentHeight: number,
  windowHeight: number,
  scrollY: number,
  showFloatingHeader: boolean,
};

const ProjectReadNextFeed = ({ project }) => project.posts
  .map(post => <PostCard key={`${project.id}-${post.id}`} post={post} />);

class PostPage extends Component<Props, State> {
  state = {
    documentHeight: 0,
    windowHeight: 0,
    scrollY: 0,
    showFloatingHeader: false,
  };

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, false);

    this.onScroll();
    this.onResize();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
  }

  onScroll = () => {
    const { scrollY } = window;
    this.setState({
      scrollY,
      documentHeight: document.documentElement.scrollHeight,
    });

    if (this.titleRef) {
      const trigger = this.titleRef.getBoundingClientRect().top + scrollY;
      const triggerOffset = this.titleRef.offsetHeight + 35;

      this.setState({ showFloatingHeader: scrollY >= trigger + triggerOffset });
    }
  }

  onResize = () => {
    this.setState({
      windowHeight: window.innerHeight,
    });
  }

  get postContent() {
    const html = { __html: this.props.post.html };
    // eslint-disable-next-line react/no-danger
    return <section className="post-full-content" dangerouslySetInnerHTML={html} />;
  }

  titleRef: ?HTMLElement;

  updateTitleRef = (ref) => {
    this.titleRef = ref;
  }

  renderReadNextFeed() {
    const { post, projects } = this.props;
    const postFilter = ({ id }) => id !== post.id;

    return projects.map(project => (
      <Fragment key={project.id}>
        <ReadNextCard
          isProject
          url={project.url}
          title={project.title}
          featureImage={project.feature_image}
          posts={project.posts.filter(postFilter)}
        />
        <ProjectReadNextFeed project={project} />
      </Fragment>
    ));
  }

  renderIndividualPostReadNextFeed() {
    const { primaryTag, prevPost, nextPost } = this.props.readNextData;

    return (
      <Fragment>
        {primaryTag && (
          <ReadNextCard
            url={`/tag/${primaryTag.slug}`}
            title={primaryTag.name}
            featureImage={primaryTag.feature_image}
            posts={primaryTag.posts}
          />
        )}
        {prevPost && <PostCard post={prevPost} />}
        {nextPost && <PostCard post={nextPost} />}
      </Fragment>
    );
  }

  renderRelatedPosts() {
    const { project, projects } = this.props;

    let relatedPosts;

    if (project) {
      relatedPosts = <ProjectReadNextFeed project={project} />;
    } else if (projects.length) {
      relatedPosts = this.renderReadNextFeed();
    } else {
      relatedPosts = this.renderIndividualPostReadNextFeed();
    }

    return createPortal(relatedPosts, document.querySelector('.read-next-feed'));
  }

  renderFloatingHeader() {
    const { post } = this.props;

    const twURL = new URL('https://twitter.com/share');
    twURL.searchParams.set('text', post.title);
    twURL.searchParams.set('url', window.location.href);

    const fbURL = new URL('https://www.facebook.com/sharer/sharer.php');
    fbURL.searchParams.set('u', window.location.href);

    const headerClassList = ['floating-header'];
    if (this.state.showFloatingHeader) {
      headerClassList.push('floating-active');
    }

    return (
      <div className={headerClassList.join(' ')}>
        <div className="floating-header-logo">
          <a href={blogInfo.url}>
            {blogInfo.icon && <img src={blogInfo.icon} alt={`${blogInfo.title} icon`} />}
            <span>{blogInfo.title}</span>
          </a>
        </div>
        <span className="floating-header-dividier">&mdash;</span>
        <div className="floating-header-title">{post.title}</div>
        <div className="floating-header-share">
          <div className="floating-header-share-label">Share this <Point /></div>
          <a className="floating-header-share-tw" href={twURL} onClick={shareTwitter}>
            <Twitter />
          </a>
          <a className="floating-header-share-fb" href={fbURL} onClick={shareFacebook}>
            <Facebook />
          </a>
        </div>
        <progress
          className="progress"
          max={this.state.documentHeight - this.state.windowHeight}
          value={this.state.scrollY}
        >
          <div className="progress-container">
            <span className="progress-bar" />
          </div>
        </progress>
      </div>
    );
  }

  render() {
    const {
      post,
      project,
      projects,
      readNextData,
    } = this.props;
    const postDate = moment(post.published_at);

    let tags = [];
    if (project) {
      tags = filter(project.tags, { meta_title: 'client' });
    } else if (projects.length) {
      tags = post.tags.filter(tag => post.projectTags.includes(tag.id));
    } else if (readNextData.primaryTag) {
      tags = [readNextData.primaryTag];
    }

    return (
      <Fragment>
        {this.renderRelatedPosts()}
        <article className="post-full">
          <header className="post-full-header">
            <section className="post-full-meta">
              <time
                className="post-full-meta-date"
                dateTime={postDate.format('YYYY-MM-DD')}
              >
                {postDate.format('D MMMM YYYY')}
              </time>
              {tags.map(tag => (
                <Fragment key={tag.id}>
                  <span className="date-divider">/</span> <a href={`/tag/${tag.slug}`}>{tag.name}</a>
                </Fragment>
              ))}
            </section>
            <h1 className="post-full-title" ref={this.updateTitleRef}>{post.title}</h1>
            {project && (
              <Fragment>
                <h5><i>Project Overview</i></h5>
                <Byline className="project-byline" header="Project team members" authors={project.authors} />
              </Fragment>
            )}
          </header>
          {post.feature_image && <FeatureImage url={post.feature_image} />}
          {this.postContent}
          {!project && (
            <footer className="post-full-footer">
              <Byline authors={post.authors} />
            </footer>
          )}
        </article>
        {this.renderFloatingHeader()}
      </Fragment>
    );
  }
}

const Loading = () => <h2 className="py-5"><i className="fa fa-spin fa-spinner" /> Loading...</h2>;

const selectPost = createSelector(
  state => state.posts,
  state => state.match.params.slug,
  (posts, slug) => find(posts, { slug }),
);

const selectProject = createSelector(
  selectPost,
  selectProjects,
  (post, projects) => (post.isProject ? find(projects, { id: post.id }) : null),
);

const selectPostProjects = createSelector(
  selectPost,
  selectProjects,
  (post, projects) => {
    if (post.isProject) return [];
    const tagToProjects = tagId => projects.filter(project => project.projectTags.includes(tagId));
    return uniqBy(flatMap(post.projectTags, tagToProjects), 'id');
  },
);

const selectReadNextData = createSelector(
  selectPost,
  selectPostProjects,
  selectPosts,
  selectNonProjectPosts,
  (post, postProjects, posts, individualPosts) => {
    if (post.isProject || postProjects.length) return null;

    const primaryTag = post.primary_tag && {
      ...post.primary_tag,
      posts: posts
        .filter(({ id, tags }) => id !== post.id && find(tags, { id: post.primary_tag.id })),
    };

    const postIndex = individualPosts.findIndex(({ id }) => id === post.id);

    return {
      primaryTag,
      prevPost: posts[postIndex - 1],
      nextPost: posts[postIndex + 1],
    };
  },
);

export default compose(
  connect(state => ({
    loading: !state.loaded,
    posts: selectPosts(state),
    clients: selectClients(state),
  })),
  branch(
    props => props.loading,
    renderComponent(Loading),
  ),
  withProps(props => ({
    post: selectPost(props),
    project: selectProject(props),
    projects: selectPostProjects(props),
    readNextData: selectReadNextData(props),
  })),
)(PostPage);
