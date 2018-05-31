/* @flow */

import React, { Component, Fragment, type Node } from 'react';
import { Pagination, PaginationItem, PaginationLink } from 'reactstrap';

const getPages = ({ current, numPages }) => {
  let startPage;
  let endPage;

  if (numPages <= 10) {
    startPage = 1;
    endPage = numPages;
  } else if (current <= 6) {
    startPage = 1;
    endPage = 10;
  } else if (current + 4 >= numPages) {
    startPage = numPages - 9;
    endPage = numPages;
  } else {
    startPage = current - 5;
    endPage = current + 4;
  }

  return [...Array((endPage + 1) - startPage).keys()].map(i => startPage + i);
};

type Props = {
  items: Array<any>,
  // https://github.com/yannickcr/eslint-plugin-react/issues/1797
  // eslint-disable-next-line react/no-unused-prop-types
  pageSize?: number,
  numPages?: number,
  wrapper?: Component,
  children: () => Node,
};

type State = {
  current: number,
};

export default class Pager extends Component<Props, State> {
  static defaultProps = {
    pageSize: undefined,
    numPages: undefined,
    wrapper: Fragment,
  };

  static getDerivedStateFromProps = (props, state) => {
    let { pageSize } = props;
    let { current } = state;

    if (props.numPages && !pageSize) {
      pageSize = Math.ceil(props.items.length / props.numPages);
    } else {
      pageSize = 10;
    }

    const numPages = Math.ceil(props.items.length / pageSize);

    if (current < 1) {
      current = 1;
    } else if (current >= numPages) {
      current = numPages;
    }

    return {
      pageSize,
      current,
      numPages,
      pages: getPages({ current, numPages }),
    };
  };

  state = {
    current: 1,
  };

  render() {
    const {
      current,
      numPages,
      pageSize,
      pages,
    } = this.state;

    const Wrapper = this.props.wrapper;

    return (
      <Fragment>
        {numPages > 1 && (
          <Wrapper>
            <Pagination>
              <PaginationItem disabled={current <= 1}>
                <PaginationLink onClick={() => this.setState({ current: 1 })}>
                  First
                </PaginationLink>
              </PaginationItem>
              <PaginationItem disabled={current <= 1}>
                <PaginationLink previous onClick={() => this.setState({ current: current - 1 })} />
              </PaginationItem>
              {pages.map(page => (
                <PaginationItem key={page} active={page === current}>
                  <PaginationLink onClick={() => this.setState({ current: page })}>
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem disabled={current >= numPages}>
                <PaginationLink next onClick={() => this.setState({ current: current + 1 })} />
              </PaginationItem>
              <PaginationItem disabled={current >= numPages}>
                <PaginationLink next onClick={() => this.setState({ current: numPages })}>
                  Last
                </PaginationLink>
              </PaginationItem>
            </Pagination>
          </Wrapper>
        )}
        {this.props.children({
          items: this.props.items.slice((current - 1) * pageSize, current * pageSize),
        })}
      </Fragment>
    );
  }
}
