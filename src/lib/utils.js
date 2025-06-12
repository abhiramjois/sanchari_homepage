// lib/utils.js - Add deleteAudio function
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  
  return await response.json();
}

export async function uploadAudio(file) {
  // Check file duration before upload
  const duration = await getAudioDuration(file);
  if (duration > 120) { // 120 seconds = 2 minutes
    throw new Error('Audio file must be 2 minutes or shorter');
  }
  
  const formData = new FormData();
  formData.append('audio', file);
  
  const response = await fetch('/api/upload-audio', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Audio upload failed');
  }
  
  return await response.json();
}

// NEW: Function to delete audio files
export async function deleteAudio(filename) {
  if (!filename) return;
  
  try {
    const response = await fetch('/api/upload-audio', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename })
    });
    
    if (!response.ok) {
      console.warn(`Failed to delete audio file: ${filename}`);
    }
  } catch (error) {
    console.warn(`Error deleting audio file ${filename}:`, error);
  }
}

export function getAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    
    audio.onerror = () => {
      reject(new Error('Could not load audio file'));
    };
    
    audio.src = URL.createObjectURL(file);
  });
}

export async function saveItem(item) {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  });
  
  if (!response.ok) {
    throw new Error('Failed to save item');
  }
  
  return await response.json();
}

export async function loadItems() {
  const response = await fetch('/api/items');
  if (!response.ok) {
    throw new Error('Failed to load items');
  }
  return await response.json();
}

export async function updateItems(items) {
  const response = await fetch('/api/items', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update items');
  }
  
  return await response.json();
}