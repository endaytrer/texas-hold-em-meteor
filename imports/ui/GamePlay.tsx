import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { Player, Room, RoomsCollection } from '../api/room';
import { Card as CardObject } from '../logic/Card';
import { check, fold, raise, startGame } from '../logic/Game';
import { Card } from './components/Card';
import { PlayerDisplay } from './components/PlayerDisplay';
import './GamePlay.css';

const cardCombination = [
  'High Card',
  'One Pair',
  'Two Pairs',
  'Set',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush',
];
function checkText(
  stageBet: number | undefined,
  userBetted: number | undefined,
  userMoney: number | undefined
) {
  if (
    stageBet === undefined ||
    userBetted === undefined ||
    userMoney === undefined
  ) {
    return 'Check';
  }
  if (userBetted + userMoney <= stageBet) {
    return 'All In';
  }
  if (userBetted < stageBet) {
    return `Call \$${stageBet - userBetted}`;
  }
  return 'Check';
}
function raiseText(
  stageBet: number | undefined,
  userBetted: number | undefined,
  userMoney: number | undefined,
  userToBet: number | undefined
) {
  if (
    stageBet === undefined ||
    userBetted === undefined ||
    userMoney === undefined ||
    userToBet === undefined
  ) {
    return 'Raise';
  }
  if (userToBet >= userMoney) {
    return 'All In';
  }
  if (stageBet === 0) {
    return 'Bet';
  }
  return 'Raise';
}
export const GamePlay = () => {
  const history = useHistory();
  const roomName = useTracker(() => Session.get('roomName'));
  const username = useTracker(() => Session.get('username'));
  const isGaming = useTracker(() => Session.get('isGaming'));
  const quitGame = () => {
    if (room) {
      room.players = room.players.filter(
        (player) => player.username !== username
      );
      if (room.players.length === 0) {
        RoomsCollection.remove({ _id: room._id });
      } else RoomsCollection.update({ _id: room._id }, room);
    }
  };
  useEffect(() => {
    if (!isGaming) {
      history.push('/');
    }
  });
  const [tempInitial, setTempInitial] = useState(100);
  const [tempSmall, setTempSmall] = useState(1);
  const [tempBig, setTempBig] = useState(2);
  const [tempBet, setTempBet] = useState(0);
  const room = useTracker(() => RoomsCollection.findOne({ roomName }));
  let isHost = Room.ownerName(room) === username;
  let players: Player[] | undefined = room?.players;
  let self: Player | undefined = players?.find(
    (player) => player?.username === username
  );
  let isDealer = room?.players[room.dealer]?.username === username;
  let isSb = room?.players[Room.sb(room)]?.username === username;
  let isBb = room?.players[Room.bb(room)]?.username === username;
  let isPlayer = room?.players[room.nowTurn]?.username === username;
  return (
    <div className="game-play">
      <div className="navigator">
        <div className="player-info">
          {isHost && <div className="host-label">H</div>}
          <div>{username}</div>
        </div>
        <h3>{roomName}</h3>
        <div className="buttons">
          {isHost && (
            <div>
              <button id="setting-button">
                <svg
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="3251"
                  width="25"
                  height="25"
                >
                  <path
                    d="M884.7 405.4l-27.5-9.8c-8.9-3.2-15.9-9.8-19.5-18.5s-3.4-18.3 0.7-26.9l12.5-26.3c20.8-43.8 12.1-94.3-22.2-128.6s-84.8-43-128.6-22.2l-26.3 12.5c-8.6 4.1-18.1 4.3-26.9 0.7-8.8-3.6-15.4-10.6-18.5-19.5l-9.8-27.5C602.3 93.6 560.5 64.1 512 64.1c-48.5 0-90.3 29.5-106.6 75.2l-9.8 27.5c-3.2 8.9-9.8 15.9-18.5 19.5-8.8 3.6-18.3 3.4-26.9-0.7l-26.3-12.5c-43.8-20.8-94.3-12.1-128.6 22.2s-43 84.8-22.2 128.6l12.5 26.3c4.1 8.6 4.3 18.1 0.7 26.9-3.6 8.8-10.6 15.4-19.5 18.5l-27.5 9.8C93.6 421.7 64.1 463.5 64.1 512s29.5 90.3 75.2 106.6l27.5 9.8c8.9 3.2 15.9 9.8 19.5 18.5 3.6 8.8 3.4 18.3-0.7 26.9l-12.5 26.3c-20.8 43.8-12.1 94.3 22.2 128.6s84.8 43 128.6 22.2l26.3-12.5c8.6-4.1 18.1-4.3 26.9-0.7s15.4 10.6 18.5 19.5l9.8 27.5c16.3 45.7 58.1 75.2 106.6 75.2 48.5 0 90.3-29.5 106.6-75.2l9.8-27.5c3.2-8.9 9.8-15.9 18.5-19.5 8.8-3.6 18.3-3.4 26.9 0.7l26.3 12.5c15.8 7.5 32.5 11.2 49 11.2 29.1 0 57.7-11.5 79.6-33.4 34.3-34.3 43-84.8 22.2-128.6l-12.5-26.3c-4.1-8.6-4.3-18.1-0.7-26.9 3.6-8.8 10.6-15.4 19.5-18.5l27.5-9.8c45.7-16.3 75.2-58.1 75.2-106.6s-29.5-90.3-75.2-106.6z m-26.9 137.8l-27.5 9.8c-30.1 10.7-54.4 33.8-66.6 63.3s-11.4 63 2.3 91.9l12.5 26.3c9.3 19.6-2.6 33.8-6.5 37.7-3.9 3.9-18.1 15.8-37.7 6.5L708 766.2c-28.9-13.7-62.3-14.6-91.9-2.3-29.5 12.2-52.6 36.5-63.3 66.6L543 858c-7.3 20.4-25.7 22-31.2 22s-24-1.6-31.2-22l-9.8-27.5c-10.7-30.1-33.8-54.4-63.3-66.6-13.9-5.7-28.6-8.6-43.3-8.6-16.6 0-33.3 3.7-48.6 10.9l-26.3 12.5c-19.6 9.3-33.8-2.6-37.7-6.5-3.9-3.9-15.8-18.1-6.5-37.7l12.5-26.3c13.7-28.9 14.6-62.3 2.3-91.9-12.2-29.5-36.5-52.6-66.6-63.3l-27.5-9.8c-20.4-7.3-22-25.7-22-31.2s1.6-24 22-31.2l27.5-9.8c30.1-10.7 54.4-33.8 66.6-63.3s11.4-63-2.3-91.9l-12.5-26.3c-9.3-19.6 2.6-33.8 6.5-37.7 3.9-3.9 18.1-15.8 37.7-6.5l26.3 12.5c28.9 13.7 62.3 14.6 91.9 2.3 29.5-12.2 52.6-36.5 63.3-66.6l9.8-27.5c7.3-20.4 25.7-22 31.2-22s24 1.6 31.2 22l9.8 27.5c10.7 30.1 33.8 54.4 63.3 66.6 29.5 12.2 63 11.4 91.9-2.3l26.3-12.5c19.6-9.3 33.8 2.6 37.7 6.5 3.9 3.9 15.8 18.1 6.5 37.7L766 315.8c-13.7 28.9-14.6 62.3-2.3 91.9 12.2 29.5 36.5 52.6 66.6 63.3l27.5 9.8c20.4 7.3 22 25.7 22 31.2s-1.5 24-22 31.2z"
                    p-id="3252"
                  ></path>
                  <path
                    d="M512 320.3c-105.7 0-191.7 86-191.7 191.7s86 191.7 191.7 191.7 191.7-86 191.7-191.7-86-191.7-191.7-191.7z m0 303.4c-61.6 0-111.7-50.1-111.7-111.7S450.4 400.3 512 400.3 623.7 450.4 623.7 512 573.6 623.7 512 623.7z"
                    p-id="3253"
                  ></path>
                </svg>
              </button>
              <div className="setting-panel">
                <h3>Settings</h3>
                <div>
                  <div className="input-container">
                    <label htmlFor="initial-input">Initial Money: </label>
                    <input
                      id="initial-input"
                      type="number"
                      value={tempInitial}
                      onInput={(e) =>
                        setTempInitial(
                          Number.parseInt((e.target as HTMLInputElement).value)
                        )
                      }
                    />
                  </div>
                  <div className="input-container">
                    <label htmlFor="small-input">Small Blind: </label>
                    <input
                      id="small-input"
                      type="number"
                      value={tempSmall}
                      onInput={(e) =>
                        setTempSmall(
                          Number.parseInt((e.target as HTMLInputElement).value)
                        )
                      }
                    />
                  </div>
                  <div className="input-container">
                    <label htmlFor="big-input">Big Blind: </label>
                    <input
                      id="big-input"
                      type="number"
                      value={tempBig}
                      onInput={(e) =>
                        setTempBig(
                          Number.parseInt((e.target as HTMLInputElement).value)
                        )
                      }
                    />
                  </div>
                </div>
                <button
                  id="start-playing"
                  onClick={() =>
                    startGame(room, tempInitial, tempSmall, tempBig)
                  }
                >
                  Start Playing
                </button>
              </div>
            </div>
          )}
          <button
            id="quit-button"
            onClick={() => {
              quitGame();
              Session.set('isGaming', false);
            }}
          >
            <svg
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
            >
              <path
                d="M562.972444 554.666667c0 28.103111-22.869333 50.972444-51.029333 50.972444-28.216889 0-50.972444-22.755556-50.972444-50.972444L460.970667 112.526222c0-28.103111 22.869333-50.972444 50.972444-50.972444s51.029333 22.869333 51.029333 50.972444L562.972444 554.666667 562.972444 554.666667zM84.593778 535.438222c0-152.576 80.554667-286.663111 201.102222-361.813333 23.608889-15.018667 55.125333-7.850667 69.973333 16.042667C370.631111 213.617778 363.463111 244.963556 339.626667 259.868444 247.694222 317.610667 186.652444 419.043556 186.652444 535.324444c0.398222 179.598222 145.635556 324.892444 325.290667 325.233778 179.598222-0.455111 324.778667-145.692444 325.12-325.233778 0-119.011556-64.227556-222.663111-159.800889-279.552-24.291556-14.392889-32.256-45.738667-17.92-69.973333 14.449778-24.177778 45.795556-32.142222 70.030222-17.806222 125.326222 74.012444 209.976889 210.830222 209.976889 367.274667 0 235.918222-191.260444 427.235556-427.292444 427.235556C275.911111 962.787556 84.593778 771.584 84.593778 535.438222"
                p-id="2453"
              ></path>
            </svg>
          </button>
        </div>
      </div>
      <div className="public">
        <table className="info-table">
          <tbody>
            <tr>
              <td className="now-stage">Stage</td>
              <td className="stage-display">
                {
                  {
                    5: 'Not Gaming',
                    0: 'Pre-flop',
                    1: 'flop',
                    2: 'turn',
                    3: 'river',
                  }[
                    room?.stage === undefined || room?.stage === -1
                      ? 5
                      : room.stage
                  ]
                }
              </td>
            </tr>
            <tr>
              <td className="now-stage">Pot</td>
              <td className="stage-display">{room?.pot}</td>
            </tr>
          </tbody>
        </table>
        <div
          className="summary"
          style={{
            display: room?.stage === Room.Stage.DISPLAY ? 'block' : 'none',
          }}
        >
          <h4>
            {room?.winners &&
              room.players &&
              room.winners.map((winner) => (
                <span key={winner}>{room.players[winner].username + ' '}</span>
              ))}
            wins with
            {' ' + cardCombination[Math.floor(room?.bestCardValue || 0)]}!
          </h4>
          <div className="show-container">
            {room?.bestCardSet?.map((card: CardObject) => (
              <Card
                key={
                  CardObject.getRankString(card) +
                  CardObject.getSuitString(card)
                }
                card={card}
                smallDisplay
              ></Card>
            ))}
          </div>
        </div>
        <div className="public-cards">
          <h3>Public</h3>
          <div className="public-cards-container">
            {room?.public.cards.map((card) => (
              <Card
                key={
                  CardObject.getRankString(card) +
                  CardObject.getSuitString(card)
                }
                card={card}
              ></Card>
            ))}
          </div>
        </div>
      </div>
      <div className="other-players">
        <div className="players-container">
          {players?.map((player: Player, index) => (
            <PlayerDisplay
              key={player?.username}
              player={player}
              isPlaying={room?.nowTurn === index}
              isUser={player?.username === username}
              showCards={
                room?.players.filter((value) => value.username === username)
                  .length === 0 ||
                (room?.stage === Room.Stage.DISPLAY &&
                  player?.status !== Player.PlayerStatus.FOLDED)
              }
            ></PlayerDisplay>
          ))}
        </div>
      </div>
      <div className="hand">
        <div className="hand-cards">
          <h3>Your cards:</h3>
          <div className="cards-container">
            {self?.hand.cards.map((card) => (
              <Card
                key={
                  CardObject.getRankString(card) +
                  CardObject.getSuitString(card)
                }
                card={card}
              ></Card>
            ))}
          </div>
        </div>
        <div className="bet-area">
          <div className="tags">
            {isDealer && <span className="player-tag">Dealer</span>}
            {isSb && <span className="player-tag">Small Blind</span>}
            {isBb && <span className="player-tag">Big Blind</span>}
          </div>
          <h1 className="money-display">
            <span className="to-bet">
              $
              <input
                type="number"
                value={tempBet}
                maxLength={4}
                onInput={(e) =>
                  setTempBet(
                    Number.parseInt((e.target as HTMLInputElement).value)
                  )
                }
              />
            </span>
            /${self?.money}
          </h1>
          <div className="button-group">
            <button
              id="fold-button"
              disabled={!isPlayer || room?.stage === Room.Stage.DISPLAY}
              onClick={() => {
                fold(room);
              }}
            >
              Fold
            </button>
            <button
              id="check-button"
              disabled={!isPlayer || room?.stage === Room.Stage.DISPLAY}
              onClick={() => {
                check(room);
              }}
            >
              {checkText(room?.nowStageBet, self?.stageBet, self?.money)}
            </button>
            <button
              id="raise-button"
              disabled={
                !isPlayer ||
                (self && room && self.stageBet + tempBet <= room.nowStageBet) ||
                (room && self && tempBet > self.money) ||
                tempBet <= 0 ||
                room?.stage === Room.Stage.DISPLAY
              }
              onClick={() => {
                setTempBet(0);
                raise(room, tempBet);
              }}
            >
              {raiseText(
                room?.nowStageBet,
                self?.stageBet,
                self?.money,
                tempBet
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
