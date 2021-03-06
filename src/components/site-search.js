import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Typeahead, Highlighter, Menu, MenuItem } from 'react-bootstrap-typeahead';
import { groupBy } from 'lodash';

import {
  selectAuthors,
  selectClients,
  selectIndividualPosts,
  selectPosts,
  selectProjects,
} from '../selectors';

const MenuItemWrapper = styled.div`
  display: flex;
`;

const Image = styled.img`
  display: block;
  background: #e3e9ed;
  border-radius: 100%;
  object-fit: cover;
  height: 50px;
  width: 50px;
  margin-right: 10px;
`;

type Option = {
  group: 'Clients' | 'Projects' | 'Posts' | 'Authors',
  id: string,
  title: string,
  description: string,
  url: string,
};

const selectOptions = createSelector(
  selectClients,
  selectProjects,
  selectIndividualPosts,
  selectAuthors,
  (clients, projects, posts, authors): Array<Option> => [
    ...clients.map(client => ({
      group: 'Clients',
      id: client.id,
      title: client.name || '',
      description: client.description || '',
      url: `/tag/${client.slug}`,
    })),
    ...[...projects, ...posts].map(post => ({
      group: post.posts ? 'Projects' : 'Posts',
      id: post.id,
      title: post.title || '',
      description: post.excerpt || '',
      url: post.url,
    })),
    ...authors.map(author => ({
      group: 'Authors',
      id: author.id,
      title: author.name || '',
      description: author.bio || '',
      url: `/author/${author.slug}`,
      image: author.profile_image,
    })),
  ],
);

type Props = {
  options: Array<Option>,
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
      <MenuItemWrapper>
        {option.image && <Image alt={option.title} src={option.image} />}
        <div>
          <Highlighter search={props.text}>
            {option.title || ' '}
          </Highlighter>
          {option.description.toLowerCase().includes(props.text.toLowerCase()) && (
            <div>
              <small>
                <Highlighter search={props.text}>
                  {option.description}
                </Highlighter>
              </small>
            </div>
          )}
        </div>
      </MenuItemWrapper>
    </Fragment>
  );

  renderMenu = (results, props) => {
    const grouped = groupBy(results, option => option.group);
    let idx = 0;

    return (
      <Menu {...props}>
        {Object.entries(grouped).map(([group, options]) => (
          <Fragment key={group}>
            {!!idx && <Menu.Divider />}
            <Menu.Header>{group}</Menu.Header>
            {options.map((option) => {
              const item = (
                <MenuItem key={option.id} option={option} position={idx}>
                  {this.renderMenuItemChildren(option, props)}
                </MenuItem>
              );

              idx += 1;

              return item;
            })}

          </Fragment>
        ))}
      </Menu>
    );
  };

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
        options={this.props.options}
        filterBy={['title', 'description']}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
        onMenuHide={this.onMenuHide}
        onMenuShow={this.onMenuShow}
        onChange={this.onChange}
        labelKey="title"
        minLength={2}
        renderMenu={this.renderMenu}
      />
    );
  }
}

export default connect(props => ({
  posts: selectPosts(props),
  options: selectOptions(props),
}))(SiteSearch);
