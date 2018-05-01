import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';

import reducers from './reducers';

const isDev = process.env.NODE_ENV === 'development';

export default () => {
  if (isDev && window.store) {
    window.store.replaceReducer(reducers);
    return window.store;
  }

  const store = createStore(
    reducers,
    composeWithDevTools({})(applyMiddleware(thunk)),
  );

  if (isDev) window.store = store;

  return store;
};
