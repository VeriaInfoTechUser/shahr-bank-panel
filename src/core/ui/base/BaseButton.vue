<script setup lang="ts">
import Button from 'primevue/button';

withDefaults(
  defineProps<{
    label?: string;
    icon?: string;
    severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';
    size?: 'small' | 'large';
    loading?: boolean;
    disabled?: boolean;
  }>(),
  { severity: 'primary', loading: false, disabled: false }
);
</script>

<template>
  <Button
    :label="label"
    :icon="icon"
    :severity="severity"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    class="btn"
    :pt="{
      root: { class: 'btn btn-primary' },
    }"
    v-bind="$attrs"
  >
    <template v-if="$slots.default">
      <slot />
    </template>
  </Button>
</template>
