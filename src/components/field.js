/* @flow */

import React from 'react';
import { Field as FinalFormField } from 'react-final-form';
import type { FieldRenderProps } from 'react-final-form/dist/types.js.flow';
import { startCase } from 'lodash';
import {
  FormGroup,
  FormFeedback,
  Label,
  Input,
} from 'reactstrap';
import { Typeahead } from 'react-bootstrap-typeahead';

import DateTimePicker from './date-time-picker';

type Props = {
  type?: string,
  label?: string,
} & FieldRenderProps;

const Field = ({
  type,
  label,
  input,
  meta,
  ...props
}: Props) => {
  const id = `event-edit-${input.name}`;

  const labelString = label || startCase(input.name);

  if (type === 'checkbox') {
    return (
      <FormGroup>
        <FormGroup check>
          <Label check>
            <Input invalid={meta.invalid} {...input} {...props} type="checkbox" />
            &nbsp;{labelString}
          </Label>
        </FormGroup>
      </FormGroup>
    );
  }

  if (type === 'date') {
    return (
      <FormGroup>
        <Label for={id}>{labelString}</Label>
        <DateTimePicker
          {...input}
          value={input.value || null}
          {...props}
        />
      </FormGroup>
    );
  }

  if (type === 'select') {
    return (
      <FormGroup>
        <Label for={id}>{labelString}</Label>
        <Typeahead {...input} selected={input.value || []} {...props} />
      </FormGroup>
    );
  }

  return (
    <FormGroup>
      <Label for={id}>{labelString}</Label>
      <Input invalid={meta.touched && meta.invalid} type={type} {...input} {...props} />
      <FormFeedback className="d-block">{meta.touched && meta.error}&nbsp;</FormFeedback>
    </FormGroup>
  );
};

export default (props: any) => <FinalFormField {...props} component={Field} />;
