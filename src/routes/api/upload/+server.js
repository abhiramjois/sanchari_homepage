import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

async function ensureImagesDir() {
  try {
    await fs.access(IMAGES_DIR);
  } catch {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
  }
}

export async function POST({ request }) {
  try {
    await ensureImagesDir();
    
    const formData = await request.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile || !imageFile.size) {
      return new Response(
        JSON.stringify({ error: 'No image file provided' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(imageFile.name);
    const filename = `${randomUUID()}${fileExtension}`;
    const filepath = path.join(IMAGES_DIR, filename);

    // Convert file to buffer and save
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filepath, buffer);

    return new Response(JSON.stringify({ 
      filename,
      originalName: imageFile.name,
      size: imageFile.size
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload image' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}