<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
  }>(),
  {}
);
</script>

<template>
  <div class="card bg-base-100 shadow-xl border">
    <div v-if="title || $slots.header" class="card-body">
      <h2 v-if="title" class="card-title">{{ title }}</h2>
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-body pt-0">
      <slot name="footer" />
    </div>
  </div>
</template>
