<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useGlobalModalStore } from '@/stores/global-modal';

const store = useGlobalModalStore();
const { visible, currentComponent, componentProps } = storeToRefs(store);

function onUpdateShow(v: boolean) {
  if (!v) {
    store.closeModal();
  }
}

function onSuccess() {
  store.notifySuccess();
}
</script>

<template>
  <component
    :is="currentComponent"
    v-if="visible && currentComponent"
    :show="visible"
    v-bind="componentProps"
    @update:show="onUpdateShow"
    @close="store.closeModal"
    @success="onSuccess"
  />
</template>
