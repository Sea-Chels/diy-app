import type { RideId } from './rides';

/**
 * The clickable regions of the car, motorcycle and bike. The 3D rig must provide a hotspot for
 * every PartId listed here; the UI and the guides key off these ids.
 */
export type PartId =
  | 'hood'
  | 'engine'
  | 'battery'
  | 'oil'
  | 'airbox'
  | 'coolant'
  | 'washer'
  | 'fusebox_engine'
  | 'wiper'
  | 'headlight'
  | 'taillight'
  | 'wheel'
  | 'brakes'
  | 'trunk'
  | 'door'
  | 'cabin'
  | 'fusebox_cabin'
  | 'fueldoor'
  | 'exhaust'
  | 'moto_tire'
  | 'moto_chain'
  | 'moto_brakes'
  | 'moto_oil'
  | 'moto_battery'
  | 'moto_lights'
  | 'moto_controls'
  | 'bike_tire'
  | 'bike_chain'
  | 'bike_brakes'
  | 'bike_gears'
  | 'bike_saddle';

export const LIDS = ['hood', 'trunk', 'door', 'moto_seat'] as const;
export type LidId = (typeof LIDS)[number];

export interface PartInfo {
  id: PartId;
  label: string;
  blurb: string;
  /** Parts whose repairs are also shown when this one is selected. */
  related?: PartId[];
  /** Which lid must be opened to see this part. */
  behind?: LidId;
  /** Visible (and clickable) through glass even while its lid is closed. */
  seeThrough?: boolean;
}

export const PARTS: Record<PartId, PartInfo> = {
  hood: { id: 'hood', label: 'Hood', blurb: 'Lift it to reach the engine bay. Most of the quick wins live under here.', related: ['engine', 'battery', 'oil', 'airbox', 'coolant', 'washer', 'fusebox_engine'] },
  engine: { id: 'engine', label: 'Engine', blurb: 'Spark plugs, belts and the odd sensor are reachable without pulling anything major.', behind: 'hood' },
  battery: { id: 'battery', label: '12V battery', blurb: 'Every car has one, EVs included. Terminals corrode, batteries die. Both are ten-minute jobs.', behind: 'hood' },
  oil: { id: 'oil', label: 'Oil cap & dipstick', blurb: 'The classic first DIY job. Check the level here, change it from underneath.', behind: 'hood' },
  airbox: { id: 'airbox', label: 'Air filter box', blurb: 'A clipped plastic box with a paper filter inside. Usually no tools at all.', behind: 'hood' },
  coolant: { id: 'coolant', label: 'Coolant reservoir', blurb: 'Translucent tank with MIN/MAX lines. Only ever open it cold.', behind: 'hood' },
  washer: { id: 'washer', label: 'Washer fluid', blurb: 'The tank with the windshield-and-spray symbol. Impossible to get wrong.', behind: 'hood' },
  fusebox_engine: { id: 'fusebox_engine', label: 'Engine fuse box', blurb: 'Black box with a lid near the battery. Holds the big fuses and relays.', behind: 'hood', related: ['fusebox_cabin'] },
  wiper: { id: 'wiper', label: 'Wipers', blurb: 'Blades wear every 6 to 12 months and clip on in seconds.' },
  headlight: { id: 'headlight', label: 'Headlights', blurb: 'Bulbs, turn signals and cloudy lenses. Reachable from the engine bay or wheel well.' },
  taillight: { id: 'taillight', label: 'Tail & brake lights', blurb: 'Usually reached from inside the trunk through a small access panel.' },
  wheel: { id: 'wheel', label: 'Wheels & tires', blurb: 'Pressure, rotations, plugs and the spare. Jack stands are not optional.', related: ['brakes'] },
  brakes: { id: 'brakes', label: 'Brakes', blurb: 'Pads are a solid intermediate job. Fluid level is a glance.' },
  trunk: { id: 'trunk', label: 'Trunk', blurb: 'Tail light access, spare tire, and struts that stop holding it up.', related: ['taillight'] },
  door: { id: 'door', label: 'Doors & mirrors', blurb: 'Mirror glass, weather strips and touch-up paint.', related: ['cabin', 'fusebox_cabin'] },
  cabin: { id: 'cabin', label: 'Cabin', blurb: 'Cabin filter, dome lights, key fob and the diagnostic port under the dash.', behind: 'door', seeThrough: true, related: ['fusebox_cabin'] },
  fusebox_cabin: { id: 'fusebox_cabin', label: 'Cabin fuse panel', blurb: 'Behind a small cover under or beside the dash. The diagram is on the lid.', behind: 'door' },
  fueldoor: { id: 'fueldoor', label: 'Fuel door', blurb: 'A loose or cracked gas cap is the most common check-engine light there is.' },
  exhaust: { id: 'exhaust', label: 'Exhaust', blurb: 'Oxygen sensors live here and are a frequent cause of check-engine codes.' },
  moto_tire: { id: 'moto_tire', label: 'Motorcycle tires', blurb: 'Two contact patches the size of your palm hold the whole bike up. Pressure and tread are worth a weekly look.', related: ['moto_brakes'] },
  moto_chain: { id: 'moto_chain', label: 'Motorcycle chain', blurb: 'Wants cleaning, lube and the right amount of slack every few hundred miles.' },
  moto_brakes: { id: 'moto_brakes', label: 'Motorcycle brakes', blurb: 'Discs and calipers at each wheel, fluid reservoirs on the bar and by the footpeg. Pads and fluid are a glance.' },
  moto_oil: { id: 'moto_oil', label: 'Motorcycle oil', blurb: 'The little window low on the engine shows the level at a glance.' },
  moto_battery: { id: 'moto_battery', label: 'Motorcycle battery', blurb: 'Lives under the seat. A bike that sits for weeks flattens it; a maintainer keeps it alive.', behind: 'moto_seat', seeThrough: true },
  moto_lights: { id: 'moto_lights', label: 'Motorcycle lights', blurb: 'Headlight, turn signals and tail light. Most bulbs are a few screws away.' },
  moto_controls: { id: 'moto_controls', label: 'Motorcycle levers & mirrors', blurb: 'Clutch and brake levers, the cables behind them, and the mirrors.', related: ['moto_brakes'] },
  bike_tire: { id: 'bike_tire', label: 'Bike tires', blurb: 'Low pressure causes most flats. A pump with a gauge and a spare tube fix nearly everything.' },
  bike_chain: { id: 'bike_chain', label: 'Bike chain', blurb: 'A clean, oiled chain shifts better and lasts longer. Chains also wear out and need replacing.', related: ['bike_gears'] },
  bike_brakes: { id: 'bike_brakes', label: 'Bike brakes', blurb: 'Rim brakes squeeze rubber pads on the wheel rim. Pads wear down and cables stretch.' },
  bike_gears: { id: 'bike_gears', label: 'Bike gears', blurb: 'The rear derailleur moves the chain across the cogs. One small knob fixes most skipping.', related: ['bike_chain'] },
  bike_saddle: { id: 'bike_saddle', label: 'Bike saddle', blurb: 'The right height saves your knees. One clamp sets it.' },
};

/** The id prefix says which vehicle a part is on; car parts have none. */
export type MotoPart = Extract<PartId, `moto_${string}`>;
export type BikePart = Extract<PartId, `bike_${string}`>;
export type CarPart = Exclude<PartId, MotoPart | BikePart>;
export const rideOf = (p: PartId): RideId => (p.startsWith('moto_') ? 'moto' : p.startsWith('bike_') ? 'bike' : 'car');

/** The lids to open for a part: the one it sits behind, or the part itself when it is a lid. */
export function lidsFor(p: PartId): LidId[] {
  const behind = PARTS[p].behind;
  return [...(behind ? [behind] : []), ...LIDS.filter((l) => l === p)];
}

export const PART_ORDER: PartId[] = [
  'hood', 'oil', 'airbox', 'battery', 'coolant', 'washer', 'fusebox_engine', 'engine',
  'wiper', 'headlight', 'taillight', 'wheel', 'brakes', 'trunk', 'door', 'cabin',
  'fusebox_cabin', 'fueldoor', 'exhaust',
  'moto_tire', 'moto_chain', 'moto_brakes', 'moto_oil', 'moto_battery', 'moto_lights', 'moto_controls',
  'bike_tire', 'bike_chain', 'bike_brakes', 'bike_gears', 'bike_saddle',
];
