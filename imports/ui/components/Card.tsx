import React from 'react';
import { Card as CardObject, Suit } from '/imports/logic/Card';

export const Card = (props: { card: CardObject; smallDisplay?: boolean }) => {
  return (
    <div className={`card ${props.smallDisplay ? 'small' : 'regular'}`}>
      <div
        className={
          props.card.suit === Suit.Heart || props.card.suit === Suit.Diamond
            ? 'card-info-container red'
            : 'card-info-container'
        }
      >
        <div className="rank">{CardObject.getRankString(props.card)}</div>
        <div className="suit">{CardObject.getSuitString(props.card)}</div>
      </div>
    </div>
  );
};
export const EmptyCard = (props: { smallDisplay?: boolean }) => {
  return (
    <div className={`card back ${props.smallDisplay ? 'small' : 'regular'}`}>
      <div className="rank">
        {CardObject.getSuitString(new CardObject(Suit.Spade, 1))}
      </div>
    </div>
  );
};
