<script setup lang="ts">
import { computed, nextTick } from 'vue';
import Dialog from 'primevue/dialog';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    closable?: boolean;
    dismissableMask?: boolean;
    rootClass?: string;
  }>(),
  {
    closable: true,
    dismissableMask: true,
    rootClass:
      'max-w-4xl w-[min(100%,56rem)] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800',
  }
);

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'hide'): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
});

function onHide() {
  emit('update:visible', false);
  emit('hide');
}

function onDialogShow() {
  nextTick(() => {
    setTimeout(() => {
      const wrap = document.querySelector('[data-autofocus-modal]');
      const el = wrap?.querySelector(
        'input:not([type="hidden"]), textarea'
      ) as HTMLElement | null;
      el?.focus({ preventScroll: true });
    }, 150);
  });
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="title"
    :closable="closable"
    :dismissableMask="dismissableMask"
    append-to="body"
    :modal="true"
    :pt="{
      root: {
        class: props.rootClass,
      },
      title: {
        class:
          'font-normal leading-tight text-slate-700 dark:text-slate-200 !text-[16px]',
      },
      content: { class: 'text-sm' },
      footer: {
        class:
          'flex flex-wrap items-center justify-end gap-2',
      },
      pcCloseButton: { root: { class: '!h-7 !w-7 min-h-0' } },
    }"
    @hide="onHide"
    @show="onDialogShow"
  >
    <div class="p-2">
    <slot />
    </div>
    <template #footer>
      <slot name="footer" />
    </template>
  </Dialog>
</template>
