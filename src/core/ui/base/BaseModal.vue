<script setup lang="ts">
import Dialog from 'primevue/dialog';

withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    closable?: boolean;
    dismissableMask?: boolean;
  }>(),
  { closable: true, dismissableMask: true }
);

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'hide'): void;
}>();

function onHide() {
  emit('update:visible', false);
  emit('hide');
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="title"
    :closable="closable"
    :dismissableMask="dismissableMask"
    class="modal"
    :pt="{
      root: { class: 'modal-box' },
      header: { class: 'text-lg font-bold' },
      content: { class: 'py-4' },
      footer: { class: 'modal-action' },
    }"
    @update:visible="emit('update:visible', $event)"
    @hide="onHide"
  >
    <slot />
    <template #footer>
      <slot name="footer" />
    </template>
  </Dialog>
</template>
