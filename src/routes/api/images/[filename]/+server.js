import fs from 'fs/promises';
import path from 'path';

const IMAGES_DIR = path.join(process.cwd(), 'data', 'images');

export async function GET({ params }) {
  try {
    const { filename } = params;
    const filepath = path.join(IMAGES_DIR, filename);
    
    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new Response('Invalid filename', { status: 400 });
    }
    
    const file = await fs.readFile(filepath);
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return new Response('Image not found', { status: 404 });
    }
    
    console.error('Error serving image:', error);
    return new Response('Internal server error', { status: 500 });
  }
}