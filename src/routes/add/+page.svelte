<script>
  import { onMount } from 'svelte';
  import { saveItem, uploadImage, uploadAudio, getAudioDuration, loadItems, updateItems, deleteAudio } from '$lib/utils.js';  import { goto } from '$app/navigation';

  let title = '';
  let url = '';
  let imageFile = null;
  let imagePreview = null;
  let audioFile = null;
  let audioPreview = null;
  let audioDuration = 0;
  let loading = false;
  let error = null;
  let items = [];
  let editingItem = null;
  let editingIndex = -1;

  // Audio recording variables
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let recordingTime = 0;
  let recordingInterval = null;
  let recordedAudioBlob = null;
  let audioRemoved = false;

  onMount(async () => {
    try {
      items = await loadItems();
    } catch (e) {
      error = e.message;
    }
  });

  function handleImageChange(event) {
    const file = event.target.files[0];
    if (file) {
      imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleAudioChange(event) {
    const file = event.target.files[0];
    if (file) {
      try {
        // Check if it's an audio file
        if (!file.type.startsWith('audio/')) {
          error = 'Please select a valid audio file';
          return;
        }

        // Check duration
        const duration = await getAudioDuration(file);
        if (duration > 120) { // 2 minutes = 120 seconds
          error = 'Audio file must be 2 minutes or shorter';
          event.target.value = ''; // Clear the input
          return;
        }

        audioFile = file;
        audioDuration = duration;
        audioPreview = URL.createObjectURL(file);
        recordedAudioBlob = null; // Clear any recorded audio
        error = null;
      } catch (e) {
        error = 'Could not process audio file: ' + e.message;
        event.target.value = '';
      }
    }
  }

  // Audio recording functions
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      recordingTime = 0;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        recordedAudioBlob = audioBlob;
        
        // Create preview URL
        if (audioPreview) {
          URL.revokeObjectURL(audioPreview);
        }
        audioPreview = URL.createObjectURL(audioBlob);
        
        // Get duration of recorded audio
        try {
          audioDuration = await getAudioDuration(audioBlob);
        } catch (e) {
          console.warn('Could not get audio duration:', e);
          audioDuration = recordingTime;
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Clear file input since we're using recorded audio
        audioFile = null;
        const audioInput = document.getElementById('audio');
        if (audioInput) audioInput.value = '';
      };
      
      mediaRecorder.start();
      isRecording = true;
      
      // Start timer
      recordingInterval = setInterval(() => {
        recordingTime++;
        if (recordingTime >= 120) { // Stop at 2 minutes
          stopRecording();
        }
      }, 1000);
      
      error = null;
    } catch (e) {
      error = 'Could not access microphone: ' + e.message;
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
      }
    }
  }

  function cancelRecording() {
    if (isRecording) {
      // Stop recording and discard the audio
      if (mediaRecorder) {
        mediaRecorder.stop();
        isRecording = false;
        if (recordingInterval) {
          clearInterval(recordingInterval);
          recordingInterval = null;
        }
      }
    }
    
    // Clear recorded audio
    recordedAudioBlob = null;
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
      audioPreview = null;
    }
    audioDuration = 0;
    recordingTime = 0;
    
    // Clear file input as well
    audioFile = null;
    const audioInput = document.getElementById('audio');
    if (audioInput) audioInput.value = '';
  }

  function removeAudio() {
  // Clear all audio (both recorded and uploaded)
  recordedAudioBlob = null;
  audioFile = null;
  if (audioPreview) {
    URL.revokeObjectURL(audioPreview);
    audioPreview = null;
  }
  audioDuration = 0;
  recordingTime = 0;
  
  // Mark that audio was intentionally removed
  if (editingItem && editingItem.audio) {
    audioRemoved = true;
  }
  
  const audioInput = document.getElementById('audio');
  if (audioInput) audioInput.value = '';
  }

  function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function resetForm() {
  title = '';
  url = '';
  imageFile = null;
  imagePreview = null;
  audioFile = null;
  audioPreview = null;
  audioDuration = 0;
  editingItem = null;
  editingIndex = -1;
  error = null;
  audioRemoved = false; // Reset this flag
  
  // Clear recording state
  recordedAudioBlob = null;
  if (isRecording) {
    cancelRecording();
  } else {
    removeAudio();
  }
}

function editItem(item, index) {
  editingItem = item;
  editingIndex = index;
  title = item.title;
  url = item.url || '';
  imagePreview = item.image ? `/api/images/${item.image}` : null;
  audioPreview = item.audio ? `/api/audio/${item.audio}` : null;
  imageFile = null;
  audioFile = null;
  audioDuration = 0;
  recordedAudioBlob = null;
  audioRemoved = false; // Reset this flag when editing
}

async function handleSubmit() {
  if (!title.trim()) {
    error = 'Title is required';
    return;
  }

  loading = true;
  error = null;

  try {
    let imagePath = editingItem?.image || null;
    let audioPath = editingItem?.audio || null;
    let oldAudioPath = null;
    
    // Keep track of old audio for cleanup
    if (editingItem && editingItem.audio) {
      oldAudioPath = editingItem.audio;
    }
    
    // Upload image if provided
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile);
      imagePath = uploadResult.filename;
    }

    // Handle audio logic
    if (audioFile) {
      // New audio file uploaded
      const uploadResult = await uploadAudio(audioFile);
      audioPath = uploadResult.filename;
    } else if (recordedAudioBlob) {
      // New audio recorded
      const audioFileName = `recording_${Date.now()}.webm`;
      const audioFileFromBlob = new File([recordedAudioBlob], audioFileName, { type: 'audio/webm' });
      const uploadResult = await uploadAudio(audioFileFromBlob);
      audioPath = uploadResult.filename;
    } else if (audioRemoved) {
      // Audio was intentionally removed
      audioPath = null;
    }
    // If none of the above, keep existing audioPath (editingItem?.audio)

    const itemData = {
      title: title,
      url: url.trim() || null,
      image: imagePath,
      audio: audioPath,
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    if (editingItem) {
      // Update existing item
      items[editingIndex] = itemData;
      await updateItems(items);
      
      // Clean up old audio file if it was replaced or removed
      if (oldAudioPath && oldAudioPath !== audioPath) {
        await deleteAudio(oldAudioPath);
      }
    } else {
      // Add new item
      await saveItem(itemData);
      items = await loadItems();
    }

    resetForm();
  } catch (e) {
    error = e.message;
  } finally {
    loading = false;
  }
}

async function deleteItem(index) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  
  const itemToDelete = items[index];
  
  // Clean up associated audio file
  if (itemToDelete.audio) {
    await deleteAudio(itemToDelete.audio);
  }
  
  items.splice(index, 1);
  items = [...items];
  
  try {
    await updateItems(items);
  } catch (e) {
    error = e.message;
  }
}

  async function moveItem(index, direction) {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const item = items[index];
    
    items.splice(index, 1);
    items.splice(newIndex, 0, item);
    items = [...items];

    try {
      await updateItems(items);
    } catch (e) {
      error = e.message;
    }
  }
</script>

<svelte:head>
  <title>Manage Items - Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 lg:px-0 pb-6">
  <h2 class="text-2xl font-bold mb-4">Manage Items</h2>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  <!-- Responsive layout: form left, list right -->
  <div class="flex flex-col lg:flex-row gap-6">
    <!-- Form -->
    <div class="bg-white rounded-lg shadow-md p-6 w-full lg:w-1/2">
      <h3 class="text-lg font-semibold mb-4">
        {editingItem ? 'Edit Item' : 'Add New Item'}
      </h3>

      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <textarea
          id="title"
          bind:value={title}
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter item title"
          rows="3"
        />
        </div>

        <div>
          <label for="url" class="block text-sm font-medium text-gray-700 mb-1">URL (optional)</label>
          <input
            id="url"
            type="url"
            bind:value={url}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label for="image" class="block text-sm font-medium text-gray-700 mb-1">
            Image {editingItem ? '(upload new to replace)' : '(optional)'}
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            on:change={handleImageChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {#if imagePreview}
            <img src={imagePreview} alt="Preview" class="mt-3 w-32 h-32 object-cover rounded-md" />
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Audio (max 2 minutes) {editingItem ? '(upload new to replace)' : '(optional)'}
          </label>

          <!-- Audio Recording Controls -->
          <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-700">Record Audio</span>
              {#if isRecording}
                <span class="text-sm text-red-600 font-medium">
                  Recording: {formatDuration(recordingTime)} / 2:00
                </span>
              {/if}
            </div>
            
            <div class="flex gap-2 flex-wrap">
              {#if !isRecording}
                <button
                  type="button"
                  on:click={startRecording}
                  class="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                  Start Recording
                </button>
              {:else}
                <button
                  type="button"
                  on:click={stopRecording}
                  class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z"/>
                  </svg>
                  Save Recording
                </button>
                <button
                  type="button"
                  on:click={cancelRecording}
                  class="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm"
                >
                  Discard
                </button>
              {/if}
            </div>
          </div>

          <!-- File Upload (alternative to recording) -->
          <div class="mb-3">
            <span class="text-sm text-gray-600 mb-2 block">Or upload an audio file:</span>
            <input
              id="audio"
              type="file"
              accept="audio/*"
              on:change={handleAudioChange}
              disabled={recordedAudioBlob !== null}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {#if recordedAudioBlob}
              <p class="text-xs text-gray-500 mt-1">File upload disabled while recorded audio is present</p>
            {/if}
          </div>

          <!-- Audio Preview -->
          {#if audioPreview}
            <div class="mt-3 p-3 bg-gray-50 rounded-md">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">
                  Audio Preview {recordedAudioBlob ? '(Recorded)' : '(Uploaded)'}
                </span>
                <div class="flex items-center gap-2">
                  {#if audioDuration > 0}
                    <span class="text-sm text-gray-500">Duration: {formatDuration(audioDuration)}</span>
                  {/if}
                  <button
                    type="button"
                    on:click={removeAudio}
                    class="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs"
                    title="Remove audio"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <audio controls class="w-full">
                <source src={audioPreview} />
                Your browser does not support the audio element.
              </audio>
            </div>
          {/if}
        </div>

        <div class="flex flex-wrap gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || isRecording}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition"
          >
            {loading ? (editingItem ? 'Updating...' : 'Adding...') : (editingItem ? 'Update Item' : 'Add Item')}
          </button>
          {#if editingItem}
            <button
              type="button"
              on:click={resetForm}
              disabled={isRecording}
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 rounded-md transition"
            >
              Cancel Edit
            </button>
          {/if}
        </div>
      </form>
    </div>

    <!-- Item List -->
    <div class="bg-white rounded-lg shadow-md w-full lg:w-1/2 flex flex-col">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold">Items List ({items.length})</h3>
      </div>

      {#if items.length === 0}
        <div class="p-6 text-center text-gray-500">No items yet. Add your first item above.</div>
      {:else}
        <div class="divide-y divide-gray-200">
          {#each items as item, index}
            <div class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
              <div class="flex items-center gap-4 w-full">
                {#if item.image}
                  <img src={`/api/images/${item.image}`} alt={item.title} class="w-16 h-16 object-cover rounded-md" />
                {:else}
                  <div class="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-sm text-gray-400">No img</div>
                {/if}

                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900">{item.title}</h4>
                  <div class="space-y-1 overflow-hidden break-words">
                    {#if item.url}
                      <a
                        href={item.url}
                        target="_blank"
                        title={item.url}
                        class="text-blue-600 hover:underline text-sm block break-words whitespace-normal w-full"
                        style="word-break: break-word;"
                      >
                        {item.url}
                      </a>
                    {:else}
                      <span class="text-gray-500 text-sm">No URL</span>
                    {/if}
                    {#if item.audio}
                      <div class="flex items-center text-green-600 text-sm">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                        Audio attached
                      </div>
                    {/if}
                  </div>
                </div>                            
              </div>

              <div class="flex gap-2">
                <button
                  class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  on:click={() => moveItem(index, 'up')}
                  disabled={index === 0}
                >↑</button>
                <button
                  class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  on:click={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                >↓</button>
                <button
                  class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                  on:click={() => editItem(item, index)}
                >Edit</button>
                <button
                  class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                  on:click={() => deleteItem(index)}
                >Delete</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>