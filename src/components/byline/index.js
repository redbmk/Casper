/* @flow */

import {
  branch,
  compose,
  renderComponent,
  renderNothing,
  withProps,
} from 'recompose';

import SingleByline from './single';
import MultipleByline from './multiple';

const Single = withProps(props => ({ author: props.authors[0] }))(SingleByline);

export default compose(
  branch(props => !props.authors.length, renderNothing),
  branch(props => props.authors.length === 1, renderComponent(Single)),
)(MultipleByline);
