<template>
  <div class="mb-8">
    <div class="flex items-center gap-4">
      <div class="text-4xl">{{ icon }}</div>
      <h2 class="text-3xl font-bold text-gray-800">{{ title }}</h2>
    </div>
    <div class="h-1 w-20 bg-emerald-600 mt-3"></div>
  </div>
</template>
<script setup>
defineProps({ title: String, icon: String })
</script>