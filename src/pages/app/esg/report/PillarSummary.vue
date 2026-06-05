<script setup lang="ts">
import EsgIcons from '@/components/icons/EsgIcons.vue'

defineProps<{
  pillar: {
    icon: 'globe' | 'users' | 'building'
    title: string
    summary?: any
  }
}>()
</script>

<template>
  <div
      class="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition shadow-sm"
  >
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border">
        <EsgIcons :name="pillar.icon" class="text-slate-700" />
      </div>

      <h3 class="font-semibold text-slate-900">
        {{ pillar.title }}
      </h3>
    </div>

    <div class="text-sm text-slate-600 leading-relaxed">
      {{ pillar.summary?.description || 'بدون توضیح' }}
    </div>

    <div class="mt-4 flex gap-3 text-xs text-slate-500">
      <span>Avg: {{ pillar.summary?.avg_score ?? '—' }}</span>
      <span>Answered: {{ pillar.summary?.answered ?? 0 }}</span>
    </div>
  </div>
</template>