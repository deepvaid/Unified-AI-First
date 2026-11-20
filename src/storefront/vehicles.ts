// The vehicles an auto parts store's shoppers pick from (Year, Make, Model), and
// a part's fitment rows are written against: ten of the best-selling cars, SUVs
// and pickups in the US, each sold there in every model year from 2015 to 2024.
// Makes and models are the manufacturers' own names; fitment rows name them the
// same way. Pure data, so Node tests and the store seeds read it directly.

/** A model and the model years it is offered for. */
export interface VehicleModel {
  make: string
  model: string
  yearFrom: number
  yearTo: number
}

export const VEHICLE_YEAR_FROM = 2015
export const VEHICLE_YEAR_TO = 2024

export const VEHICLES: readonly VehicleModel[] = [
  { make: 'Ford', model: 'F-150', yearFrom: 2015, yearTo: 2024 },
  { make: 'Chevrolet', model: 'Silverado 1500', yearFrom: 2015, yearTo: 2024 },
  { make: 'Ram', model: '1500', yearFrom: 2015, yearTo: 2024 },
  { make: 'Toyota', model: 'RAV4', yearFrom: 2015, yearTo: 2024 },
  { make: 'Honda', model: 'CR-V', yearFrom: 2015, yearTo: 2024 },
  { make: 'Toyota', model: 'Camry', yearFrom: 2015, yearTo: 2024 },
  { make: 'Honda', model: 'Civic', yearFrom: 2015, yearTo: 2024 },
  { make: 'Toyota', model: 'Tacoma', yearFrom: 2015, yearTo: 2024 },
  { make: 'Jeep', model: 'Wrangler', yearFrom: 2015, yearTo: 2024 },
  { make: 'Nissan', model: 'Rogue', yearFrom: 2015, yearTo: 2024 },
]
