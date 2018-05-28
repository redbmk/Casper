import React, { Fragment } from 'react';
import { compose, lifecycle } from 'recompose';
import { connect } from 'react-redux';
import { createPortal } from 'react-dom';
import { Route, Switch } from 'react-router-dom';

import 'react-bootstrap-typeahead/css/Typeahead.css';
import './styles.scss';

import { loadPosts } from './actions';
import AuthorPage from './pages/author';
import ClientsPage from './pages/clients';
import AuthorsPage from './pages/authors';
import ProjectsPage from './pages/projects';
import PostPage from './pages/post';
import CalendarPage from './pages/calendar';
import NLPPage from './pages/nlp';
import SiteSearch from './components/site-search';

const App = () => (
  <Fragment>
    {createPortal(<SiteSearch />, document.querySelector('.site-nav-container'))}
    <Switch>
      <Route exact path="/author/:slug" component={AuthorPage} />
      <Route exact path="/tag/clients" component={ClientsPage} />
      <Route exact path="/tag/authors" component={AuthorsPage} />
      <Route exact path="/tag/projects" component={ProjectsPage} />
      <Route exact path="/calendar" component={CalendarPage} />
      <Route exact path="/nlp" component={NLPPage} />
      <Route exact path="/:slug" component={PostPage} />
    </Switch>
  </Fragment>
);

export default compose(
  connect(null, { loadPosts }),
  lifecycle({
    componentDidMount() {
      this.props.loadPosts();
    },
  }),
)(App);
