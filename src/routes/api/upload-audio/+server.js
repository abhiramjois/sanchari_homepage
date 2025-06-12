// api/upload-audio/+server.js - Add DELETE method for cleanup
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');

async function ensureAudioDir() {
  try {
    await fs.access(AUDIO_DIR);
  } catch {
    await fs.mkdir(AUDIO_DIR, { recursive: true });
  }
}

export async function POST({ request }) {
  try {
    await ensureAudioDir();
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile || !audioFile.size) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return new Response(
        JSON.stringify({ error: 'File must be an audio file' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check file size (optional: ~20MB limit for 2 minutes of audio)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (audioFile.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Audio file too large' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(audioFile.name);
    const filename = `${randomUUID()}${fileExtension}`;
    const filepath = path.join(AUDIO_DIR, filename);

    // Convert file to buffer and save
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filepath, buffer);

    return new Response(JSON.stringify({
      filename,
      originalName: audioFile.name,
      size: audioFile.size
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload audio' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// ADD DELETE method to remove unused audio files
export async function DELETE({ request }) {
  try {
    const { filename } = await request.json();
    
    if (!filename) {
      return new Response(
        JSON.stringify({ error: 'Filename is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new Response(
        JSON.stringify({ error: 'Invalid filename' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const filepath = path.join(AUDIO_DIR, filename);
    
    try {
      await fs.unlink(filepath);
      return new Response(
        JSON.stringify({ success: true, message: 'File deleted successfully' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, consider it already deleted
        return new Response(
          JSON.stringify({ success: true, message: 'File not found (already deleted)' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting audio file:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete audio file' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}