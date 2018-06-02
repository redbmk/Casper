/* @flow */

export default (text: string = '') => {
  const hue = [...text].reduce(
    (hash, char) => char.charCodeAt(0) + ((hash << 5) - hash), // eslint-disable-line no-bitwise
    0,
  ) % 360;

  return `hsl(${hue}, 85%, 30%)`;
};
