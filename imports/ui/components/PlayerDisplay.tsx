import React from 'react';
import { Player } from '../../api/room';
import { Card as CardObject } from '../../logic/Card';
import { Card } from './Card';
import './PlayerDisplay.css';

export function PlayerDisplay(props: {
  player: Player;
  isPlaying: boolean;
  showCards: boolean;
  isUser: boolean;
}) {
  return (
    <div className={`player-bg${props.isPlaying ? ' is-playing' : ''}`}>
      <h3>{props.player.username}{props.isUser && <span>You</span>}</h3>
      <h5>{props.player.lastAction}</h5>
      <div className="other-cards-container">
        {props.showCards &&
          props.player.hand.cards.map((card) => (
            <Card
              key={
                CardObject.getRankString(card) + CardObject.getSuitString(card)
              }
              card={card}
              smallDisplay
            ></Card>
          ))}
      </div>
    </div>
  );
}
