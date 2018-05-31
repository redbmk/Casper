/* @flow */

import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import {
  Alert,
  Button,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { Form } from 'react-final-form';
import { Map } from 'immutable';
import moment from 'moment';
import { diff } from 'deep-object-diff';

import Loading from '../components/loading';
import Field from '../components/field';
import { database } from '../firebase';
import NLPTabs from '../components/nlp-tabs';

const WideModal = styled(Modal)`
  min-width: 80vw;
`;

const Content = styled.pre`
  white-space: pre-wrap;
  max-height: 300px;
`;

const EntryRow = styled.tr`
  cursor: pointer;
  td {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const required = value => (value ? undefined : 'Required');

type Props = {};
type State = {
  editing: any,
  loading: bool,
  deleting: bool,
  documents: Map<string, any>,
};

export default class NaturalLanguageProcessingPage extends Component<Props, State> {
  state = {
    loading: true,
    editing: null,
    deleting: false,
    documents: new Map(),
  };

  componentDidMount() {
    const docRef = database.ref('documents');
    docRef.on('value', (snapshot) => {
      this.setState({ documents: new Map(snapshot.val()), loading: false });
    });

    const metadataRef = database.ref('metadata');
    metadataRef.on('value', (snapshot) => {
      const { contentTypes, keyTopics } = snapshot.val();
      this.setState({ contentTypes, keyTopics });
    });

    this.dbRefs = [docRef, metadataRef];
  }

  componentWillUnmount() {
    this.dbRefs.forEach(ref => ref.off());
  }

  dbRefs: Array<any> = [];

  openEditor = () => {
    this.setState({ editing: true });
  }

  closeEditor = () => {
    this.setState({ editing: null });
  }

  cancelDelete = () => {
    this.setState({ deleting: false });
  }

  saveEntry = async (doc, form) => {
    if (this.state.editing === true) {
      database.ref('documents').push().set(doc);
    } else if (this.state.editing) {
      const changes = new Map(diff(form.getState().initialValues, doc))
        .map(value => (value == null ? null : value))
        .toJS();

      database.ref('documents').child(this.state.editing).update(changes);
    }
    this.closeEditor();
  }

  deleteEntry = async () => {
    this.setState({ deleting: true });
  }

  actuallyDeleteEntry = async () => {
    database.ref('documents').child(this.state.editing).remove();
    this.setState({ editing: null, deleting: false });
  }

  renderEntryForm = ({ handleSubmit, invalid, values }) => {
    const isNew = this.state.editing === true;

    return (
      <WideModal isOpen toggle={this.closeEditor} autoFocus={!isNew}>
        <form onSubmit={handleSubmit}>
          <ModalHeader toggle={this.closeEditor}>
            <Field name="title">
              {({ input: { value } }) => value || (isNew && <small>Add a new entry</small>)}
            </Field>
          </ModalHeader>
          <ModalBody>
            <Field name="title" autoFocus={isNew} validate={required} />
            <Field name="headline" type="textarea" rows={3} />
            <Field
              name="date"
              type="date"
              time
              parse={value => value && moment.utc(value).format()}
              format={value => value && moment.utc(value).toDate()}
            />
            <Field
              name="contentType"
              type="select"
              options={this.state.contentTypes}
              parse={value => value && value[0]}
              format={value => value && [value]}
              clearButton
            />
            <Field
              name="keyTopics"
              type="select"
              options={this.state.keyTopics}
              multiple
              clearButton
            />
            {isNew ? (
              <Field
                name="content"
                type="textarea"
                rows={20}
                validate={required}
                placeholder="Enter text to process"
              />
            ) : (
              <Fragment>
                <h4>Content</h4>
                <Content>{values.content}</Content>
                {!values.results && !values.error && (
                  <h4><Loading text="Processing results..." /></h4>
                )}
                {!!values.results && (
                  <Fragment>
                    <h4>Results</h4>
                    <NLPTabs results={values.results} />
                  </Fragment>
                )}
                {!!values.error && (
                  <Alert color="danger">
                    <h4 className="alert-heading">Error</h4>
                    <p>{values.error}</p>
                  </Alert>
                )}
              </Fragment>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" disabled={invalid}>Save</Button>
            {!isNew && (
              <Button
                color="danger"
                onClick={this.deleteEntry}
                disabled={!values.error && !values.results}
              >
                Delete
              </Button>
            )}
            <Button color="secondary" onClick={this.closeEditor}>Cancel</Button>
          </ModalFooter>
        </form>
      </WideModal>
    );
  };

  renderDeleteConfirmation = () => {
    const doc = this.state.documents.get(this.state.editing);

    return (
      <Modal isOpen toggle={this.cancelDelete}>
        <ModalHeader toggle={this.cancelDelete}>Delete {doc.title}?</ModalHeader>
        <ModalBody>
          Are you sure you want to delete this entry? This is a permanent change.
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={this.actuallyDeleteEntry}>
            Yes, really delete
          </Button>
          <Button color="secondary" onClick={this.cancelDelete}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }

  renderDocStatus = (doc) => {
    if (doc.error) return <span className="text-danger">Error</span>;
    if (doc.results) return <span className="text-success">Success</span>;
    return <Loading text="Processing..." />;
  }

  render() {
    const {
      loading,
      editing,
      documents,
      deleting,
    } = this.state;

    return (
      <article className="post-full">
        <header className="post-full-header">
          <h1>Natural Language Processing</h1>
        </header>
        <Table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Content Type</th>
              <th>Key Topics</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {loading ? (
                  <h5><Loading text="Loading..." /></h5>
                ) : (
                  <Button color="primary" onClick={this.openEditor}>Add New</Button>
                )}
              </td>
              <td />
              <td />
              <td />
            </tr>
            {documents.sortBy(doc => doc.date).reverse().entrySeq().map(([id, doc]) => (
              <EntryRow key={id} onClick={() => this.setState({ editing: id })}>
                <td>{doc.date && moment(doc.date).format('LLL')}</td>
                <td>{doc.title}</td>
                <td>{doc.contentType}</td>
                <td>{doc.keyTopics && doc.keyTopics.join(', ')}</td>
                <td>{this.renderDocStatus(doc)}</td>
              </EntryRow>
            ))}
          </tbody>
        </Table>
        {deleting && this.renderDeleteConfirmation()}
        {editing && (
          <Form
            initialValues={documents.get(editing) || { date: moment.utc().format() }}
            onSubmit={this.saveEntry}
            render={this.renderEntryForm}
          />
        )}
      </article>
    );
  }
}
