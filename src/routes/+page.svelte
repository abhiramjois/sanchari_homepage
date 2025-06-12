<script>
  import { onMount } from "svelte";
  import { loadItems } from "$lib/utils.js";

  let items = [];
  let loading = true;
  let error = null;
  let currentlyPlaying = null;
  let audioElements = {};

  onMount(async () => {
    try {
      items = await loadItems();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  function toggleAudio(index, audioSrc) {
    // Stop currently playing audio
    if (currentlyPlaying !== null && currentlyPlaying !== index) {
      const prevAudio = audioElements[currentlyPlaying];
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    const audio = audioElements[index];
    if (audio) {
      if (audio.paused) {
        audio.play();
        currentlyPlaying = index;
      } else {
        audio.pause();
        currentlyPlaying = null;
      }
    }
  }

  function handleAudioEnd(index) {
    currentlyPlaying = null;
  }

  function handleAudioError(index) {
    console.error(`Audio error for item ${index}`);
  }
</script>

<svelte:head>
  <title>Dashboard - Items</title>
</svelte:head>

<div class="mb-6 py-6 px-5 lg:px-0 max-w-7xl mx-auto">
  {#if error}
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
    >
      Error: {error}
    </div>
  {/if}

  {#if loading}
    <div class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"
      ></div>
      <p class="mt-2">Loading items...</p>
    </div>
  {:else if items.length === 0}
    <div class="text-center py-8">
      <p class="text-gray-600">
        No items found. <a href="/add" class="text-blue-600 hover:underline"
          >Add your first item</a
        >
      </p>
    </div>
  {:else}
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-9xl mx-auto"
    >
      {#each items as item, index (item.title + index)}
        <!-- Inside the card rendering loop -->
        <div
  class="bg-white shadow-md rounded-lg overflow-hidden transform transition duration-200 flex flex-col h-full"
>
  <!-- Image -->
  <div class="relative">
    {#if item.image}
      <div class="aspect-w-16 aspect-h-9">
        <img
          src={`/api/images/${item.image}`}
          alt={item.title}
          class="object-cover w-full h-full"
          loading="lazy"
        />
      </div>
    {:else}
      <div class="w-full h-48 bg-gray-200 flex items-center justify-center">
        <span class="text-gray-500">No Image</span>
      </div>
    {/if}
  </div>

  <!-- Card content -->
  <div class="flex flex-col flex-1">
    <!-- Flexible height title -->
    <div class="text-gray-900 p-3 py-5 lg:p-6 font-bold text-xl lg:text-2xl my-auto">
      {@html item.title.replace(/\n/g, "<br>")}
    </div>

    <!-- Bottom section pinned to bottom -->
    <div class="mt-auto">
      {#if item.audio}
        <audio
          bind:this={audioElements[index]}
          src={`/api/audio/${item.audio}`}
          on:ended={() => handleAudioEnd(index)}
          on:error={() => handleAudioError(index)}
          preload="metadata"
          controls
          class="w-full"
        ></audio>
      {/if}

      {#if item.url}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-block w-full font-bold p-3 text-center bg-pink-600 text-white hover:bg-pink-900 text-md lg:text-lg"
        >
          View
        </a>
      {/if}
    </div>
  </div>
</div>
      {/each}
    </div>
  {/if}
</div>
