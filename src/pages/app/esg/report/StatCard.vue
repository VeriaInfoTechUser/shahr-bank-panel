<template>
  <div class="bg-white rounded-2xl p-8 text-center shadow">
    <div :class="`text-5xl font-bold text-${color}-600`">{{ value }}{{ suffix }}</div>
    <div class="text-gray-600 mt-3 font-medium">{{ label }}</div>
  </div>
</template>
<script setup>
defineProps({ label: String, value: [Number, String], color: String, suffix: { type: String, default: '' } })
</script>