import { createDemoMatches } from './services/demo-matches.js';
export const sports = ['Fútbol', 'NFL', 'Básquet', 'Tenis'];
export const leagues = ['Liga MX', 'Premier League', 'LaLiga', 'Champions'];
export const teams = ['América', 'Chivas', 'Monterrey', 'Tigres', 'Pumas', 'Toluca', 'Santos', 'León', 'Real Madrid', 'Barcelona'];
export const matches = createDemoMatches();
export const products = [
  { id: 1, name: 'Jersey Chivas local', image: 'assets/products/jersey-local.webp', category: 'Jerseys', price: 899, premiumPrice: 809, kind: 'jersey', color: '#e91c40', tag: 'Más vendido' },
  { id: 2, name: 'Balón de fútbol', image: 'assets/photos/football.webp', category: 'Accesorios', price: 599, premiumPrice: 539, kind: 'ball', color: '#f3f4f7', tag: 'Nuevo' },
  { id: 3, name: 'Jersey Chivas visitante', image: 'assets/products/jersey-visitante.webp', category: 'Jerseys', price: 849, premiumPrice: 764, kind: 'jersey', color: '#eceff5' },
  { id: 4, name: 'Gorra Chivas New Era', image: 'assets/products/gorra.webp', category: 'Accesorios', price: 299, premiumPrice: 269, kind: 'cap', color: '#e91c40' },
  { id: 5, name: 'Mochila Chivas Puma', image: 'assets/products/mochila.webp', category: 'Accesorios', price: 699, premiumPrice: 629, kind: 'bag', color: '#242c3b' },
  { id: 6, name: 'Sudadera Chivas', image: 'assets/products/sudadera.webp', category: 'Jerseys', price: 999, premiumPrice: 899, kind: 'jersey', color: '#222b3b' },
];
export const initialUsers = [
  { id: 1, name: 'Andrea López', email: 'andrea@ejemplo.com', plan: 'Premium', active: true },
  { id: 2, name: 'Daniel Martínez', email: 'daniel@ejemplo.com', plan: 'Basico', active: true },
  { id: 3, name: 'Sofía Herrera', email: 'sofia@ejemplo.com', plan: 'Premium', active: true },
  { id: 4, name: 'Luis García', email: 'luis@ejemplo.com', plan: 'Basico', active: false },
  { id: 5, name: 'Mariana Torres', email: 'mariana@ejemplo.com', plan: 'Basico', active: true },
  { id: 6, name: 'Diego Ramírez', email: 'diego@ejemplo.com', plan: 'Premium', active: true },
];
export const money = value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(value);
