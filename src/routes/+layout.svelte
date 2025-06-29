<script>
	import { page } from '$app/stores';
	import '../app.css';
  </script>
  
  <nav class="bg-yellow-200 sticky top-0 z-50 md:pt-10 pb-5">
	<div class="max-w-7xl mx-auto px-4 lg:px-0">
		<div class="flex items-center justify-between h-20">
			<!-- Title Section -->
			<a href="/" class="flex flex-col justify-center no-underline hover:underline">
				<h1 class="text-2xl md:text-5xl font-black text-gray-800">ಸಂಚಾರಿ ಲೋಕಲ್</h1>
				<h2 class="text-sm md:text-2xl font-semibold text-gray-600">Sanchari local</h2>
			</a>

			<!-- Right Side: About Button -->
			<div class="flex items-center space-x-4">
				<a
					href="/about"
					class="text-black border-2 border-black px-4 py-2 rounded-md hover:bg-yellow-400 transition text-sm sm:text-xl my-auto"
				>
					About
				</a>
			</div>
		</div>
	</div>
</nav>
  
  <main class="bg-yellow-200 min-h-screen pb-10">
	<slot />
  </main>
  
  <!-- No <style> block; everything is handled with Tailwind classes -->
  