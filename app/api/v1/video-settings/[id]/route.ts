import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'videoSettings.json');

// Ensure the data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Get default settings
const getDefaultSettings = () => ({
  src: '',
  type: 'application/x-mpegURL',
  isLive: false,
  poster: '',
  title: 'Live Stream',
  autoplay: true,
  muted: true,
  twitchChannel: ''
});

export async function GET() {
  try {
    ensureDataDir();
    
    if (!fs.existsSync(dataFilePath)) {
      // Return default settings if file doesn't exist
      return NextResponse.json(getDefaultSettings());
    }
    
    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    const videoSettings = JSON.parse(fileContent);
    
    return NextResponse.json(videoSettings);
  } catch (error) {
    console.error('Error fetching video settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    ensureDataDir();
    
    const data = await request.json();
    
    // Save the updated settings with twitchChannel
    fs.writeFileSync(dataFilePath, JSON.stringify({
      ...data,
      twitchChannel: data.twitchChannel || ''
    }, null, 2));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating video settings:', error);
    return NextResponse.json(
      { error: 'Failed to update video settings' },
      { status: 500 }
    );
  }
} 