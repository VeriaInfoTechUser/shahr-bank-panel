<script setup lang="ts">
import KpiCard from './KpiCard.vue';
import type { DashboardSection } from '../../types';

defineProps<{
  section: DashboardSection;
  translate?: (key: string) => string;
}>();
</script>

<template>
  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <KpiCard
      v-for="card in section.cards"
      :key="card.title"
      :item="card"
      :translate="translate"
    />
  </section>
</template>
