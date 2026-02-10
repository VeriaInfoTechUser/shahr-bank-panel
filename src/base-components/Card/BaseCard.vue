<script setup lang="ts">
import {FormSwitch} from "../Form";

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="intro-y box">
    <div
        :class="{'flex items-center px-2 text-base rounded-t-md font-medium border-b border-slate-200/60 dark:border-darkmode-400 pb-1 bg-secondary':title}"
    >
        <div class="w-56 text-sm"
             :class="{'p-1':title}"
        >
          {{ title }}
        </div>
        <slot name="header"></slot>
    </div>
    <div
        class="p-2 pb-4 rounded-md border-slate-200/60 dark:border-darkmode-400"
    >
      <div
          class="px-2 mt-2 text-sm"
      >
        <slot name="body"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>