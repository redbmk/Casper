import { types } from './actions';

const initialState = {
  loaded: false,
  loading: false,
  posts: [],
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case types.UPDATE_STATE:
      return { ...state, ...payload };
    default:
      return state;
  }
};
