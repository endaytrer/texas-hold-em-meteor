import { Player, Room, RoomsCollection } from '../api/room';
import {
  Card,
  cardCompare,
  cardSetCompare,
  Deck,
  getValue,
  Hand,
  Public,
} from './Card';

export function startGame(
  room: Room | undefined,
  initial: number,
  smallBlind: number,
  bigBlind: number
) {
  if (!room) {
    alert('No room specified');
    return;
  }
  if (room.players.length < 2 || room.players.length > 23) {
    alert('Too few or too many players are in the game');
    return;
  }
  room.initial = initial;
  room.deck = new Deck();
  room.public = new Public();
  for (let player of room.players) {
    player.money = initial;
    player.hand = new Hand();
    player.stageBet = 0;
    player.bestCombination = undefined;
    player.bestValue = -1;
    player.status = Player.PlayerStatus.NORMAL;
    player.lastAction = undefined;
    Deck.deal(room.deck, player.hand);
    Deck.deal(room.deck, player.hand);
  }
  room.smallBlind = smallBlind;
  room.bigBlind = bigBlind;
  // game
  room.pot = 0;
  room.stage = Room.Stage.PRE_FLOP;
  room.nowTurn = room.dealer;
  room.nowStageBet = room.bigBlind;
  room.lastRiser = room.dealer;
  room.bestCardSet = undefined;
  room.bestCardValue = undefined;
  room.winners = [];
  Player.bet(room.players[Room.sb(room)], room.smallBlind);
  room.players[Room.sb(room)].lastAction = undefined;
  Player.bet(room.players[Room.bb(room)], room.bigBlind);
  room.players[Room.bb(room)].lastAction = undefined;
  room.pot = smallBlind + bigBlind;
  RoomsCollection.update({ _id: room._id }, room);
}
export function newGame(room: Room) {
  room.deck = new Deck();
  room.public = new Public();
  room.players = room.players.filter((player) => player.money !== 0);
  if (room.players.length <= 1) {
    room.stage = Room.Stage.NOT_GAMING;
    RoomsCollection.update({ _id: room._id }, room);
    return;
  }
  for (let player of room.players) {
    player.hand = new Hand();
    player.stageBet = 0;
    player.status = Player.PlayerStatus.NORMAL;
    player.bestCombination = undefined;
    player.bestValue = -1;
    player.lastAction = undefined;
    Deck.deal(room.deck, player.hand);
    Deck.deal(room.deck, player.hand);
  }
  room.stage = Room.Stage.PRE_FLOP;
  room.dealer = (room.dealer + 1) % room.players.length;
  room.nowTurn = room.dealer;
  room.lastRiser = room.dealer;
  room.pot = 0;
  room.nowStageBet = room.bigBlind;
  room.bestCardSet = undefined;
  room.bestCardValue = undefined;
  room.winners = [];
  Player.bet(room.players[Room.sb(room)], room.smallBlind);
  room.players[Room.sb(room)].lastAction = undefined;
  Player.bet(room.players[Room.bb(room)], room.bigBlind);
  room.players[Room.bb(room)].lastAction = undefined;
  room.pot = room.smallBlind + room.bigBlind;
  RoomsCollection.update({ _id: room._id }, room);
}
export function fold(room: Room | undefined) {
  if (!room) {
    return;
  }
  room.players[room.nowTurn].status = Player.PlayerStatus.FOLDED;
  room.players[room.nowTurn].lastAction = 'Fold';
  if (
    room.players.filter(
      (player: Player) => player.status !== Player.PlayerStatus.FOLDED
    ).length === 1
  ) {
    const lastPlayerIndex = room.players.findIndex(
      (player) => player.status !== Player.PlayerStatus.FOLDED
    );
    room.players[lastPlayerIndex].money += room.pot;
    room.winners = [lastPlayerIndex];
    room.stage = Room.Stage.ALL_FOLD;
    room.nowTurn = -1;
    RoomsCollection.update({ _id: room._id }, room);
    setTimeout(() => newGame(room), 2000);
    return;
  }
  nextPlayer(room);
}
export function nextStage(room: Room) {
  for (let i = 0; i < room.players.length; i++) {
    room.players[i].lastAction = undefined;
  }
  if (room.stage === Room.Stage.PRE_FLOP) {
    Deck.deal(room.deck, room.public);
    Deck.deal(room.deck, room.public);
    Deck.deal(room.deck, room.public);
  } else if (room.stage === Room.Stage.RIVER) {
    compare(room);
    setTimeout(() => newGame(room), 5000);
    return;
  } else {
    Deck.deal(room.deck, room.public);
  }
  if (
    room.players.filter(
      (player) => player.status === Player.PlayerStatus.NORMAL
    ).length <= 1
  ) {
    room.nowTurn = -1;
    room.stage++;
    RoomsCollection.update({ _id: room._id }, room);
    setTimeout(() => {
      nextStage(room);
    }, 2000);
    return;
  }
  room.nowStageBet = 0;
  room.nowTurn = room.dealer;
  while (room.players[room.nowTurn].status !== Player.PlayerStatus.NORMAL) {
    room.nowTurn = (room.nowTurn + 1) % room.players.length;
  }
  room.lastRiser = room.nowTurn;
  room.stage++;
  RoomsCollection.update({ _id: room._id }, room);
}
export function check(room: Room | undefined) {
  if (!room) {
    return;
  }
  const player = room.players[room.nowTurn];
  if (player.stageBet < room.nowStageBet) {
    room.pot +=
      player.money > room.nowStageBet - player.stageBet
        ? room.nowStageBet - player.stageBet
        : player.money;
    Player.bet(player, room.nowStageBet - player.stageBet);
  } else {
    room.players[room.nowTurn].lastAction = 'Check';
  }
  nextPlayer(room);
}

export function raise(room: Room | undefined, raiseMoney: number) {
  if (!room) {
    return;
  }
  const player = room.players[room.nowTurn];
  room.lastRiser = room.nowTurn;
  Player.bet(player, raiseMoney);
  if (room.nowStageBet === 0) {
    player.lastAction = `Bet \$${raiseMoney}`;
  } else if (player.money !== 0) {
    player.lastAction = `Raise \$${raiseMoney}`;
  } else {
    player.lastAction = `All in \$${raiseMoney}`;
  }
  room.pot += raiseMoney;
  room.nowStageBet = player.stageBet;
  nextPlayer(room);
}

export function nextPlayer(room: Room) {
  for (let i = 0; i < room.players.length; i++) {
    if (i !== room.nowTurn) room.players[i].lastAction = undefined;
  }
  if (
    room.players.filter(
      (player) => player.status === Player.PlayerStatus.NORMAL
    ).length === 0
  ) {
    nextStage(room);
    return;
  }
  do {
    room.nowTurn = (room.nowTurn + 1) % room.players.length;
    if (room.nowTurn === room.lastRiser) {
      nextStage(room);
      return;
    }
  } while (room.players[room.nowTurn].status !== Player.PlayerStatus.NORMAL);
  RoomsCollection.update({ _id: room._id }, room);
}
export function getBestHand(cards: Card[]) {
  let bestHand: Card[] = [];
  let bestValue = -1;
  let tempCards: Card[];
  let tempValue;
  for (let i = 0; i < cards.length - 1; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      tempCards = cards.slice();
      tempCards.splice(j, 1);
      tempCards.splice(i, 1);
      tempValue = getValue(tempCards);
      if (tempValue > bestValue) {
        bestValue = tempValue;
        bestHand = tempCards;
      } else if (tempValue === bestValue) {
        if (cardSetCompare(tempCards, bestHand) > 0) {
          bestHand = tempCards;
          bestValue = tempValue;
        }
      }
    }
  }
  return { bestHand, bestValue };
}
export function compare(room: Room) {
  let biggestPlayers: number[] = [];
  let biggestHand: Card[] = [];
  let biggestValue = -1;
  room.players.forEach((player, index) => {
    if (player.status === Player.PlayerStatus.FOLDED) return;
    const { bestHand, bestValue } = getBestHand(
      player.hand.cards.slice().concat(room.public.cards)
    );
    if (
      bestValue > biggestValue ||
      (bestValue === biggestValue && cardSetCompare(bestHand, biggestHand) > 0)
    ) {
      biggestPlayers = [index];
      biggestHand = bestHand;
      biggestValue = bestValue;
    } else if (
      bestValue === biggestValue &&
      cardSetCompare(bestHand, biggestHand) === 0
    ) {
      biggestPlayers.push(index);
    }
  });
  room.stage = Room.Stage.DISPLAY;
  room.winners = biggestPlayers.slice();
  room.bestCardValue = biggestValue;
  room.bestCardSet = biggestHand.sort((a, b) => cardCompare(a, b));
  let i = room.dealer;
  let cnt = 0;
  do {
    if (biggestPlayers.find((target) => target === i) !== undefined) {
      room.players[i].money +=
        Math.floor(room.pot / biggestPlayers.length) +
        (cnt < room.pot % biggestPlayers.length ? 1 : 0);
      cnt++;
    }
    i = (i + 1) % room.players.length;
  } while (i !== room.dealer);
  room.pot = 0;
  RoomsCollection.update({ _id: room._id }, room);
}
