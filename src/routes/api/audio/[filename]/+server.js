import fs from 'fs/promises';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'data', 'audio');

export async function GET({ params }) {
  try {
    const { filename } = params;
    const filepath = path.join(AUDIO_DIR, filename);
    
    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new Response('Invalid filename', { status: 400 });
    }
    
    const file = await fs.readFile(filepath);
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
      '.webm': 'audio/webm'
    };
    
    const contentType = contentTypes[ext] || 'audio/mpeg';
    
    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Accept-Ranges': 'bytes'
      }
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return new Response('Audio not found', { status: 404 });
    }
    
    console.error('Error serving audio:', error);
    return new Response('Internal server error', { status: 500 });
  }
}