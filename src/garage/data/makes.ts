import type { Powertrain } from './guides';
import type { BodyKind } from './paint';

/** Curated list of common makes. vPIC's full list has 10,000+ entries, mostly trailers. */
export const MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Fiat', 'Ford',
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus',
  'Lincoln', 'Lucid', 'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Polestar', 'Porsche',
  'Ram', 'Rivian', 'Scion', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
];

const CURRENT_YEAR = new Date().getFullYear();
export const YEARS: number[] = [];
for (let y = CURRENT_YEAR + 1; y >= 1990; y--) YEARS.push(y);

/** Matches any of `names` as whole words; each name is a regex fragment. */
const words = (names: string[]) => new RegExp(`\\b(${names.join('|')})\\b`, 'i');

/**
 * Tested in order against "make model", first match wins: the plug-ins that share an EV badge come first,
 * and the EV names ("Ioniq 5") sit above the hybrid ones ("Ioniq").
 */
const POWERTRAIN_RULES: [Powertrain, RegExp][] = [
  ['hybrid', words(['a3 (sportback )?e-tron', 'polestar 1'])],
  ['ev', /^(tesla|rivian|lucid|polestar)\b/i],
  ['ev', words([
    'leaf', 'ariya', 'bolt', 'spark ev', 'blazer ev', 'equinox ev', 'silverado ev', 'sierra ev', 'hummer ev',
    'lyriq', 'optiq', 'vistiq', 'escalade iq', 'mach-e', 'mustang mach', 'lightning', 'e-transit', 'focus electric',
    'ioniq ([569]|electric)', 'kona electric', 'ev[69]', 'niro ev', 'soul ev', 'id\\.? ?4', 'id\\.? buzz', 'e-golf',
    'e-tron', 'q4', 'q8 e', 'eq[bes]', 'i[3-7]', 'ix', 'taycan', 'i-pace', 'ex(30|40|90)', 'ec40', 'c40', 'xc40 recharge',
    'mx-30', 'solterra', 'bz4x', 'lexus rz', 'prologue', 'zdx', 'fit ev', 'clarity electric', 'mirai', 'nexo',
    '500e', 'cooper se', 'i-miev', 'r1[ts]', 'air', 'cybertruck', 'model [3sxy]',
  ])],
  ['hybrid', words([
    'hybrid', 'hev', 'phev', 'plug-in', 'prius', 'rav4 prime', 'insight', 'cr-z', 'volt', 'clarity', 'niro', 'ioniq',
    'e-power', 'energi', 'recharge', 't8', 'tfsi e', '4xe', 'i8', 'bmw \\d{3}e', 'xdrive\\d{2}e', 'mercedes-benz .* \\d{3}e',
    'lexus ct', 'lexus .*\\d{3}h',
  ])],
  ['diesel', words(['tdi', 'diesel', 'power stroke', 'duramax', 'cummins', 'bluetec', 'ecodiesel', 'd4d', 'crd', 'td'])],
];

export function guessPowertrain(make: string, model: string): Powertrain {
  const name = `${make.trim()} ${model.trim()}`;
  return POWERTRAIN_RULES.find(([, re]) => re.test(name))?.[0] ?? 'gas';
}

const SUV_MAKES = /^(jeep|land rover|rivian)$/i;
const SUV_MODELS = new RegExp(
  '\\b(' +
    [
      'cr-?v', 'hr-?v', 'pilot', 'passport', 'ridgeline', 'odyssey', 'prologue',
      'rav4', 'highlander', '4runner', 'sequoia', 'land cruiser', 'venza', 'c-hr', 'corolla cross', 'bz4x', 'tacoma', 'tundra', 'sienna',
      'tahoe', 'suburban', 'equinox', 'traverse', 'blazer', 'trailblazer', 'trax', 'silverado', 'colorado',
      'yukon', 'acadia', 'terrain', 'sierra', 'canyon', 'hummer', 'savana',
      'explorer', 'expedition', 'escape', 'edge', 'bronco', 'ranger', 'maverick', 'f-?\\d{3}', 'transit', 'mach-e', 'mustang mach',
      'grand cherokee', 'cherokee', 'compass', 'renegade', 'wrangler', 'gladiator', 'wagoneer',
      'durango', 'journey', 'pacifica', 'ram', 'promaster',
      'tucson', 'santa fe', 'palisade', 'kona', 'venue', 'santa cruz', 'ioniq 5', 'ioniq 9',
      'sportage', 'sorento', 'telluride', 'seltos', 'soul', 'niro', 'carnival', 'ev9',
      'rogue', 'murano', 'pathfinder', 'armada', 'kicks', 'frontier', 'titan', 'ariya', 'juke', 'xterra',
      'forester', 'outback', 'ascent', 'crosstrek', 'solterra',
      'tiguan', 'atlas', 'taos', 'id\\.?\\s?4', 'touareg',
      'cx-\\d+', 'mx-30', 'outlander', 'eclipse cross',
      'model [xy]', 'cybertruck',
      'mdx', 'rdx', 'zdx', 'qx\\d+', 'gv\\d+', 'xc\\d+', 'ex\\d+',
      'rx', 'nx', 'gx', 'lx', 'ux', 'tx', 'rz',
      'q[2-8]', 'e-tron', 'x[1-7]', 'ix', 'gl[abcse]', 'g-class', 'eq[bes] suv',
      'escalade', 'xt[456]', 'lyriq', 'navigator', 'aviator', 'nautilus', 'corsair',
      'cayenne', 'macan', 'countryman', 'stelvio', 'levante', 'urus', 'bentayga', 'cullinan', 'dbx',
    ].join('|') +
    ')\\b',
  'i',
);

/** Rough body style from make and model; good enough to pick a generic 3D body. */
export function guessBody(make: string, model: string): BodyKind {
  if (SUV_MAKES.test(make.trim())) return 'suv';
  return SUV_MODELS.test(model) ? 'suv' : 'sedan';
}
