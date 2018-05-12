import $ from 'jquery';

const { ghost } = window;

export const types = {
  UPDATE_STATE: 'UPDATE_STATE',
};

const updateState = payload => ({
  type: types.UPDATE_STATE,
  payload,
});

export const loadPosts = () => async (dispatch, getState) => {
  const { loaded, loading } = getState();
  if (loaded || loading) return;

  await dispatch(updateState({ loading: true }));

  const url = ghost.url.api('posts', { include: 'authors,tags', limit: 'all' });
  const { posts } = await $.getJSON(url);

  await dispatch(updateState({ loaded: true, loading: false, posts }));
};
