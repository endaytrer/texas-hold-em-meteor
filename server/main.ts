import { Meteor } from 'meteor/meteor';
import { RoomsCollection } from '../imports/api/room';
import { User, UsersCollection } from '/imports/api/user';

Meteor.startup(() => {
  RoomsCollection.remove({});
  UsersCollection.remove({});
});
Meteor.onConnection((connection) => {
  connection.onClose(() => {
    console.log(
      `connection ${connection.id} closed from client ${connection.clientAddress}`
    );
    const u = UsersCollection.findOne({ connectionId: connection.id });
    if (u) {
      const { username, room } = u;
      const r = RoomsCollection.findOne({ roomName: room });
      if (r) {
        r.players = r.players.filter((player) => player.username !== username);
        if (r.players.length === 0) {
          RoomsCollection.remove({ _id: r._id });
        } else RoomsCollection.update({ _id: r._id }, r);
      }
      UsersCollection.remove({ _id: u._id });
    }
  });
  const user = new User(connection.id);
  console.log(
    `connection ${connection.id} established from client ${connection.clientAddress}`
  );
  UsersCollection.insert(user);
});
Meteor.methods({
  login: function (username, roomName) {
    const connectionId = this.connection?.id;
    const user = UsersCollection.findOne({
      connectionId: connectionId,
    });
    if (user) {
      User.joinRoom(user, username, roomName);
      UsersCollection.update({ _id: user._id }, user);
    }
  },
});
