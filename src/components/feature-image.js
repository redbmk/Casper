/* @flow */

import React from 'react';

type Props = {
  image: string,
};

export default ({ image }: Props) => (
  <div className="post-card-image" style={{ backgroundImage: `url(${image})` }} />
);
