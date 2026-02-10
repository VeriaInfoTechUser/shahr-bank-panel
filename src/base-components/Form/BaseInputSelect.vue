<script setup>
import {useField} from 'vee-validate';

const props = defineProps({

  title: String,
  label: String,
  name: {
    type: String,
    required: true,
  },
  modelValue: {},
  placeholder: String,
  options: {
    type: Array,
    default: [],
  },
  isMultiple: {
    type: Boolean,
    default: false,
  },
  hasDefaultErrorMessage: {
    type: Boolean,
    default: false,
  },
  hasLabel: {
    type: Boolean,
    default: true,
  },
  isPreselectFirst: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  id: {
    type: String,
    default: null,
  },
  trackedBy: {
    type: String,
    default: null,
  }
});
defineEmits(['update:modelValue'])
import Multiselect from "vue-multiselect";
import {toRef} from "vue";

const name = toRef(props, 'name');
const {
  value,
  errorMessage,
  handleBlur,
} = useField(name, undefined, {
  syncVModel: true,
});


</script>

<template>

  <div>
    <div class="label-text ms-0.5 mb-2" v-if="hasLabel">{{ title }}</div>
    <Multiselect
        :class="{
                  'border-secondary shadow-secondary/20 focus:ring-secondary focus:ring-opacity-10 shadow-sm rounded-md': !!errorMessage
                }"
        :data-tip="hasDefaultErrorMessage?`${$t('message.'+errorMessage)}`:errorMessage"
        :label="label"
        :name="name"
        :id="id"
        :multiple="isMultiple"
        :options="options"
        :placeholder="placeholder"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        @blur="handleBlur"
        class="grow text-base-content"
        :value="modelValue"
        :preserve-search="true"
        :track-by="trackedBy"
        deselectLabel=""
        selectLabel=""
        :selectedLabel="$t('form.selected')"
        :preselect-first="isPreselectFirst"
        :disabled="isDisabled"
    />
    <span v-if="errorMessage" class="text-slate-600 dark:text-slate-400 text-[10px] font-bold">
    * {{ $t(`message.${errorMessage}`) }}
    </span>
  </div>


</template>
<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style scoped>
:deep(.multiselect__tags) {
  @apply min-h-[34px] h-[38px]
}
</style>
