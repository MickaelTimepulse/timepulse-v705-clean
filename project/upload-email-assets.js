import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadAssets() {
  try {
    console.log('📤 Uploading email assets to Supabase Storage...');

    // Upload Timepulse logo
    const logoBuffer = readFileSync('./public/time copy.png');

    const { data: logoData, error: logoError } = await supabase.storage
      .from('email-assets')
      .upload('timepulse-logo.png', logoBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (logoError) {
      console.error('❌ Error uploading logo:', logoError);
    } else {
      console.log('✅ Logo uploaded successfully');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('email-assets')
        .getPublicUrl('timepulse-logo.png');

      console.log('🔗 Public URL:', publicUrl);
    }

    // Upload background image if you want
    const bgBuffer = readFileSync('./public/coureur victoire 1.jpeg');

    const { data: bgData, error: bgError } = await supabase.storage
      .from('email-assets')
      .upload('email-header-bg.jpeg', bgBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (bgError) {
      console.error('❌ Error uploading background:', bgError);
    } else {
      console.log('✅ Background uploaded successfully');

      const { data: { publicUrl } } = supabase.storage
        .from('email-assets')
        .getPublicUrl('email-header-bg.jpeg');

      console.log('🔗 Public URL:', publicUrl);
    }

  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadAssets();
