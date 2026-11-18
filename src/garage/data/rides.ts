/** The three vehicles parked in the garage. */
export type RideId = 'car' | 'moto' | 'bike';
export const RIDES: RideId[] = ['car', 'moto', 'bike'];
export const RIDE_LABEL: Record<RideId, string> = { car: 'Car', moto: 'Motorcycle', bike: 'Bike' };
/** What a video search calls each ride when there's no year, make and model to go on. */
export const RIDE_SEARCH: Record<RideId, string> = { car: 'car', moto: 'motorcycle', bike: 'bicycle' };
