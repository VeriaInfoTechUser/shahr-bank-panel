import { defineStore } from 'pinia';
import { ref, shallowRef, nextTick, markRaw } from 'vue';
import type { Component } from 'vue';

export type GlobalModalOpenOptions = {
  component: Component;
  /** Props for the modal component (`show` is provided by the host). */
  props?: Record<string, unknown>;
  onSuccess?: () => void;
  onClosed?: () => void;
};

export const useGlobalModalStore = defineStore('globalModal', () => {
  const visible = ref(false);
  const currentComponent = shallowRef<Component | null>(null);
  const componentProps = ref<Record<string, unknown>>({});

  let onSuccessHandler: (() => void) | null = null;
  let onClosedHandler: (() => void) | null = null;

  function openModal(options: GlobalModalOpenOptions) {
    currentComponent.value = markRaw(options.component);
    componentProps.value = { ...(options.props ?? {}) };
    onSuccessHandler = options.onSuccess ?? null;
    onClosedHandler = options.onClosed ?? null;
    visible.value = true;
  }

  function closeModal() {
    if (!visible.value) {
      return;
    }
    visible.value = false;
    nextTick(() => {
      currentComponent.value = null;
      componentProps.value = {};
      onSuccessHandler = null;
      const closed = onClosedHandler;
      onClosedHandler = null;
      closed?.();
    });
  }

  function notifySuccess() {
    onSuccessHandler?.();
  }

  return {
    visible,
    currentComponent,
    componentProps,
    openModal,
    closeModal,
    notifySuccess,
  };
});
