import { Meteor } from 'meteor/meteor';
import { RoomsCollection } from '../imports/api/room';

Meteor.startup(() => {
  RoomsCollection.remove({});
});