<script setup>
import { ErrorMessage as VeeErrorMessage } from 'vee-validate';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps({
  name: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: 'text-red-600 dark:text-red-400 text-xs mt-1 block'
  }
});
</script>

<template>
  <VeeErrorMessage :name="name" v-slot="{ message }">
    <span :class="props.class">
      * {{ t(`message.${message}`) }}
    </span>
  </VeeErrorMessage>
</template>

