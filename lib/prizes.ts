export interface Prize {
  id: string;
  name: string;
  cost: number;
  description: string;
  inStock: boolean;
  totalAvailable: number;
  redeemed: number;
}

export const PRIZES: Prize[] = [
  {
    id: 'sticker',
    name: 'YWG Sticker',
    cost: 500,
    description: 'Cool sticker',
    inStock: true,
    totalAvailable: 100,
    redeemed: 0
  },
  {
    id: 'coffee',
    name: "Beezy's Coffee",
    cost: 1000,
    description: '$5 gift card',
    inStock: true,
    totalAvailable: 50,
    redeemed: 0
  },
  {
    id: 'grand',
    name: 'Grand Prize T-Shirt',
    cost: 2500,
    description: 'Limited edition',
    inStock: true,
    totalAvailable: 25,
    redeemed: 0
  }
];
