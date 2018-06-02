/* @flow */

import React, { Component, Fragment } from 'react';
import styled, { css } from 'styled-components';
import moment from 'moment';
import RBC from 'react-big-calendar';
import { Map, Set } from 'immutable';
import { Form } from 'react-final-form';
import {
  Button,
  Form as BootstrapForm,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
} from 'reactstrap';
import { Highlighter } from 'react-bootstrap-typeahead';

import 'react-big-calendar/lib/css/react-big-calendar.css';

import Field from '../components/field';
import { database } from '../firebase';
import Loading from '../components/loading';
import textToColor from '../utils/color-generator';
import storage from '../utils/local-storage';
import Checkbox from '../components/checkbox';

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

const CategoryFieldWrapper = styled.div`
  ${props => props.selected && css`
    .rbt-input-main.form-control {
      color: ${textToColor(props.selected)};
    }
  `};

  ${props => props.newSelectionColor && css`
    .rbt-menu-custom-option span {
      color: ${props.newSelectionColor};
    }
  `};
`;

const getEventStyle = event => ({
  style: {
    backgroundColor: textToColor(event.category),
  },
});

type Props = {};
type State = {
  events: Map<string, any>,
  loading: bool,
  newCategoryColor?: string,
  hiddenCategories: Set<string>,
};

class CalendarPage extends Component<Props, State> {
  state = {
    events: new Map(),
    loading: true,
    newCategoryColor: null,
    hiddenCategories: new Set(storage.get('hiddenCategories')),
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

  get filteredEvents() {
    const { hiddenCategories, events } = this.state;

    return events
      .filter(({ category }) => !hiddenCategories.has(category || null))
      .toArray();
  }

  getCategories = (selected: ?string) => this.state.events.toSet()
    .map(event => event.category || null)
    .add(selected || null)
    .remove(null)
    .sort()
    .toArray();

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

  updateNewCategoryColor = (text) => {
    this.setState({ newCategoryColor: text && textToColor(text) });
  };

  resetHiddenCategories = () => {
    storage.set('hiddenCategories', null);
    this.setState({ hiddenCategories: new Set() });
  };

  toggleHiddenCategory = (category) => {
    this.setState((state) => {
      const hiddenCategories = state.hiddenCategories.has(category)
        ? state.hiddenCategories.remove(category)
        : state.hiddenCategories.add(category);

      storage.set('hiddenCategories', hiddenCategories.toArray());

      return { hiddenCategories };
    });
  };

  renderCategoryOption = (option, props) => (
    <div style={{ color: textToColor(option) }}>
      <Highlighter search={props.text}>
        {option}
      </Highlighter>
    </div>
  );

  renderEventEditor = ({ handleSubmit, invalid, values }) => (
    <Modal isOpen toggle={this.closeModal} autoFocus={false}>
      <form onSubmit={handleSubmit}>
        <ModalHeader toggle={this.closeModal}>
          {values.title || '(New Event)'}
        </ModalHeader>
        <ModalBody>
          <Field name="title" autoFocus validate={required} />
          <CategoryFieldWrapper
            selected={values.category}
            newSelectionColor={this.state.newCategoryColor}
          >
            <Field
              name="category"
              type="select"
              newSelectionPrefix="New category: "
              simple
              allowNew
              options={this.getCategories(values.category)}
              renderMenuItemChildren={this.renderCategoryOption}
              onInputChange={this.updateNewCategoryColor}
            />
          </CategoryFieldWrapper>
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
    const { editing, loading, hiddenCategories } = this.state;

    if (loading) {
      return (
        <FullPage>
          <h2><Loading text="Loading Calendar..." /></h2>
        </FullPage>
      );
    }

    const categories = this.getCategories();

    return (
      <FullPage>
        <BigCalendar
          events={this.filteredEvents}
          eventPropGetter={getEventStyle}
          selectable
          popup
          defaultDate={new Date()}
          onSelectSlot={this.selectSlot}
          onSelectEvent={this.selectEvent}
          onNavigate={this.loadEvents}
        />
        <Label><b>Categories</b></Label>
        <BootstrapForm inline>
          <Checkbox
            label={<b className={!hiddenCategories.size ? 'text-muted' : ''}>Show all</b>}
            checked={!hiddenCategories.size}
            disabled={!hiddenCategories.size}
            onChange={this.resetHiddenCategories}
          />
          <Checkbox
            label={<i>Uncategorized</i>}
            color={textToColor()}
            checked={!hiddenCategories.has(null)}
            onChange={() => this.toggleHiddenCategory(null)}
          />
          {categories.map(category => (
            <Checkbox
              key={category}
              label={category}
              color={textToColor(category)}
              checked={!hiddenCategories.has(category)}
              onChange={() => this.toggleHiddenCategory(category)}
            />
          ))}
        </BootstrapForm>
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
