<script setup>
import { Form } from "vee-validate";
import BaseFileUpload from "@/components/BaseFileUpload.vue";
import { ref } from "vue";
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import Button from "@/base-components/Button";
import { userRepo } from "@/core/repositories/userRepo";

const file = ref(null);
const filePreview = ref('');
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
});

const isLoading = ref(false);
const emit = defineEmits(['resetUploadDocumentData', 'onSubmitUploadDocument', '']);

const close = () => {
  emit('close');
}

const resetUploadDocumentData = () => {
  emit('resetUploadDocumentData');
}

const onSubmitUploadDocument = async () => {
  if (!file.value) return;
  isLoading.value = true;
  try {
    await userRepo.uploadAvatar(file.value);
    emit('onSubmitUploadDocument');
  } catch (err) {
    console.error('Error uploading avatar:', err);
  } finally {
    isLoading.value = false;
  }
}

const removeFilterData = () => {
  emit('removeFilterData');
}

function handleFileChange(selectedFile) {
  file.value = selectedFile
  if (file.value && file.value.type.startsWith('image/')) {
    filePreview.value = URL.createObjectURL(file.value) // Set the image preview
  }
}
</script>

<template>

  <section>
    <BaseDialog
        :size="'lg'"
        staticBackdrop
        :open="show"
        :has-footer="true"
        :title="$t('title.avatar')"
        @close="close"
    >
      <div class="px-4 py-4">
        <Form @submit="onSubmitUploadDocument"
              id="myForm"
              v-if="show">
          <div>
            <div>
              <BaseFileUpload
                  class="flex-grow"
                  name="document"
                  :has-default-error-message="true"
                  @update:file="handleFileChange"
              />
            </div>
          </div>

          <div class="p-4 items-center flex justify-center"
               v-if="filePreview">
            <div
                class="p-4 items-center flex justify-center w-44 h-44 rounded-full border-yellow-400 border-2 overflow-hidden">
              <img
                  :src="filePreview"
                  v-if="filePreview"
                  alt=""
                  class="min-h-44 min-w-44 object-cover object-center"
              />
            </div>
          </div>
        </Form>
      </div>

      <template v-slot:footer>
        <FreeStyleShimmer class="py-3" height="10px" width="100%" v-if="isLoading"/>
        <div class="flex col-md-12 items-end justify-end gap-2" v-else>
          <div class="flex col-md-12 items-end justify-end gap-2">
            <Button variant="outline-secondary" @click="close" size="sm" class=" shadow-md justify-end items-end">
              {{ $t('button.cancel') }}
            </Button>
            <Button variant="primary" size="sm" form="myForm" class=" shadow-md justify-end items-end">
              {{ $t('button.upload') }}
            </Button>
          </div>
        </div>
      </template>
    </BaseDialog>
  </section>
</template>
<style scoped>
</style>
