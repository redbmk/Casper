import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Typeahead, Highlighter } from 'react-bootstrap-typeahead';

import { selectPosts } from '../selectors';
import type { Post } from '../types';

type Props = {
  posts: Array<Post>,
};

type State = {
  isFocused: bool,
  isMenuOpen: bool,
};

class SiteSearch extends Component<Props, State> {
  state = {
    isFocused: false,
    isMenuOpen: false,
  };

  onFocus = () => { this.setState({ isFocused: true }); }
  onBlur = () => { this.setState({ isFocused: false }); }

  onMenuHide = () => { this.setState({ isMenuOpen: false }); }
  onMenuShow = () => { this.setState({ isMenuOpen: true }); }

  onChange = ([selected]) => {
    if (selected) {
      window.location = selected.url;
    }
  }

  renderMenuItemChildren = (option, props) => (
    <Fragment>
      <Highlighter search={props.text}>
        {option.title || ' '}
      </Highlighter>
      {option.excerpt.includes(props.text) && (
        <div>
          <small>
            <Highlighter search={props.text}>
              {option.excerpt}
            </Highlighter>
          </small>
        </div>
      )}
    </Fragment>
  );

  render() {
    const classes = [
      'site-search',
      this.state.isMenuOpen && 'is-menu-open',
      this.state.isFocused && 'is-focused',
    ].filter(Boolean).join(' ');

    return (
      <Typeahead
        placeholder="Search"
        className={classes}
        options={this.props.posts}
        filterBy={['title', 'excerpt']}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
        onMenuHide={this.onMenuHide}
        onMenuShow={this.onMenuShow}
        onChange={this.onChange}
        labelKey="title"
        minLength={2}
        renderMenuItemChildren={this.renderMenuItemChildren}
      />
    );
  }
}

export default connect(props => ({
  posts: selectPosts(props),
}))(SiteSearch);
