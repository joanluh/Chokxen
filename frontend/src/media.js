export const asset = file => `${import.meta.env.BASE_URL}${file}`;

export const teamLogos = Object.fromEntries([
  ['América', 'america'], ['Chivas', 'chivas'], ['Monterrey', 'monterrey'],
  ['Tigres', 'tigres'], ['Pumas', 'pumas'], ['Toluca', 'toluca'],
  ['Santos', 'santos'], ['León', 'leon'], ['Cruz Azul', 'cruz-azul'],
  ['Atlas', 'atlas'], ['Real Madrid', 'real-madrid'], ['Barcelona', 'barcelona'],
  ['Cowboys', 'cowboys'], ['Chiefs', 'chiefs'], ['Lakers', 'lakers'], ['Celtics', 'celtics'],
].map(([name, file]) => [name, `assets/logos/${file}.webp`]));
