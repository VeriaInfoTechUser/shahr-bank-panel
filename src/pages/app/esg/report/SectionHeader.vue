<template>
  <div class="flex items-center gap-3 mb-6">
    <div class="w-9 h-9 rounded-lg border bg-white flex items-center justify-center">
      <EsgIcons :name="iconMap[icon]" class="text-slate-700" />
    </div>

    <h2 class="text-xl font-semibold text-slate-900">
      {{ title }}
    </h2>
  </div>
</template>

<script setup lang="ts">
import EsgIcons from '@/components/icons/EsgIcons.vue'

defineProps<{ title: string; icon: string }>()

const iconMap: Record<string, any> = {
  '🌍': 'leaf',
  '👥': 'users',
  '🏢': 'building',
}
</script>