// Where a store delivers, and who its checkout is filled in with.
//
// A store that sells in its own currency sells to its own part of the world: its
// checkout offers those countries, home first, and its sample shopper lives there.
// Every other store keeps the checkout it has always had. The sample shopper is
// what makes a test payment one press away. Pure, so Node can test it.

export interface ShopperAddress {
  firstName: string
  lastName: string
  address1: string
  city: string
  /** State or province; empty where addresses have none. */
  region: string
  postcode: string
  country: string
}

export interface CheckoutProfile {
  /** In the order the country list shows them: the store's home first. */
  countries: string[]
  /** What the region field is called ("State"), or null where addresses have none. */
  regionLabel: string | null
  shopper: ShopperAddress & { email: string }
  /** The order in the admin carries the address typed here, not a made-up one. */
  keepsAddress: boolean
}

const DEFAULT_PROFILE: CheckoutProfile = {
  countries: ['United States', 'Canada', 'Australia', 'New Zealand', 'United Kingdom'],
  regionLabel: 'State',
  shopper: {
    email: 'ava.brown@example.com',
    firstName: 'Ava',
    lastName: 'Brown',
    address1: '200 Market Street',
    city: 'San Francisco',
    region: 'CA',
    postcode: '94105',
    country: 'United States',
  },
  keepsAddress: false,
}

/** Sweden, then the Nordics, then the rest of the EU a Swedish store usually ships to. */
const SEK_PROFILE: CheckoutProfile = {
  countries: [
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland',
    'Austria', 'Belgium', 'Estonia', 'France', 'Germany', 'Ireland', 'Italy', 'Netherlands', 'Poland', 'Spain',
  ],
  regionLabel: null,
  shopper: {
    email: 'linnea.berg@example.com',
    firstName: 'Linnea',
    lastName: 'Berg',
    address1: 'Storgatan 12',
    city: 'Stockholm',
    region: '',
    postcode: '114 51',
    country: 'Sweden',
  },
  keepsAddress: true,
}

const BY_CURRENCY: Readonly<Record<string, CheckoutProfile>> = { SEK: SEK_PROFILE }

/** The checkout of a store that sells in `currency`; without one of its own, the usual checkout. */
export function checkoutProfile(currency?: string): CheckoutProfile {
  return (currency && BY_CURRENCY[currency.toUpperCase()]) || DEFAULT_PROFILE
}
