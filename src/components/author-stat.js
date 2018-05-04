/* @flow */

import React, { Fragment } from 'react';

import Bull from './bull';

type Props = {
  singular: string,
  numItems: number,
  hideBull?: boolean,
};

const AuthorStat = ({ singular, numItems, hideBull }: Props) => {
  if (numItems <= 0) return null;

  return (
    <Fragment>
      {numItems} {singular}{numItems > 1 ? 's' : ''}
      {!hideBull && <Bull />}
    </Fragment>
  );
};

AuthorStat.defaultProps = {
  hideBull: false,
};

export default AuthorStat;
