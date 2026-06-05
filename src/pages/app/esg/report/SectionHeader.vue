<template>
  <div class="flex items-center gap-3 mb-6">
    <div class="w-9 h-9 rounded-lg border bg-white flex items-center justify-center">
      <EsgIcons :name="props.icon || 'leaf'" class="text-slate-700" />
    </div>

    <h2 class="text-xl font-semibold text-slate-900">
      {{ props.title }}
    </h2>
  </div>
</template>

<script setup lang="ts">
import EsgIcons from '@/components/icons/EsgIcons.vue'
const props = withDefaults(defineProps<{ title: string; icon?: string }>(), { icon: 'leaf' })
</script>