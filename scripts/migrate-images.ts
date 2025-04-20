import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

async function migrateImages() {
  try {
    // Get all featured events
    const eventsResponse = await fetch(`${config.baseUrl}/api/featured-events`);
    const events = await eventsResponse.json();
    
    for (const event of events) {
      // Check if the image is a local path
      if (event.imageSrc.startsWith('/images/')) {
        const fileName = path.basename(event.imageSrc);
        
        try {
          // Try to fetch the local image
          const localImagePath = path.join(process.cwd(), 'public', event.imageSrc);
          
          if (fs.existsSync(localImagePath)) {
            // Upload to Supabase
            const fileContent = fs.readFileSync(localImagePath);
            const filePath = `events/${fileName}`;
            
            const { error } = await supabase.storage
              .from('images')
              .upload(filePath, fileContent, {
                contentType: 'image/png',
                upsert: true
              });
              
            if (error) throw error;
            
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
              .from('images')
              .getPublicUrl(filePath);
              
            // Update the event with the new URL
            await fetch(`${config.baseUrl}/api/featured-events/${event.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ imageSrc: publicUrlData.publicUrl }),
            });
            
            console.log(`Migrated image for event ${event.id}: ${fileName}`);
          } else {
            console.error(`Local image not found: ${localImagePath}`);
          }
        } catch (error) {
          console.error(`Error migrating image for event ${event.id}:`, error);
        }
      }
    }
    
    console.log('Image migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateImages(); 