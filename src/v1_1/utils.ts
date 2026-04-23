import { Card } from './types';

export function generateMasterDeck(): Card[] {
  const values = [10, 12, 13, 13, 14, 14, 14, 15, 15, 15, 16, 16, 16, 17, 17, 18, 20];
  const deck: Card[] = values.map((v, i) => ({ id: `m_${i}`, value: v, type: 'master' }));
  return shuffle(deck);
}

export function generateServantDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  const add = (v: number, count: number) => {
    for (let i = 0; i < count; i++) {
      deck.push({ id: `s_${id++}`, value: v, type: 'servant' });
    }
  };
  add(1, 1);
  add(2, 2);
  add(3, 3);
  add(4, 4);
  add(5, 5);
  add(6, 6);
  add(7, 7);
  return shuffle(deck);
}

function shuffle(array: Card[]) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
