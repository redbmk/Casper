import React from 'react';
import { Route, Switch } from 'react-router-dom';
import AuthorPage from './pages/author';

export default () => (
  <Switch>
    <Route exact path="/author/:slug" component={AuthorPage} />
  </Switch>
);
