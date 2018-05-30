/* @flow */

import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import RBC from 'react-big-calendar';
import { Map } from 'immutable';
import { Form } from 'react-final-form';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';

import 'react-big-calendar/lib/css/react-big-calendar.css';

import Field from '../components/field';
import { database } from '../firebase';
import Loading from '../components/loading';

const required = value => (value ? undefined : 'Required');

RBC.setLocalizer(RBC.momentLocalizer(moment));

const FullPage = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const BigCalendar = styled(RBC)`
  flex: 1;
  min-height: 0;
  margin-top: 2em;
  font-size: 12px;
`;

type Props = {};
type State = {
  events: Map<string, any>,
  loading: bool,
};

class CalendarPage extends Component<Props, State> {
  state = {
    events: new Map(),
    loading: true,
  };

  componentDidMount() {
    this.eventsRef = database.ref('events');
    this.eventsRef.on('value', (snapshot) => {
      const events = new Map(snapshot.val()).mapEntries(([id, event]) => [id, {
        ...event,
        start: moment.utc(event.start).toDate(),
        end: moment.utc(event.end).toDate(),
        id,
      }]);

      this.setState({ events, loading: false });
    });
  }

  componentWillUnmount() {
    if (this.eventsRef) this.eventsRef.off();
  }

  eventsRef: ?any;

  selectSlot = (slot) => {
    const { start, end, action } = slot;
    if (['click', 'select'].includes(action)) {
      this.setState({
        editing: {
          start,
          end,
          allDay: moment(start).startOf('day').isSame(start) &&
            moment(end).startOf('day').isSame(end),
        },
      });
    }
  }

  selectEvent = (event) => {
    this.setState({ editing: event });
  }

  deleteEvent = () => {
    database.ref('events').child(this.state.editing.id).remove();

    this.closeModal();
  };

  saveEvent = async ({ id, ...eventData }) => {
    const collection = database.ref('events');
    const event = {
      ...eventData,
      start: moment.utc(eventData.start).format(),
      end: moment.utc(eventData.end).format(),
    };

    if (id) {
      collection.child(id).set(event);
    } else {
      collection.push().set(event);
    }

    this.closeModal();
  };

  closeModal = () => {
    this.setState({ editing: null });
  };

  renderEventEditor = ({ handleSubmit, invalid }) => (
    <Modal isOpen toggle={this.closeModal} autoFocus={false}>
      <form onSubmit={handleSubmit}>
        <ModalHeader toggle={this.closeModal}>
          <Field name="title">
            {({ input: { value } }) => value || '(no name)'}
          </Field>
        </ModalHeader>
        <ModalBody>
          <Field name="title" autoFocus validate={required} />
          <Field name="allDay" type="checkbox" />
          <Field name="allDay">
            {({ input: { value: allDay } }) => (
              <Fragment>
                <Field name="start" type="date" time={!allDay} validate={required} />
                <Field name="end" type="date" time={!allDay} validate={required} />
              </Fragment>
            )}
          </Field>
        </ModalBody>
        <ModalFooter>
          <Field name="id">
            {({ input }) => input.value && (
              <Button color="danger" onClick={this.deleteEvent}>Delete</Button>
            )}
          </Field>
          <Button color="primary" disabled={invalid}>Save</Button>
          <Button color="secondary" onClick={this.closeModal}>Cancel</Button>
        </ModalFooter>
      </form>
    </Modal>
  );

  render() {
    const { events, editing, loading } = this.state;

    if (loading) {
      return (
        <FullPage>
          <h2><Loading text="Loading Calendar..." /></h2>
        </FullPage>
      );
    }

    return (
      <FullPage>
        <BigCalendar
          events={events.toArray()}
          selectable
          popup
          defaultDate={new Date()}
          onSelectSlot={this.selectSlot}
          onSelectEvent={this.selectEvent}
          onNavigate={this.loadEvents}
        />
        {editing && (
          <Form
            initialValues={editing}
            onSubmit={this.saveEvent}
            render={this.renderEventEditor}
          />
        )}
      </FullPage>
    );
  }
}

export default CalendarPage;
