<script setup>
import {ref, watch, toRef} from 'vue'
import {useField} from 'vee-validate';

const props = defineProps({
  allowedTypes: {
    default: "image/jpg, image/jpeg,image/png",
  },
  label: {
    default: null,
    type: String,
  },
  customClass: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  hasDefaultErrorMessage: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits()
const file = ref(null)
const error = ref('')
const selectedFile = ref(null)
const filePreview = ref('')

function handleFileUpload(event) {
  selectedFile.value = event.target.files[0]
  if (selectedFile.value) {
    if (!props.allowedTypes.includes(selectedFile.value.type)) {
      error.value = 'Invalid file type. Allowed types are JPG, PNG, and PDF.'
      file.value = null
      emit('update:file', null)  // Clear the file in the parent if invalid
    } else {
      error.value = ''
      file.value = selectedFile.value
      filePreview.value = URL.createObjectURL(file.value)  // Create preview URL for image
      emit('update:file', file.value)  // Emit the selected file to the parent
    }
  }
}

// Watch file for changes to clear preview if necessary
watch(file, () => {
  if (!file.value) {
    filePreview.value = ''
  }
})

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
    <span class="label-text ms-0.5" v-if="label">{{ label }}</span>
    <label class="input input-bordered input-sm rounded-md  flex items-center gap-2 "
           :class="{'tooltip tooltip-top tooltip-open tooltip-warning':error}"
           :data-tip="error?`${$t('message.'+error)}`:`${$t('form.'+name)} ${$t('form.field-required')}`"
    >
      <slot></slot>
      <input
          :name="name"
          :id="name"
          type="file"
          @change="handleFileUpload"
          @input="$emit('update:modelValue', $event.target.value)"
          :accept="allowedTypes"
          class="bg-base-content placeholder-base-content placeholder-opacity-80 text-base-content w-full"
          :class="customClass"
      />
    </label>
  </div>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
}
</style>
