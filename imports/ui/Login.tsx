import { History } from 'history';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { Player, Room, RoomsCollection } from '../api/room';
function joinRoom(roomName: string, username: string, history: History) {
  if (!roomName || !username) {
    alert('房间名或用户名为空');
    return;
  }
  const room = RoomsCollection.findOne({ roomName });
  if (!room) {
    RoomsCollection.insert(new Room(roomName, username));
    Session.set('isGaming', true);
    Session.set('username', username);
    Session.set('roomName', roomName);
    sessionStorage.setItem('isGaming', 'true');
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('roomName', roomName);
    history.push('/game');
    return;
  } else {
    if (room.players.filter((player) => player.username === username).length) {
      alert('名称已被占用');
      return;
    }
    const player = new Player(username, room.initial);

    if (room.stage !== Room.Stage.NOT_GAMING) {
      player.status = Player.PlayerStatus.FOLDED;
    }
    room.players.push(player);
    RoomsCollection.update({ _id: room._id }, room);
    Session.set('isGaming', true);
    Session.set('username', username);
    Session.set('roomName', roomName);
    sessionStorage.setItem('isGaming', 'true');
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('roomName', roomName);
    return;
  }
}
export const Login = () => {
  const [roomName, setRoomName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const isGaming = useTracker(() => Session.get('isGaming'));
  const history = useHistory();

  useEffect(() => {
    if (isGaming) {
      history.push('/game');
    }
  });
  return (
    <div className="background">
      <div className="container">
        <h1 className="title">
          <div className="main">Texas Hold'em</div>
          <div className="deco">
            <span className="black">♠️</span>
            <span className="red">♥️</span>
            <span className="black">♣️</span>
            <span className="red">♦️</span>
          </div>
        </h1>

        <form>
          <div className="form-item">
            <input
              type="text"
              id="room-input"
              placeholder="Room Name"
              value={roomName}
              onInput={(e) => setRoomName((e.target as HTMLInputElement).value)}
            />
          </div>
          <div className="form-item">
            <input
              type="text"
              id="username"
              placeholder="Username"
              value={username}
              onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
            />
          </div>
          <button
            id="join"
            onClick={(e) => {
              e.preventDefault();
              joinRoom(roomName, username, history);
            }}
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
};
