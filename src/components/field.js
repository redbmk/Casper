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
import Checkbox from './checkbox';

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
    return <Checkbox invalid={meta.invalid} {...input} {...props} label={labelString} />;
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
    const onBlur = (event) => {
      if (props.simple && props.allowNew) {
        input.onChange([...(props.multiple ? input.value : []), event.target.value]);
      }
    };

    return (
      <FormGroup>
        <Label for={id}>{labelString}</Label>
        <Typeahead
          {...input}
          onBlur={onBlur}
          selected={input.value}
          {...props}
        />
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

const singleSelectModifiers = ({ type, multiple, simple }) => (type === 'select' && !multiple ? {
  parse: value => value &&
    value[0] &&
    (simple && value[0].customOption ? value[0].label : value[0]),
  format: value => (value ? [value] : []),
} : {});

export default (props: any) => (
  <FinalFormField
    {...singleSelectModifiers(props)}
    {...props}
    component={Field}
  />
);
