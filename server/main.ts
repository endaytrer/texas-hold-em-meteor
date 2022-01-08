import { Meteor } from 'meteor/meteor';
import { Room, RoomsCollection } from '../imports/api/room';
import { User, UsersCollection } from '/imports/api/user';

function baseLogOut(connection: Meteor.Connection) {
  const u = UsersCollection.findOne({ connectionId: connection.id });
  if (u) {
    const { username, roomName } = u;
    console.log(
      `${new Date().toLocaleString()}\t User ${username}@${
        connection.id
      } left room ${roomName}`
    );
    const r = RoomsCollection.findOne({ roomName });
    if (r) {
      r.players = r.players.filter((player) => player.username !== username);
      if (r.players.length === 1) {
        r.stage = Room.Stage.NOT_GAMING;
      }
      if (r.players.length === 0) {
        RoomsCollection.remove({ _id: r._id });
        console.log(
          `${new Date().toLocaleString()}\t Room ${roomName} dismissed.`
        );
      } else RoomsCollection.update({ _id: r._id }, r);
    }
    UsersCollection.remove({ _id: u._id });
  }
}
Meteor.startup(() => {
  RoomsCollection.remove({});
  UsersCollection.remove({});
});

Meteor.onConnection((connection) => {
  connection.onClose(() => {
    baseLogOut(connection);
  });
});
Meteor.methods({
  login: function (username, roomName) {
    const connectionId = this.connection?.id;
    if (connectionId) {
      UsersCollection.insert(new User(connectionId, username, roomName));
    }
    console.log(
      `${new Date().toLocaleString()}\t User ${username}@${connectionId} joined room ${roomName}`
    );
  },
  logout: function () {
    if (this.connection) baseLogOut(this.connection);
  },
});
Meteor.setInterval(function () {
  RoomsCollection.find().forEach((room) => {
    const staticPlayers = room.players.slice();
    for (let player of staticPlayers) {
      if (!UsersCollection.findOne({ username: player.username })) {
        console.log(
          `${new Date().toLocaleString()}\t Cleaned user ${player.username}`
        );
        room.players = room.players.filter(
          (ele) => ele.username !== player.username
        );
      }
    }
    if (room.players.length === 0) {
      RoomsCollection.remove({ _id: room._id });
      console.log(
        `${new Date().toLocaleString()}\t Room ${room.roomName} dismissed.`
      );
    } else RoomsCollection.update({ _id: room._id }, room);
  });
}, 5000);
