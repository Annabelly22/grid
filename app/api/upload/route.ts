import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/upload — upload trade screenshot to Supabase Storage
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const filename = `${userId}/${timestamp}_${random}.${ext}`;

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('trade-screenshots')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      // If bucket doesn't exist, try to create it
      if (error.message?.includes('not found') || error.message?.includes('Bucket') || error.message?.includes('does not exist')) {
        // Create bucket and retry
        const { error: bucketError } = await supabase.storage.createBucket('trade-screenshots', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        });

        if (bucketError && !bucketError.message?.includes('already exists')) {
          console.error('Bucket creation error:', bucketError);
          return NextResponse.json({ error: `Storage setup failed: ${bucketError.message}` }, { status: 500 });
        }

        // Retry upload
        const { data: retryData, error: retryError } = await supabase.storage
          .from('trade-screenshots')
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (retryError) {
          console.error('Retry upload error:', retryError);
          return NextResponse.json({ error: `Upload retry failed: ${retryError.message}` }, { status: 500 });
        }

        const { data: urlData } = supabase.storage
          .from('trade-screenshots')
          .getPublicUrl(retryData.path);

        return NextResponse.json({ url: urlData.publicUrl });
      }

      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('trade-screenshots')
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 });
  }
}

// DELETE /api/upload — delete a trade screenshot
export async function DELETE(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Extract path from URL
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/trade-screenshots\/(.+)$/);
    if (!pathMatch) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const filePath = pathMatch[1];

    const { error } = await supabase.storage
      .from('trade-screenshots')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
