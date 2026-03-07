import { Product } from './types';

export const products: Product[] = [
  {
    id: 'w1',
    name: 'Château Margaux 2015',
    description: 'A legendary vintage from one of the most prestigious estates in Bordeaux. This wine offers an incredible depth of flavor with notes of blackcurrant, violet, and cedar.',
    price: 1600000,
    category: 'Wine',
    image: 'https://images.unsplash.com/photo-1510850477530-ce990e85c55e?auto=format&fit=crop&q=80&w=800',
    origin: 'Bordeaux, France',
    abv: '13.5%',
    year: 2015,
    stock: 10,
    minStockLevel: 3,
    tags: ['premium', 'red-wine', 'bordeaux']
  },
  {
    id: 'w2',
    name: 'Dom Pérignon Vintage 2012',
    description: 'The 2012 vintage is a powerhouse of energy and precision. A complex bouquet of white flowers, citrus, and stone fruit with a long, elegant finish.',
    price: 350000,
    category: 'Wine',
    image: 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&q=80&w=800',
    origin: 'Champagne, France',
    abv: '12.5%',
    year: 2012,
    stock: 20,
    minStockLevel: 5,
    tags: ['champagne', 'sparkling', 'vintage']
  },
  {
    id: 'l1',
    name: 'The Macallan 18 Year Old',
    description: 'Matured in sherry seasoned oak casks from Jerez, Spain. A rich and complex single malt with notes of dried fruits, ginger, and cinnamon.',
    price: 580000,
    category: 'Liquor',
    image: 'https://images.unsplash.com/photo-1527281473222-793895bf44f9?auto=format&fit=crop&q=80&w=800',
    origin: 'Speyside, Scotland',
    abv: '43%',
    stock: 15,
    minStockLevel: 2,
    tags: ['whisky', 'scotch', 'aged']
  },
  {
    id: 'l2',
    name: 'Clase Azul Reposado Tequila',
    description: 'An ultra-premium tequila made from 100% Blue Weber Agave. The iconic ceramic decanter is hand-painted, and the tequila is smooth with notes of vanilla and hazelnut.',
    price: 240000,
    category: 'Liquor',
    image: 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?auto=format&fit=crop&q=80&w=800',
    origin: 'Jalisco, Mexico',
    abv: '40%',
    stock: 8,
    minStockLevel: 3,
    tags: ['tequila', 'premium', 'mexico']
  },
  {
    id: 'w3',
    name: 'Sassicaia 2018',
    description: 'The original Super Tuscan. A blend of Cabernet Sauvignon and Cabernet Franc that redefined Italian winemaking. Intense, structured, and perfectly balanced.',
    price: 410000,
    category: 'Wine',
    image: 'https://images.unsplash.com/photo-1553361371-9bb220269716?auto=format&fit=crop&q=80&w=800',
    origin: 'Tuscany, Italy',
    abv: '14%',
    year: 2018,
    stock: 12,
    minStockLevel: 4,
    tags: ['italian', 'red-wine', 'super-tuscan']
  },
  {
    id: 'l3',
    name: 'Hennessy X.O Cognac',
    description: 'The original "Extra Old" cognac. A powerful and balanced blend of over 100 eaux-de-vie, offering rich flavors of cocoa, spice, and dried fruit.',
    price: 270000,
    category: 'Liquor',
    image: 'https://images.unsplash.com/photo-1569158062037-d7234c5f7565?auto=format&fit=crop&q=80&w=800',
    origin: 'Cognac, France',
    abv: '40%',
    stock: 25,
    minStockLevel: 6,
    tags: ['cognac', 'brandy', 'france']
  }
];
