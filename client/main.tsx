import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import React from 'react';
import { render } from 'react-dom';
import { App } from '/imports/ui/App';

Meteor.startup(() => {
  render(<App />, document.getElementById('react-target'));
  Session.setDefault('isGaming', !!sessionStorage.getItem('isGaming'));
  Session.setDefault('username', sessionStorage.getItem('username'));
  Session.setDefault('roomName', sessionStorage.getItem('roomName'));
});
