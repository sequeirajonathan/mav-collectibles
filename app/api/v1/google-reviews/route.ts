import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!placeId) {
    return NextResponse.json(
      { error: 'Google Place ID is not configured' },
      { status: 500 }
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
          fields: 'reviews',
          key: apiKey
        }
      }
    );

    if (response.data.error_message) {
      return NextResponse.json(
        { error: response.data.error_message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      reviews: response.data.result.reviews || []
    });
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews from Google Places API' },
      { status: 500 }
    );
  }
} 