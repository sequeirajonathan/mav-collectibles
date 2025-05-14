export interface Location {
  id: string;
  name: string;
  address: {
    address_line_1: string;
    locality: string;
    administrative_district_level_1: string;
    postal_code: string;
    country: string;
  };
  timezone: string;
  capabilities: string[];
  status: string;
  business_name: string;
  type: string;
  website_url: string;
  business_hours: {
    periods: Array<{
      day_of_week: string;
      start_local_time: string;
      end_local_time: string;
    }>;
  };
  business_email: string;
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export const ACTIVE_LOCATIONS: Record<string, Location> = {
  brickAndMortar: {
    id: "LTZNXWZDB0FH9",
    name: "Brick & Mortar",
    address: {
      address_line_1: "19786 HWY 105 W STE 190",
      locality: "MONTGOMERY",
      administrative_district_level_1: "TX",
      postal_code: "77356",
      country: "US"
    },
    timezone: "America/Chicago",
    capabilities: [
      "CREDIT_CARD_PROCESSING",
      "AUTOMATIC_TRANSFERS"
    ],
    status: "ACTIVE",
    business_name: "Mav Collectibles",
    type: "PHYSICAL",
    website_url: "MAVCOLLECTIBLES.COM",
    business_hours: {
      periods: [
        {
          day_of_week: "SUN",
          start_local_time: "12:00:00",
          end_local_time: "22:00:00"
        },
        {
          day_of_week: "TUE",
          start_local_time: "12:00:00",
          end_local_time: "21:00:00"
        },
        {
          day_of_week: "WED",
          start_local_time: "12:00:00",
          end_local_time: "21:00:00"
        },
        {
          day_of_week: "THU",
          start_local_time: "12:00:00",
          end_local_time: "21:00:00"
        },
        {
          day_of_week: "FRI",
          start_local_time: "12:00:00",
          end_local_time: "22:00:00"
        },
        {
          day_of_week: "SAT",
          start_local_time: "12:00:00",
          end_local_time: "22:00:00"
        }
      ]
    },
    business_email: "fnrwholesalegoods@gmail.com",
    description: "TCG Hobby Shop & Collectibles",
    coordinates: {
      latitude: 30.3863778,
      longitude: -95.6665075
    }
  }
};

export const ACTIVE_LOCATION_IDS = Object.values(ACTIVE_LOCATIONS).map(location => location.id); 