import { Mongo } from 'meteor/mongo';
import { Card, Deck, Hand, Public } from '../logic/Card';

export class Player {
  username: string;
  stageBet: number;
  status: number = 0;
  bestCombination: Card[] | undefined;
  bestValue = -1;
  lastAction: string | undefined;
  static PlayerStatus = {
    NORMAL: 0,
    FOLDED: -1,
    ALL_IN: 1,
  };
  money: number;
  hand: Hand = new Hand();
  public constructor(username: string, money: number) {
    this.username = username;
    this.money = money;
    this.stageBet = 0;
  }
  /**
   * return true if all in
   */
  public static bet(player: Player, money: number): [boolean, number] {
    let ans = false;
    if (money >= player.money) {
      player.status = Player.PlayerStatus.ALL_IN;
      money = player.money;
      player.lastAction = `All In \$${money}`;
      ans = true;
    } else {
      player.lastAction = `Call \$${money}`;
    }
    player.stageBet += money;
    player.money -= money;
    return [ans, money];
  }
}

export class Pot {
  size: number;
  players: number[];
  winners: number[] = [];
  bestCardValue: number | undefined;
  bestCardSet: Card[] | undefined;
  constructor(room: Room) {
    this.size = 0;
    this.players = room.players
      ? room.players.map((_value, index) => index)
      : [];
  }
}

export class Room {
  [x: string]: any;
  roomName: string;
  players: Player[];
  deck = new Deck();
  public = new Public();
  roundNum = 0;
  smallBlind = 1;
  bigBlind = 2;
  initial = 100;
  stage = Room.Stage.NOT_GAMING;
  displayingPotId: number | undefined;
  nowStageBet = 0;
  winners: number[] = [];
  bestCardValue: number | undefined;
  bestCardSet: Card[] | undefined;
  pots = [new Pot(this)];
  lastRiser = 0;
  static Stage = {
    NOT_GAMING: -1,
    PRE_FLOP: 0,
    FLOP: 1,
    TURN: 2,
    RIVER: 3,
    DISPLAY: 4,
    ALL_FOLD: 5,
  };
  dealer = 0;
  static sb(room: Room): number {
    if (room.players.length === 2) {
      return room.dealer;
    }
    return (room.dealer + 1) % room.players.length;
  }

  static bb(room: Room): number {
    if (room.players.length === 2) {
      return (room.dealer + 1) % 2;
    }
    return (room.dealer + 2) % room.players.length;
  }
  static ownerName(room: Room | undefined): string {
    if (!room) return '';
    return room.players[0].username;
  }
  nowTurn = -1;

  public constructor(roomName: string, ownerName: string) {
    this.players = [new Player(ownerName, 100)];
    this.roomName = roomName;
  }
}

export const RoomsCollection = new Mongo.Collection<Room>('rooms');
