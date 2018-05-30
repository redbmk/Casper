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

import Loading from '../components/loading';
import Field from '../components/field';
import { firestore } from '../firebase';
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
  editing: bool,
  loading: bool,
  deleting: bool,
  viewing?: any,
  documents: Map<string, any>,
};

export default class NaturalLanguageProcessingPage extends Component<Props, State> {
  state = {
    loading: true,
    editing: false,
    deleting: false,
    documents: new Map(),
  };

  componentDidMount() {
    let documents = new Map();

    this.documentListenerUnsubscribe = firestore.collection('documents').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(({ type, doc }) => {
        if (type === 'removed') {
          documents = documents.delete(doc.id);
        } else {
          documents = documents.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          });
        }
      });

      this.setState({ documents, loading: false });
    });
  }

  componentWillUnmount() {
    if (this.documentListenerUnsubscribe) this.documentListenerUnsubscribe();
  }

  documentListenerUnsubscribe: ?(() => void);

  closeViewer = () => {
    this.setState({ viewing: null });
  }

  openEditor = () => {
    this.setState({ editing: true });
  }

  closeEditor = () => {
    this.setState({ editing: false });
  }

  cancelDelete = () => {
    this.setState({ deleting: false });
  }

  addEntry = async (doc) => {
    firestore.collection('documents').add({
      ...doc,
      uploadedAt: moment.utc().format(),
    });
    this.closeEditor();
  }

  deleteEntry = async () => {
    this.setState({ deleting: true });
  }

  actuallyDeleteEntry = async () => {
    firestore.collection('documents').doc(this.state.viewing).delete();
    this.setState({ viewing: null, deleting: false });
  }

  renderEntryForm = ({ handleSubmit, invalid }) => (
    <WideModal isOpen toggle={this.closeEditor} autoFocus={false}>
      <form onSubmit={handleSubmit}>
        <ModalHeader toggle={this.closeEditor}>
          <Field name="title">
            {({ input: { value } }) => value || <small>Add a new entry</small>}
          </Field>
        </ModalHeader>
        <ModalBody>
          <Field name="title" autoFocus validate={required} />
          <Field
            name="content"
            label="Text"
            type="textarea"
            rows={20}
            validate={required}
            placeholder="Enter text to process"
          />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" disabled={invalid}>Save</Button>
          <Button color="secondary" onClick={this.closeEditor}>Cancel</Button>
        </ModalFooter>
      </form>
    </WideModal>
  );

  renderDetails = () => {
    const doc = this.state.documents.get(this.state.viewing);

    return (
      <WideModal isOpen toggle={this.closeViewer}>
        <ModalHeader toggle={this.closeViewer}>{doc.title}</ModalHeader>
        <ModalBody>
          <h4>Content</h4>
          <Content>{doc.content}</Content>
          {!doc.results && !doc.error && (
            <h4><Loading text="Processing results..." /></h4>
          )}
          {!!doc.results && (
            <Fragment>
              <h4>Results</h4>
              <NLPTabs results={doc.results} />
            </Fragment>
          )}
          {!!doc.error && (
            <Alert color="danger">
              <h4 className="alert-heading">Error</h4>
              <p>{doc.error}</p>
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            onClick={this.deleteEntry}
            disabled={!doc.error && !doc.results}
          >
            Delete
          </Button>
          <Button color="secondary" onClick={this.closeViewer}>Close</Button>
        </ModalFooter>
      </WideModal>
    );
  }

  renderDeleteConfirmation = () => {
    const doc = this.state.documents.get(this.state.viewing);

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
    return <Loading text="processing..." />;
  }

  render() {
    const {
      loading,
      editing,
      documents,
      viewing,
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
              <th>Title</th>
              <th>Date Uploaded</th>
              <th>Snippet</th>
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
            {documents.sortBy(doc => doc.uploadedAt).reverse().toArray().map(doc => (
              <EntryRow key={doc.id} onClick={() => this.setState({ viewing: doc.id })}>
                <td>{doc.title}</td>
                <td>{moment(doc.uploadedAt).format('LLL')}</td>
                <td>{doc.content}</td>
                <td>{this.renderDocStatus(doc)}</td>
              </EntryRow>
            ))}
          </tbody>
        </Table>
        {viewing && this.renderDetails()}
        {deleting && this.renderDeleteConfirmation()}
        {editing && (
          <Form
            onSubmit={this.addEntry}
            render={this.renderEntryForm}
          />
        )}
      </article>
    );
  }
}
