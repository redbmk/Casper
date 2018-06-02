/* @flow */

import React from 'react';
import classnames from 'classnames';
import {
  FormGroup,
  Label,
  Input,
} from 'reactstrap';

type Props = {
  label: string,
  color: ?string,
  checked: ?boolean,
};

export default ({ label, color, ...props }: Props) => (
  <FormGroup>
    <FormGroup check>
      <Label check>
        <i
          className={classnames(
            'form-check-input',
            props.checked ? 'fas fa-check-square' : 'far fa-square',
            props.checked && !color && 'text-primary',
          )}
          style={{ color: props.checked ? color : '#a5a5a5' }}
        />
        <Input className="hidden d-none" type="checkbox" {...props} />
        &nbsp;{label}
      </Label>
    </FormGroup>
  </FormGroup>
);
