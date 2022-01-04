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
  public static bet(player: Player, money: number) {
    if (money >= player.money) {
      player.status = Player.PlayerStatus.ALL_IN;
      money = player.money;
      player.lastAction = `All In \$${money}`;
    } else {
      player.lastAction = `Call \$${money}`;
    }
    player.stageBet += money;
    player.money -= money;
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
  nowStageBet = 0;
  pot = 0;
  lastRiser = 0;
  static Stage = {
    NOT_GAMING: -1,
    PRE_FLOP: 0,
    FLOP: 1,
    TURN: 2,
    RIVER: 3,
    DISPLAY: 4,
  };
  winners: number[] = [];
  bestCardValue: number | undefined;
  bestCardSet: Card[] | undefined;
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
