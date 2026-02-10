<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import {
  MenuItems as HeadlessMenuItems,
  TransitionRoot,
} from "@headlessui/vue";
import { useAttrs, computed } from "vue";

interface ItemsProps
  extends /* @vue-ignore */ ExtractProps<typeof HeadlessMenuItems> {
  as?: string | object;
  placement?:
    | "top-start"
    | "top"
    | "top-end"
    | "end-start"
    | "right"
    | "end-end"
    | "bottom-end"
    | "bottom"
    | "bottom-start"
    | "start-start"
    | "left"
    | "start-end";
}


const { as = "div", placement = "bottom-end" } = defineProps<ItemsProps>();

const attrs = useAttrs();
const computedClass = computed(() =>
  twMerge([
    "p-2 shadow-[0px_3px_10px_#00000017] bg-white border-transparent rounded-md dark:bg-darkmode-600 dark:border-transparent",
    typeof attrs.class === "string" && attrs.class,
  ])
);
</script>

<template>
  <TransitionRoot
    as="template"
    enter="transition-all ease-linear duration-150"
    enterFrom="mt-5 invisible opacity-0 translate-y-1"
    enterTo="mt-1 visible opacity-100 translate-y-0"
    entered="mt-1"
    leave="transition-all ease-linear duration-150"
    leaveFrom="mt-1 visible opacity-100 translate-y-0"
    leaveTo="mt-5 invisible opacity-0 translate-y-1"
  >
    <div
      :class="[
        'absolute z-30',
        { 'start-0 bottom-[100%]': placement == 'top-start' },
        { 'start-[50%] translate-x-[-50%] bottom-[100%]': placement == 'top' },
        { 'end-0 bottom-[100%]': placement == 'top-end' },
        { 'start-[100%] translate-y-[-50%]': placement == 'end-start' },
        { 'start-[100%] top-[50%] translate-y-[-50%]': placement == 'right' },
        { 'start-[100%] bottom-0': placement == 'end-end' },
        { 'top-[100%] end-0': placement == 'bottom-end' },
        { 'top-[100%] start-[50%] translate-x-[-50%]': placement == 'bottom' },
        { 'top-[100%] start-0': placement == 'bottom-start' },
        { 'end-[100%] translate-y-[-50%]': placement == 'start-start' },
        { 'end-[100%] top-[50%] translate-y-[-50%]': placement == 'left' },
        { 'end-[100%] bottom-0': placement == 'start-end' },
      ]"
    >
      <HeadlessMenuItems as="template">
        <component
          :is="as"
          :class="computedClass"
          v-bind="_.omit(attrs, 'class')"
        >
          <slot></slot>
        </component>
      </HeadlessMenuItems>
    </div>
  </TransitionRoot>
</template>
