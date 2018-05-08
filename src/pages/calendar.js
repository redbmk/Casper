/* @flow */

import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import RBC from 'react-big-calendar';
import GoogleButton from 'react-google-button';
import { Map } from 'immutable';
import 'react-big-calendar/lib/css/react-big-calendar.css';

RBC.setLocalizer(RBC.momentLocalizer(moment));

const FullPage = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const SignOutButton = styled.div`
  height: 50px;
  background-color: rgb(255, 255, 255);
  color: rgba(0, 0, 0, 0.54);
  height: 50px;
  width: 240px;
  border: none;
  text-align: center;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 2px 4px 0px;
  font-size: 16px;
  line-height: 48px;
  display: block;
  border-radius: 1px;
  transition: background-color 0.218s, border-color 0.218s, box-shadow 0.218s;
  cursor: pointer;

  :hover {
    box-shadow: rgba(66, 133, 244, 0.3) 0px 0px 3px 3px;
  }
`;

const ProfileImage = styled.div`
  display: block;
  margin-top: 1px;
  margin-left: 1px;
  height: 48px;
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  float: left;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
`;

const BigCalendar = styled(RBC)`
  flex: 1;
  min-height: 0;
  margin-top: 2em;
`;

const { HTMLScriptElement } = window;

const getDateRange = (date, type) => {
  switch (type) {
    case 'month':
    case 'week':
    case 'day':
      return [moment(date).startOf(type).subtract(1, type), moment(date).endOf(type).add(1, type)];
    default:
      return [moment(date).subtract(1, 'month'), moment(date).add(2, 'months')];
  }
};

const toISOString = date => date.toISOString();

class CalendarPage extends Component {
  state = {
    loading: true,
  };

  componentDidMount() {
    if (window.gapi) {
      this.handleClientLoad();
      return;
    }

    const script = document.createElement('script');
    this.script = script;

    script.onload = () => {
      script.onload = () => {};
      this.handleClientLoad();
    };

    script.onreadystatechange = () => {
      if (script.readyState === 'complete') script.onload();
    };

    script.async = true;
    script.defer = true;
    script.src = 'https://apis.google.com/js/api.js';

    document.body.appendChild(script);
  }

  componentWillUnmount() {
    if (this.script) this.script.remove();
  }

  script: ?HTMLScriptElement;

  handleClientLoad() {
    const { gapi } = window;
    gapi.load('client:auth2', async () => {
      await gapi.client.init({
        apiKey: process.env.API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        clientId: process.env.CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar',
      });

      this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
  }

  updateSigninStatus = async (isSignedIn) => {
    if (isSignedIn) {
      await this.loadEvents();
    }

    const profile = isSignedIn
      ? window.gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile()
      : null;

    this.setState({
      loading: false,
      profile,
    });
  }

  signIn = async () => {
    try {
      await window.gapi.auth2.getAuthInstance().signIn();
      this.updateSigninStatus(true);
    } catch (ignore) {
      // ignore
    }
  }

  signOut = async () => {
    await window.gapi.auth2.getAuthInstance().signOut();
    this.updateSigninStatus(false);
  }

  loadEvents = async (date = new Date(), type = 'month') => {
    try {
      const [timeMin, timeMax] = getDateRange(date, type).map(toISOString);

      const { result: { items } } = await window.gapi.client.calendar.events.list({
        calendarId: process.env.CALENDAR_ID,
        timeMin,
        timeMax,
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });

      this.setState({
        events: items.reduce(
          (events, event) => events.set(event.id, {
            start: moment(event.start.date || event.start.dateTime).toDate(),
            end: moment(event.end.date || event.end.dateTime).toDate(),
            allDay: !event.start.dateTime,
            title: event.summary,
            id: event.id,
          }),
          this.state.events || Map(),
        ),
        error: null,
      });
    } catch (reason) {
      this.setState({
        events: Map(),
        error: 'This Google account does not have access to the calendar',
      });
    }
  }

  render() {
    const { profile, loading, error } = this.state;

    if (loading) return <h2><i className="fa fa-spin fa-spinner" /></h2>;

    if (!profile) {
      return (
        <Fragment>
          <GoogleButton onClick={this.signIn} />
          <h2>You must be signed in to your Google account to access the calendar</h2>
        </Fragment>
      );
    }

    const { events } = this.state;

    return (
      <FullPage>
        <SignOutButton title={`Signed in as ${profile.getName()}`} onClick={this.signOut}>
          <ProfileImage>
            <img alt={profile.getName()} src={profile.getImageUrl()} />
          </ProfileImage>
          <span>Sign out from Google</span>
        </SignOutButton>
        {error ? (
          <h2>{error}</h2>
        ) : (
          <BigCalendar
            events={events && events.toSet().toArray()}
            selectable
            popup
            defaultDate={new Date()}
            onNavigate={this.loadEvents}
          />
        )}
      </FullPage>
    );
  }
}

export default CalendarPage;
