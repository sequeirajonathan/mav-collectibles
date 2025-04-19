import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { featureFlagSchema } from '@/lib/validations/feature-flags';

// GET all feature flags
export async function GET() {
  try {
    const { data, error } = await supabase.from('feature_flags').select('*');
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch feature flags' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

// POST to create a new feature flag
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = featureFlagSchema.parse(body);
    
    const { data, error } = await supabase
      .from('feature_flags')
      .insert(validatedData)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to create feature flag' },
      { status: 500 }
    );
  }
} 