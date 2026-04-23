import { Card } from './types';

export function generateDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  const add = (v: number, c: number, t: 'evil' | 'good', name: string) => {
    for (let i = 0; i < c; i++) deck.push({ id: `c_${id++}`, value: v, type: t, name });
  };
  add(1, 5, 'evil', 'Kitzelattacke');
  add(2, 5, 'evil', 'Streich spielen');
  add(3, 5, 'evil', 'Lästern');
  add(4, 18, 'evil', 'Diebstahl');
  add(5, 18, 'evil', 'Erpressung');
  add(6, 18, 'evil', 'Körperverletzung');
  add(7, 17, 'evil', 'Brandstiftung');
  add(8, 9, 'evil', 'Folter');
  add(9, 9, 'evil', 'Hochverrat');
  add(10, 8, 'evil', 'Meuchelmord');
  add(-1, 8, 'good', 'Küken streicheln');
  add(-2, 8, 'good', 'Oma über die Straße helfen');
  add(-3, 8, 'good', 'Müll trennen');
  add(-4, 7, 'good', 'Blut spenden');
  add(-5, 7, 'good', 'Freiwillig Steuern zahlen');
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function calculateScore(successPile: Card[]) {
  return successPile.reduce((sum, c) => sum + c.value, 0);
}
