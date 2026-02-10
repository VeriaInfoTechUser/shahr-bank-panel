<script setup>
import {useField} from 'vee-validate';
import {toRef} from "vue";
import {FormLabel} from "@/base-components/Form";
import {useI18n} from "vue-i18n";

const {t: $t} = useI18n()
const props = defineProps({
  name: String,
  placeholder: String,
  value: String | Number | Boolean,
  modelValue: String | Number | Boolean,
  type: String,
  dir: {
    type: String,
    default: ""
  },
  label: {
    type: String,
    default: ""
  },
  hasLabel: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const name = toRef(props, 'name');
const {
  value,
  errorMessage,
} = useField(name, undefined, {
  syncVModel: true,
});
</script>

<template>
  <div>
    <FormLabel htmlFor="input-wizard-3" v-if="hasLabel">
      {{label}}
    </FormLabel>
    <div class="h-10">
      <input
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          :type="type || 'text'"
          :disabled="disabled"
          :dir="dir"
          :placeholder="placeholder||''"
          class="disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-darkmode-800/50 dark:disabled:border-transparent [&[readonly]]:bg-slate-100 [&[readonly]]:cursor-not-allowed [&[readonly]]:dark:bg-darkmode-800/50 [&[readonly]]:dark:border-transparent transition duration-200 ease-in-out w-full text-sm border-slate-200 shadow-sm rounded-md placeholder:text-slate-400/90 focus:ring-4 focus:ring-primary focus:ring-opacity-20 focus:border-primary focus:border-opacity-40 dark:bg-darkmode-800 dark:border-transparent dark:focus:ring-slate-700 dark:focus:ring-opacity-50 dark:placeholder:text-slate-500/80"
          :class="{
                  'border-secondary shadow-secondary/20 focus:ring-secondary focus:ring-opacity-10': !!errorMessage
                }"
      />
      <span v-if="errorMessage" class="text-slate-600 dark:text-slate-400 text-[10px] font-bold">
    * {{ $t(`message.${errorMessage}`) }}
    </span>
    </div>
  </div>
</template>

