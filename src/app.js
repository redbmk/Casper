import React from 'react';
import { Route, Switch } from 'react-router-dom';
import AuthorPage from './pages/author';
import ClientsPage from './pages/clients';
import AuthorsPage from './pages/authors';

export default () => (
  <Switch>
    <Route exact path="/author/:slug" component={AuthorPage} />
    <Route exact path="/tag/clients" component={ClientsPage} />
    <Route exact path="/tag/authors" component={AuthorsPage} />
  </Switch>
);
