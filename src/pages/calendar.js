/* @flow */

import React, { Component, Fragment } from 'react';
import styled, { css } from 'styled-components';
import moment from 'moment';
import RBC from 'react-big-calendar';
import { Map, Set } from 'immutable';
import { Form } from 'react-final-form';
import {
  Alert,
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
import NLPTabs from '../components/nlp-tabs';

const required = value => (value ? undefined : 'Required');
const NATURAL_LANGUAGE_CATEGORY_NAME = 'Natural Language';

RBC.setLocalizer(RBC.momentLocalizer(moment));

const WideModal = styled(Modal)`
  min-width: 80vw;
`;

const Content = styled.pre`
  white-space: pre-wrap;
  max-height: 300px;
`;

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
    backgroundColor: textToColor(event.isNLP ? NATURAL_LANGUAGE_CATEGORY_NAME : event.category),
  },
});

type Props = {};
type State = {
  events: Map<string, any>,
  nlpEvents: Map<string, any>,
  loading: bool,
  newCategoryColor?: string,
  hiddenCategories: Set<string>,
  selected: any,
};

class CalendarPage extends Component<Props, State> {
  state = {
    events: new Map(),
    nlpEvents: new Map(),
    loading: true,
    newCategoryColor: null,
    hiddenCategories: new Set(storage.get('hiddenCategories')),
  };

  componentDidMount() {
    const eventsRef = database.ref('events');
    eventsRef.on('value', (snapshot) => {
      const events = new Map(snapshot.val()).mapEntries(([id, event]) => [id, {
        ...event,
        start: moment.utc(event.start).toDate(),
        end: moment.utc(event.end).toDate(),
        id,
      }]);

      this.setState({ events, loading: false });
    });

    const docRef = database.ref('documents');
    docRef.on('value', (snapshot) => {
      const nlpEvents = new Map(snapshot.val()).mapEntries(([id, doc]) => [id, {
        ...doc,
        isNLP: true,
        allDay: true,
        start: moment.utc(doc.date).toDate(),
        end: moment.utc(doc.date).toDate(),
        id,
      }]);

      this.setState({ nlpEvents, loading: false });
    });

    this.dbRefs = [eventsRef, docRef];
  }

  componentWillUnmount() {
    this.dbRefs.forEach(ref => ref.off());
  }

  get calendarEvents() {
    const { nlpEvents, hiddenCategories, events } = this.state;

    return events
      .filter(({ category }) => !hiddenCategories.has(category || null))
      .merge(hiddenCategories.has(NATURAL_LANGUAGE_CATEGORY_NAME) ? {} : nlpEvents)
      .toArray();
  }

  getCategories = (selected: ?string) => this.state.events.toSet()
    .map(event => event.category || null)
    .add(selected || null)
    .remove(null)
    .sort()
    .toArray();

  dbRefs: Array<any> = [];

  selectSlot = (slot) => {
    const { start, end, action } = slot;
    if (['click', 'select'].includes(action)) {
      this.setState({
        selected: {
          start,
          end,
          allDay: moment(start).startOf('day').isSame(start) &&
            moment(end).startOf('day').isSame(end),
        },
      });
    }
  }

  selectEvent = (event) => {
    this.setState({ selected: event });
  }

  deleteEvent = () => {
    database.ref('events').child(this.state.selected.id).remove();

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
    this.setState({ selected: null });
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
          {values.title || <i>(New Event)</i>}
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
    const { selected, loading, hiddenCategories } = this.state;

    if (loading) {
      return (
        <FullPage>
          <h2><Loading text="Loading Calendar..." /></h2>
        </FullPage>
      );
    }

    const categories = [NATURAL_LANGUAGE_CATEGORY_NAME, ...this.getCategories()];

    return (
      <FullPage>
        <BigCalendar
          events={this.calendarEvents}
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
        {selected && selected.isNLP && (
          <WideModal isOpen toggle={this.closeModal}>
            <ModalHeader toggle={this.closeModal}>
              {selected.title || <i>(No title)</i>}
            </ModalHeader>
            <ModalBody>
              {selected.date && (
                <Fragment>
                  <h4>Date</h4>
                  <Content>{moment.utc(selected.date).format('LLL')}</Content>
                </Fragment>
              )}
              {selected.contentType && (
                <Fragment>
                  <h4>Content Type</h4>
                  <Content>{selected.contentType}</Content>
                </Fragment>
              )}
              {selected.keyTopics && selected.keyTopics.length && (
                <Fragment>
                  <h4>Key Topics</h4>
                  <Content>{selected.keyTopics.join(', ')}</Content>
                </Fragment>
              )}
              {selected.headline && (
                <Fragment>
                  <h4>Headline</h4>
                  <Content>{selected.headline}</Content>
                </Fragment>
              )}
              <h4>Content</h4>
              <Content>{selected.content}</Content>
              {!selected.results && !selected.error && (
                <h4><Loading text="Processing results..." /></h4>
              )}
              {!!selected.results && (
                <Fragment>
                  <h4>Results</h4>
                  <NLPTabs results={selected.results} />
                </Fragment>
              )}
              {!!selected.error && (
                <Alert color="danger">
                  <h4 className="alert-heading">Error</h4>
                  <p>{selected.error}</p>
                </Alert>
              )}
            </ModalBody>
          </WideModal>
        )}
        {selected && !selected.isNLP && (
          <Form
            initialValues={selected}
            onSubmit={this.saveEvent}
            render={this.renderEventEditor}
          />
        )}
      </FullPage>
    );
  }
}

export default CalendarPage;
