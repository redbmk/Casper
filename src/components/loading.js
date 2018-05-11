/* @flow */

import React, { Fragment } from 'react';

type Props = {
  text?: string,
};

const Loading = ({ text }: Props) => (
  <Fragment>
    <i className="fa fa-spinner fa-spin" /> {text}
  </Fragment>
);

Loading.defaultProps = {
  text: '',
};

export default Loading;
