<script>
    const services = [
      {
        port: 3000,
        name: "Arvind Gupta Toys Interface",
        description: "A curated, searchable collection of educational science toys and experiments."
      },
      {
        port: 4000,
        name: "Kiwix",
        description: "Offline access to Wikipedia and other knowledge repositories."
      },
      {
        port: 5000,
        name: "Kolibri",
        description: "A rich library of StoryWeaver books and educational resources from Pratham."
      },
      {
        port: 6000,
        name: "Jellyfin",
        description: "A local media center with videos, music, and movies."
      }
    ];
  </script>
  
  <style>
    .port {
      font-family: monospace;
      background-color: #facc15;
      padding: 0.1rem 0.4rem;
      border-radius: 0.25rem;
    }
  </style>
  
  <section class="bg-yellow-200 px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row">
        <div class="w-full sm:w-1/2 space-y-8">
            <img src="sanchari.png" alt="Sanchari" class="w-full h-auto object-contain" />
            <!-- <div class="space-y-4">
              <h2 class="text-2xl font-semibold text-gray-800">What's on Sanchari?</h2>
            </div> -->
          </div>
        
        <!-- Left Column: Text -->
        <div class="w-full sm:w-1/2 space-y-6">
          <!-- <h1 class="text-3xl sm:text-4xl font-bold text-gray-800">About Sanchari</h1> -->
          <p class="text-base sm:text-lg text-gray-700 leading-relaxed">
            A Sanchari is a storyteller, a bearded man carrying a cross body sling bag with items that he uses are props, objects and characters to narrate stories. He travels the world telling stories about his hometown. He tells them about the disappearing lake, the magic ring around the village that protects it, the mud road in the forest that devours and the extra growth in the king's deaf ear that could not be cured by any medicine.
          </p>
          <p class="text-base sm:text-lg text-gray-700 leading-relaxed">
            People in golden crowns, velvet clothes and satin dhotis from all over the world reward him with grains and rice. A few even give him clothes to take back home for him and his people. "We must visit this magical land of yours" they say "We will bring gifts and clothes for everyone when we come". They seldom do.
          </p>
          <p class="text-base sm:text-lg text-gray-700 leading-relaxed">
            A few others do not like his stories. They tell him that he has been telling the same story for centuries, "Times have changed now" they say. Upon his return back home, children gather around him to hear about the worlds he visited. He brings them toys to play with, songs to sing and stories about the world. He tells them about the wealthy merchant that wants to go to a new planet, the apple tree that grows orange apples and the robots that are writing poems and love letters.
          </p>
          <p class="text-base sm:text-lg text-gray-700 leading-relaxed">
            His stories are an extension of him, he; an embodiment of his place. He is the internet, an internet, an infrastructure, aware of the place, lives in the places, gets stories from all over the world, to the place.
          </p>
        </div>
      </div>
      <!-- <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {#each services as service}
          <li class="bg-white border border-gray-200 shadow-sm rounded-lg p-4 hover:shadow-md transition">
            <div class="flex items-center justify-between mb-1">
              <h3 class="text-lg font-semibold text-gray-800">{service.name}</h3>
              <span class="port">:{service.port}</span>
            </div>
            <p class="text-gray-600 text-sm">{service.description}</p>
          </li>
        {/each}
      </ul> -->
    </div>
  </section>
  