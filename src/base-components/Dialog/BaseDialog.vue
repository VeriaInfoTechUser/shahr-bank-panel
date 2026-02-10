<script setup >
import {Dialog} from "@/base-components/Headless";
import Lucide from "@/base-components/Lucide";

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  hasFooter:{
    type: Boolean,
    default: false
  },
  size:{
    type: String,
    default: 'w-[95vw]'
  },
  title:{
    type: String,
    default:null
  }
});

const emit = defineEmits(['close','onSuccess']);

function close(){
  emit('close')
}

</script>

<template>
  <section>
    <Dialog
        :size="size??'w-[95vw]'"
        :open="open"
        @close="close"
    >
      <Dialog.Panel
          class="rounded-md"
      >
        <Dialog.Title class="bg-primary rounded-t-md text-white">
          <div class="relative w-full h-5">
            <strong class="text-base">
              {{title }}
            </strong>
          </div>
          <div @click="close" class="absolute top-3 end-3 mt-0 me-1 cursor-pointer w-5 h-5 bg-secondary rounded-full" >
            <Lucide icon="X" class="w-5 h-5 font-bold text-black"/>
          </div>
        </Dialog.Title>

          <slot></slot>

        <Dialog.Footer v-if="hasFooter">
          <slot name="footer"></slot>
        </Dialog.Footer>

      </Dialog.Panel>
    </Dialog>
  </section>
</template>

<style scoped>

</style>