import { Player, Pot, Room, RoomsCollection } from '../api/room';
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
  room.smallBlind = smallBlind;
  room.bigBlind = bigBlind;
  for (let player of room.players) {
    player.money = room.initial;
  }
  newGame(room);
}
export function newGame(room: Room) {
  room.deck = new Deck();
  room.public = new Public();
  room.players = room.players.filter((player) => player.money !== 0);
  room.pots = [new Pot(room)];
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
  room.displayingPotId = undefined;
  room.stage = Room.Stage.PRE_FLOP;
  room.dealer = (room.dealer + 1) % room.players.length;
  room.nowTurn = (Room.bb(room) + 1) % room.players.length;
  room.lastRiser = room.dealer;
  room.nowStageBet = room.bigBlind;
  const [_ai1, money1] = Player.bet(
    room.players[Room.sb(room)],
    room.smallBlind
  );
  room.players[Room.sb(room)].lastAction = undefined;
  const [_ai2, money2] = Player.bet(room.players[Room.bb(room)], room.bigBlind);
  room.players[Room.bb(room)].lastAction = undefined;
  room.pots[0].size = money1 + money2;
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
    room.players[lastPlayerIndex].money += room.pots[room.pots.length - 1].size;
    room.pots[room.pots.length - 1].winners = [lastPlayerIndex];
    room.stage = Room.Stage.ALL_FOLD;
    room.nowTurn = -1;
    RoomsCollection.update({ _id: room._id }, room);
    setTimeout(() => newGame(room), 2000);
    return;
  }
  nextPlayer(room);
}
export function nextStage(room: Room) {
  // Split pot;
  const pot = room.pots[room.pots.length - 1];
  pot.players = pot.players.filter(
    (id) => room.players[id].status !== Player.PlayerStatus.FOLDED
  );
  const sequence: [number, number][] = [];
  for (const playerId of pot.players) {
    sequence.push([playerId, room.players[playerId].stageBet]);
  }
  sequence.sort((a, b) => a[1] - b[1]);
  // make differential array
  for (let i = sequence.length - 1; i > 0; i--) {
    sequence[i][1] -= sequence[i - 1][1];
  }
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i][1] > 0) {
      const newPot = new Pot(room);
      newPot.players = pot.players.filter(
        (id) =>
          sequence
            .slice(i)
            .map((v) => v[0])
            .findIndex((v) => v === id) !== -1
      );
      newPot.size = sequence[i][1] * (sequence.length - i);
      pot.size -= sequence[i][1] * (sequence.length - i);
      room.pots.push(newPot);
    }
  }
  for (let i = 0; i < room.players.length; i++) {
    room.players[i].stageBet = 0;
    room.players[i].lastAction = undefined;
  }
  if (room.stage === Room.Stage.PRE_FLOP) {
    Deck.deal(room.deck, room.public);
    Deck.deal(room.deck, room.public);
    Deck.deal(room.deck, room.public);
  } else if (room.stage === Room.Stage.RIVER) {
    room.stage = Room.Stage.DISPLAY;
    const waitLen = 4000 * room.pots.length;
    for (let i = 0; i < room.pots.length; i++) {
      setTimeout(() => {
        compare(room, room.pots[i]);
        room.displayingPotId = i;
        RoomsCollection.update({ _id: room._id }, room);
      }, 4000 * i);
    }
    setTimeout(() => newGame(room), waitLen);
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
  room.players[room.nowTurn].lastAction = 'Check';
  nextPlayer(room);
}
export function call(room: Room) {
  if (!room) {
    return;
  }
  const player = room.players[room.nowTurn];
  if (player.stageBet < room.nowStageBet) {
    const [_, money] = Player.bet(player, room.nowStageBet - player.stageBet);
    room.pots[room.pots.length - 1].size += money;
  }
  nextPlayer(room);
}
export function raise(room: Room | undefined, raiseMoney: number) {
  if (!room) {
    return;
  }
  const player = room.players[room.nowTurn];
  room.lastRiser = room.nowTurn;
  const [isAllIn, money] = Player.bet(player, raiseMoney);
  if (room.nowStageBet === 0) {
    player.lastAction = `Bet \$${money}`;
  } else if (!isAllIn) {
    player.lastAction = `Raise \$${money}`;
  } else {
    player.lastAction = `All in \$${money}`;
  }
  room.pots[room.pots.length - 1].size += raiseMoney;
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
export function compare(room: Room, pot: Pot) {
  let biggestPlayers: number[] = [];
  let biggestHand: Card[] = [];
  let biggestValue = -1;
  pot.players.forEach((playerId) => {
    const player = room.players[playerId];
    if (player.status === Player.PlayerStatus.FOLDED) return;
    const { bestHand, bestValue } = getBestHand(
      player.hand.cards.slice().concat(room.public.cards)
    );
    if (
      bestValue > biggestValue ||
      (bestValue === biggestValue && cardSetCompare(bestHand, biggestHand) > 0)
    ) {
      biggestPlayers = [playerId];
      biggestHand = bestHand;
      biggestValue = bestValue;
    } else if (
      bestValue === biggestValue &&
      cardSetCompare(bestHand, biggestHand) === 0
    ) {
      biggestPlayers.push(playerId);
    }
  });
  pot.winners = biggestPlayers.slice();
  pot.bestCardValue = biggestValue;
  pot.bestCardSet = biggestHand.sort((a, b) => cardCompare(a, b)).slice();
  let i = room.dealer;
  let cnt = 0;
  do {
    if (biggestPlayers.find((target) => target === i) !== undefined) {
      room.players[i].money +=
        Math.floor(pot.size / biggestPlayers.length) +
        (cnt < pot.size % biggestPlayers.length ? 1 : 0);
      cnt++;
    }
    i = (i + 1) % room.players.length;
  } while (i !== room.dealer);
}
