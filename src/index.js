import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import configureStore from './store';
import App from './app';

const root = document.getElementById('root');

if (root) {
  const store = configureStore();

  const render = (AppComponent) => {
    ReactDOM.render(
      <Provider store={store}>
        <BrowserRouter>
          <AppComponent />
        </BrowserRouter>
      </Provider>,
      root,
    );
  };

  render(App);
}
