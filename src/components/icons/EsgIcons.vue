<script setup lang="ts">
defineProps<{
  name: 'globe' | 'users' | 'building' | 'chart' | 'leaf' | 'shield'
}>()
</script>

<template>
  <svg
      v-if="name === 'globe'"
      xmlns="http://www.w3.org/2000/svg"
      class="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
  >
    <path stroke-width="1.8" d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0Z" />
    <path stroke-width="1.8" d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
  </svg>

  <svg v-else-if="name === 'users'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-width="1.8" d="M16 11a4 4 0 1 0-8 0a4 4 0 0 0 8 0Z" />
    <path stroke-width="1.8" d="M4 21a8 8 0 0 1 16 0" />
  </svg>

  <svg v-else-if="name === 'building'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-width="1.8" d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    <path stroke-width="1.8" d="M16 8h4v13" />
  </svg>

  <svg v-else-if="name === 'chart'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-width="1.8" d="M4 19h16" />
    <path stroke-width="1.8" d="M6 17V9M12 17V5M18 17v-6" />
  </svg>

  <svg v-else-if="name === 'leaf'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-width="1.8" d="M5 21c8 0 14-6 14-14C11 7 5 13 5 21Z" />
  </svg>

  <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-width="1.8" d="M12 2l9 4v6c0 5-3.5 9.5-9 10c-5.5-.5-9-5-9-10V6l9-4Z" />
  </svg>
</template>