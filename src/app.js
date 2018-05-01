import React from 'react';
import { Route, Switch } from 'react-router-dom';
import AuthorPage from './pages/author';
import ClientsPage from './pages/clients';

export default () => (
  <Switch>
    <Route exact path="/author/:slug" component={AuthorPage} />
    <Route exact path="/tag/clients" component={ClientsPage} />
  </Switch>
);
