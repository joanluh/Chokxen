// El exportador de la demo incrusta estos archivos para funcionar sin conexión.
export const asset = file => globalThis.__CHOKXEN_ASSETS__?.[file] || `${import.meta.env.BASE_URL}${file}`;

export const teamLogos = Object.fromEntries([
  ['América', 'america'], ['Chivas', 'chivas'], ['Monterrey', 'monterrey'],
  ['Tigres', 'tigres'], ['Pumas', 'pumas'], ['Toluca', 'toluca'],
  ['Santos', 'santos'], ['León', 'leon'], ['Cruz Azul', 'cruz-azul'],
  ['Atlas', 'atlas'], ['Real Madrid', 'real-madrid'], ['Barcelona', 'barcelona'],
  ['Cowboys', 'cowboys'], ['Chiefs', 'chiefs'], ['Lakers', 'lakers'], ['Celtics', 'celtics'],
].map(([name, file]) => [name, `assets/logos/${file}.webp`]));
