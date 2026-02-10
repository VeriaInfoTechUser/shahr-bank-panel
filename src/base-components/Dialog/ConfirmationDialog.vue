<script setup>

import {Dialog} from "@/base-components/Headless";
import Lucide from "@/base-components/Lucide";
import Button from "@/base-components/Button";

defineProps({
  title: {
    type: String,
    default: ''
  },
  accept: {
    type: Function,
    required: true
  },
  deny: {
    type: Function,
    required: true
  },
  close: {
    type: Function,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  },
})

</script>

<template>

  <section>
    <Dialog
        :open="show"
        @close="close"
    >
      <Dialog.Panel
          class="rounded-md"
      >
        <Dialog.Title class="bg-primary rounded-t-md text-white">
          <div class="relative w-full h-5">
            <strong class="text-base">
              {{ $t('title.confirmation') }}
            </strong>
          </div>
          <div @click="close" class="absolute top-3 end-3 mt-0 me-1 cursor-pointer w-5 h-5 bg-secondary rounded-full">
            <Lucide icon="X" class="w-5 h-5 font-bold text-black"/>
          </div>
        </Dialog.Title>
        <p class="p-2 ps-5 text-base">
          <slot></slot>
        </p>
        <Dialog.Footer>
          <div class="flex col-md-12 items-end justify-end gap-2">
            <Button variant="outline-secondary" @click="deny" size="sm" class=" shadow-md justify-end items-end">
              {{ $t('button.cancel') }}
            </Button>
            <Button variant="primary" size="sm" @click="accept" class="shadow-md justify-end items-end">
              {{ $t('button.accept') }}
            </Button>
          </div>
        </Dialog.Footer>
      </Dialog.Panel>
    </Dialog>
  </section>


</template>

<style scoped>
:deep(td) {
  @apply   text-start hidden
}
</style>