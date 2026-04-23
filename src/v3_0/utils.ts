import { Card, CardType, GameState } from './types';

export function generateDeck(): Card[] {
    const deck: Card[] = [];
    let id = 0;

    const addStandard = (type: CardType) => {
        for (let i=0; i<4; i++) deck.push({ id: `c${id++}`, type, value: 1 });
        for (let i=0; i<3; i++) deck.push({ id: `c${id++}`, type, value: 2 });
        for (let i=0; i<2; i++) deck.push({ id: `c${id++}`, type, value: 3 });
    };

    const addValues = (type: CardType, values: number[]) => {
        values.forEach(v => deck.push({ id: `c${id++}`, type, value: v }));
    };

    addStandard('Käfig');
    addStandard('Hinterhalt!');
    addStandard('Schrottrüstung');
    addStandard('Von hinten geschubst');
    addStandard('Lugloch');
    addStandard('Geheimfach');
    addStandard('Auswahlelixir');
    addStandard('Dynamit');
    addStandard('Löschwasser');
    
    // Glitzerklunker: 4, 5, 6
    addValues('Glitzerklunker', [4,4,4, 5,5,5, 6,6,6]);

    // Fluch: -1, -2, -3
    addValues('Des Meisters Fluch', [-1,-1,-1, -2,-2,-2, -3,-3,-3]);

    return shuffle(deck);
}

export function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
