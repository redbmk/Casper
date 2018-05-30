/* @flow */

import React from 'react';
import { withState } from 'recompose';
import uuid from 'uuid';
import {
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Card,
  CardTitle,
  CardLink,
  CardText,
  Row,
  Col,
} from 'reactstrap';
import { round, capitalize } from 'lodash';

const PRECISION = 3;

type Sentiment = {
  magnitude: number,
  score: number,
};

type Text = {
  beginOffset: number,
  content: string,
};

type Result = {
  entities: Array<{
    name: string,
    salience: number,
    sentiment: Sentiment,
    metadata: { wikipedia_url?: string },
    mentions: Array<{
      sentiment: Sentiment,
      text: Text,
      type: string,
    }>,
  }>,
  documentSentiment: Sentiment,
  sentences: Array<{
    sentiment: Sentiment,
    text: Text,
  }>,
};

type SentimentRowProps = {
  sentiment: Sentiment,
  text: Text | string,
  isHeader?: boolean,
};

const SentimentRow = ({ isHeader, sentiment, text }: SentimentRowProps) => {
  let scoreBg = 'bg-warning';
  if (sentiment.score < -0.25) {
    scoreBg = 'bg-danger';
  } else if (sentiment.score > 0.25) {
    scoreBg = 'bg-success';
  }

  scoreBg += ' text-white';

  const textValue = typeof text === 'object' ? text.content : text;

  return (
    <Row className={isHeader ? 'py-3' : 'pb-3'}>
      <Col xs={6} md={8} lg={9} className="d-flex">
        {isHeader ? (
          <h5 className="m-0 align-self-end">{textValue}</h5>
        ) : (
          <small>{textValue}</small>
        )}
      </Col>
      <Col xs={6} md={4} lg={3}>
        {isHeader && (
          <Row className="px-3 text-center">
            <Col><small>Score</small></Col>
            <Col><small>Magnitude</small></Col>
          </Row>
        )}
        <Row className="px-3">
          <Col className={scoreBg}>{round(sentiment.score, PRECISION)}</Col>
          <Col className="bg-info text-white">{round(sentiment.magnitude, PRECISION)}</Col>
        </Row>
      </Col>
    </Row>
  );
};

SentimentRow.defaultProps = {
  isHeader: false,
};

type Props = {
  results: Result,
  activeTab: string,
  setActiveTab: (tab: string) => void,
};

type TabLinkProps = {
  name: string,
};

const NLPTabs = ({ activeTab, setActiveTab, results }: Props) => {
  const TabLink = ({ name }: TabLinkProps) => (
    <NavItem>
      <NavLink
        className={activeTab === name ? 'active' : ''}
        onClick={() => setActiveTab(name)}
      >
        {capitalize(name)}
      </NavLink>
    </NavItem>
  );

  const {
    entities,
    documentSentiment,
    sentences,
    categories,
  } = results instanceof Array ? results[0] : results;

  return (
    <div>
      <Nav tabs>
        <TabLink name="entities" />
        <TabLink name="sentiment" />
        <TabLink name="categories" />
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId="entities">
          <Row className="pt-3">
            {entities.map(entity => (
              <Col className="pb-3" key={uuid()} lg={6}>
                <Card body className="h-100">
                  <CardTitle>{entity.name}</CardTitle>
                  <div>
                    <strong>Sentiment:</strong>
                    <small>
                      <strong className="pl-1">Magnitude</strong> {round(entity.sentiment.magnitude, PRECISION)}
                      <strong className="pl-1">Score</strong> {round(entity.sentiment.score, PRECISION)}
                    </small>
                  </div>
                  <div>
                    <strong>Salience:</strong>
                    <small className="pl-1">{round(entity.salience, PRECISION)}</small>
                  </div>
                  {entity.metadata.wikipedia_url && (
                    <CardLink href={entity.metadata.wikipedia_url} target="_blank">
                      Wikipedia Article
                    </CardLink>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tabId="sentiment">
          <SentimentRow isHeader sentiment={documentSentiment} text="Entire Document" />
          {sentences.map(sentence => <SentimentRow key={uuid()} {...sentence} />)}
        </TabPane>
        <TabPane tabId="categories">
          {categories.length ? (
            <Row className="pt-3">
              {categories.map(category => (
                <Col key={category.name} className="pb-3" lg={6}>
                  <Card body className="h-100">
                    <CardTitle>{category.name}</CardTitle>
                    <div>
                      <strong>Confidence:</strong>
                      <small className="pl-1">{round(category.confidence, PRECISION)}</small>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <h4 className="pt-3">No categories found.</h4>
          )}
          <a
            href="https://cloud.google.com/natural-language/docs/categories"
            target="documentation"
          >
            See a complete list of content categories.
          </a>
        </TabPane>
      </TabContent>
    </div>
  );
};

export default withState(
  'activeTab',
  'setActiveTab',
  'entities',
)(NLPTabs);
