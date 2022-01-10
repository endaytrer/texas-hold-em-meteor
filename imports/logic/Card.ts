export enum Suit {
  Diamond,
  Club,
  Heart,
  Spade,
}
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
const valueOfRank = [0, 12, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export class Card {
  public suit: Suit;
  public rank: Rank;
  public constructor(suit: Suit, rank: Rank) {
    this.suit = suit;
    this.rank = rank;
  }
  public static getRankString(card: Card): string {
    if (card.rank === 1) {
      return 'A';
    } else if (card.rank === 11) {
      return 'J';
    } else if (card.rank === 12) {
      return 'Q';
    } else if (card.rank === 13) {
      return 'K';
    } else {
      return String(card.rank);
    }
  }
  public static getSuitString(card: Card): string {
    if (card.suit === Suit.Spade) {
      return '♠️';
    } else if (card.suit === Suit.Heart) {
      return '♥️';
    } else if (card.suit === Suit.Club) {
      return '♣️';
    } else {
      return '♦️';
    }
  }
}
export interface CardCollection {
  cards: Card[];
}
export class Deck {
  public deck: Card[];
  public constructor() {
    this.deck = [];
    for (let suit: Suit = 0; suit < 4; suit++) {
      for (let rank: Rank = 1; rank <= 13; rank = (rank + 1) as Rank) {
        this.getCard(new Card(suit, rank));
      }
    }
  }
  private getCard(card: Card): void {
    const place = Math.floor(Math.random() * (card.suit * 13 + card.rank));
    this.deck.splice(place, 0, card);
  }
  public static deal(deck: Deck, receiver: CardCollection): void {
    if (deck.deck.length) {
      receiver.cards.push(deck.deck.pop() as Card);
    }
  }
}

export class Hand implements CardCollection {
  public cards: Card[] = [];
}

export class Public implements CardCollection {
  public cards: Card[] = [];
}
function isStraight(sortedCards: Card[]): boolean {
  if (sortedCards.length !== 5) {
    return false;
  }
  if (
    valueOfRank[sortedCards[1].rank] - valueOfRank[sortedCards[0].rank] === 1 &&
    valueOfRank[sortedCards[2].rank] - valueOfRank[sortedCards[1].rank] === 1 &&
    valueOfRank[sortedCards[3].rank] - valueOfRank[sortedCards[2].rank] === 1 &&
    valueOfRank[sortedCards[4].rank] - valueOfRank[sortedCards[3].rank] === 1
  ) {
    return true;
  }
  if (
    sortedCards[4].rank === 1 &&
    sortedCards[0].rank === 2 &&
    sortedCards[1].rank === 3 &&
    sortedCards[2].rank === 4 &&
    sortedCards[3].rank === 5
  ) {
    return true;
  }
  return false;
}
export function getValue(cards: Card[]): number {
  if (cards.length !== 5) {
    return -1;
  }
  const sorted = cards.slice();
  sorted.sort((a: Card, b: Card) =>
    a.rank !== b.rank
      ? valueOfRank[a.rank] - valueOfRank[b.rank]
      : a.suit - b.suit
  );
  // Royal flush
  if (
    sorted[0].suit === sorted[1].suit &&
    sorted[1].suit === sorted[2].suit &&
    sorted[2].suit === sorted[3].suit &&
    sorted[3].suit === sorted[4].suit &&
    sorted[0].rank === 10 &&
    sorted[1].rank === 11 &&
    sorted[2].rank === 12 &&
    sorted[3].rank === 13 &&
    sorted[4].rank === 1
  ) {
    return 9;
  }
  // Straight flush
  if (
    sorted[0].suit === sorted[1].suit &&
    sorted[1].suit === sorted[2].suit &&
    sorted[2].suit === sorted[3].suit &&
    sorted[3].suit === sorted[4].suit &&
    isStraight(sorted)
  ) {
    return 8 + valueOfRank[sorted[4].rank] / 13;
  }
  // Four of a Kind
  if (
    sorted[1].rank === sorted[2].rank &&
    sorted[2].rank === sorted[3].rank &&
    (sorted[0].rank === sorted[1].rank || sorted[3].rank === sorted[4].rank)
  ) {
    return 7 + valueOfRank[sorted[2].rank] / 13;
  }
  // Full House
  if (
    sorted[0].rank === sorted[1].rank &&
    sorted[3].rank === sorted[4].rank &&
    sorted[1].rank === sorted[2].rank
  ) {
    return (
      6 + valueOfRank[sorted[2].rank] / 13 + valueOfRank[sorted[3].rank] / 169
    );
  }
  if (
    sorted[0].rank === sorted[1].rank &&
    sorted[3].rank === sorted[4].rank &&
    sorted[2].rank === sorted[3].rank
  ) {
    return (
      6 + valueOfRank[sorted[3].rank] / 13 + valueOfRank[sorted[2].rank] / 169
    );
  }
  // Flush
  if (
    sorted[0].suit === sorted[1].suit &&
    sorted[1].suit === sorted[2].suit &&
    sorted[2].suit === sorted[3].suit &&
    sorted[3].suit === sorted[4].suit
  ) {
    return 5 + valueOfRank[sorted[4].rank] / 13;
  }
  // Straight
  if (isStraight(sorted)) {
    return 4 + valueOfRank[sorted[4].rank] / 13;
  }
  // Three of a Kind
  if (
    (sorted[1].rank === sorted[2].rank &&
      (sorted[0].rank === sorted[1].rank ||
        sorted[2].rank === sorted[3].rank)) ||
    (sorted[2].rank === sorted[3].rank && sorted[3].rank === sorted[4].rank)
  ) {
    return 3 + valueOfRank[sorted[2].rank] / 13;
  }
  // Two Pairs
  if (
    (sorted[0].rank === sorted[1].rank &&
      (sorted[2].rank === sorted[3].rank ||
        sorted[3].rank === sorted[4].rank)) ||
    (sorted[1].rank === sorted[2].rank && sorted[3].rank === sorted[4].rank)
  ) {
    return (
      2 + valueOfRank[sorted[3].rank] / 13 + valueOfRank[sorted[1].rank] / 169
    );
  }

  // One Pair
  if (sorted[0].rank === sorted[1].rank || sorted[1].rank === sorted[2].rank) {
    return 1 + valueOfRank[sorted[1].rank] / 13;
  }
  if (sorted[2].rank === sorted[3].rank || sorted[3].rank === sorted[4].rank) {
    return 1 + valueOfRank[sorted[3].rank] / 13;
  }
  // High Card
  return 0 + valueOfRank[sorted[4].rank] / 13;
}

export function cardCompare(a: Card, b: Card): number {
  return valueOfRank[a.rank] - valueOfRank[b.rank];
}

export function cardSetCompare(a: Card[], b: Card[]): number {
  const sortedA = a.slice().sort((a, b) => cardCompare(a, b));
  const sortedB = b.slice().sort((a, b) => cardCompare(a, b));
  for (let i = 0; i < 5; i++)
    if (cardCompare(sortedA[i], sortedB[i]) !== 0)
      return cardCompare(sortedA[i], sortedB[i]);
  return 0;
}
