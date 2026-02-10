<script setup>
import { Form } from "vee-validate";
import Button from "@/base-components/Button/index";
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import { FormLabel, FormSwitch } from "@/base-components/Form/index";
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";
import { computed, nextTick, ref, watch } from "vue";
import { uri } from "@/constants/config";
import { toast } from "vue3-toastify";
import { useFetch } from "@/composables/useFetch.js";
import { object } from "yup";
import useValidate from "@/composables/useValidate";
import InputText from "@/base-components/Form/InputText.vue";
import Lucide from "@/base-components/Lucide";
import { useI18n } from "vue-i18n";

const { t: $t } = useI18n();
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  metaKey: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'onSuccess']);

const defaultTypeOptions = ['product', 'blog', 'page'];
const defaultMetaKeyParams = () => ({
  id: null,
  key: '',
  value: '',
  target: 'product',
  type: 'string',
  suffix: '',
  option: {
    types: [{
      type: '',
      multi: false,
      required: false
    }],
    has_content: false
  },
  logo: '',
  status: 1
});

const metaKeyParams = ref(defaultMetaKeyParams());
const typeOptions = defaultTypeOptions;
const isLoading = ref(false);
const validationSchema = object(useValidate(['key', 'value', 'type']));
const isEditMode = computed(() => !!props.metaKey?.id);
const logoPreview = ref('');
const logoFile = ref(null);
const logoUploader = ref(null);

function close() {
  resetForm();
  emit('close')
}

function onSuccess() {
  emit('onSuccess')
}

function resetForm() {
  metaKeyParams.value = defaultMetaKeyParams();
  logoPreview.value = '';
  logoFile.value = null;
}

function normalizeTypes(types = []) {
  if (!Array.isArray(types) || !types.length) {
    return [{
      type: '',
      multi: false,
      required: false
    }];
  }
  return types.map((item) => ({
    type: item?.type ?? '',
    multi: !!item?.multi,
    required: !!item?.required
  }));
}

function populateForm(metaKey) {
  if (!metaKey) {
    resetForm();
    return;
  }
  metaKeyParams.value = {
    id: metaKey.id ?? null,
    key: metaKey.key ?? '',
    value: metaKey.value ?? '',
    target: metaKey.target ?? 'product',
    type: metaKey.type ?? 'string',
    suffix: metaKey.suffix ?? '',
    option: {
      types: normalizeTypes(metaKey.option?.types),
      has_content: !!metaKey.option?.has_content
    },
    logo: metaKey.logo ?? '',
    status: Number(metaKey.status ?? 1)
  };
  logoPreview.value = metaKeyParams.value.logo ?? '';
  logoFile.value = null;
}

watch(
    () => props.show,
    (isOpen) => {
      if (isOpen) {
        if (isEditMode.value) {
          populateForm(props.metaKey);
        } else {
          resetForm();
        }
      } else {
        resetForm();
      }
    }
);

watch(
    () => props.metaKey,
    (newMeta) => {
      if (props.show && newMeta) {
        populateForm(newMeta);
      }
    },
    { deep: true }
);

async function onSubmitAddMetaKey() {
  isLoading.value = true; // Fix: no setIsLoading(), use isLoading directly
  const payload = {
    ...metaKeyParams.value,
    status: 1, // Always set status to 1
    option: {
      ...metaKeyParams.value.option,
      types: normalizeTypes(metaKeyParams.value.option?.types)
    }
  };
  // Don't send key in update mode - user cannot update it
  if (isEditMode.value) {
    delete payload.key;
  }
  if (logoFile.value) {
    const uploadedLogo = await uploadFile(logoFile.value);
    if (!uploadedLogo) {
      toast.error($t('error.error-upload-image'));
      isLoading.value = false;
      return;
    }
    payload.logo = uploadedLogo;
  }
  const endpoint = isEditMode.value ? uri.admin.meta.update : uri.admin.meta.add;
  try {
    const { data, error } = await useFetch(endpoint, {
      method: 'POST',
      body: payload,
    });

    if (!error.value) {
      setTimeout(()=>emit('onSuccess'),500)
      emit('close');
    } else {
      console.error("Meta add failed:", error.value);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  } finally {
    isLoading.value = false;
  }
}

function addTypeOption() {
  metaKeyParams.value.option.types.push({
    type: '',
    multi: false,
    required: false
  })
}

function removeTypeOption(index) {
  metaKeyParams.value.option.types.splice(index, 1)
}

function triggerLogoUpload() {
  logoUploader.value?.click();
}

function handleLogoChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    logoPreview.value = e.target?.result ?? '';
    logoFile.value = file;
  };
  reader.readAsDataURL(file);
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data, error, execute } = useFetch(uri.admin.media.public.add, {
    method: "POST",
    body: formData,
    immediate: false,
  });
  await execute();
  await nextTick();
  if (error.value) {
    return false;
  }
  return data.value?.data?.information?.download?.public_uri ?? false;
}

</script>

<template>
  <BaseDialog
      :size="'xl'"
      staticBackdrop
      :open="show"
      :has-footer="true"
      :title="isEditMode ? $t('title.edit-meta-key') : $t('title.add-meta-key')"
      @close="close"
  >
    <div class="rounded-md px-2 py-2 w-full max-h-[78vh] overflow-auto pb-8">
      <Form id="addMetaKeyForm" :validation-schema="validationSchema" @submit="onSubmitAddMetaKey">
        <div class="px-2">
          <div class="grid grid-cols-12 gap-4 mt-5 gap-y-5" v-if="!isLoading">

            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="meta-key">
                {{ $t('label.key') }}
              </FormLabel>
              <InputText
                  name="key"
                  v-model="metaKeyParams.key"
                  id="meta-key"
                  type="text"
                  :disabled="isEditMode"
                  :readonly="isEditMode"
              />
            </div>

            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="meta-value">
                {{ $t('label.value') }}
              </FormLabel>
              <InputText
                  name="value"
                  v-model="metaKeyParams.value"
                  id="meta-value"
                  type="text"
              />
            </div>

            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="meta-type">
                {{ $t('label.type') }}
              </FormLabel>
              <BaseInputSelect
                  v-model="metaKeyParams.type"
                  name="type"
                  :options="['string', 'number', 'boolean', 'array', 'object']"
                  :searchable="false"
              />
            </div>

            <div class="col-span-12 intro-y sm:col-span-6">
              <FormLabel htmlFor="meta-suffix">
                {{ $t('label.suffix') }}
              </FormLabel>
              <InputText
                  name="suffix"
                  v-model="metaKeyParams.suffix"
                  id="meta-suffix"
                  type="text"
              />
            </div>

            <div class="col-span-12 intro-y">
              <FormLabel>
                {{ $t('label.logo') }}
              </FormLabel>
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2">
                  <input
                      ref="logoUploader"
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleLogoChange"
                  />
                  <Button
                      variant="outline-secondary"
                      size="sm"
                      type="button"
                      @click="triggerLogoUpload"
                  >
                    <Lucide icon="Upload" class="w-4 h-4 mr-1"/>
                    {{ $t('product.upload_image') }}
                  </Button>
                </div>
                <div
                    class="w-full h-36 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden"
                >
                  <img
                      v-if="logoPreview"
                      :src="logoPreview"
                      alt="meta logo preview"
                      class="object-contain w-full h-full"
                  />
                  <span v-else class="text-xs text-gray-400">
                    {{ $t('product.no_image') }}
                  </span>
                </div>
              </div>
            </div>

            <div class="col-span-12 border-t pt-4">
              <FormLabel>
                {{ $t('label.type-options') }}
              </FormLabel>

              <div v-for="(typeOption, index) in metaKeyParams.option.types" :key="index"
                   class="mb-4 p-3 border rounded">
                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-12 sm:col-span-4">
                    <FormLabel :htmlFor="`type-${index}`">
                      {{ $t('label.type') }}
                    </FormLabel>
                    <BaseInputSelect
                        :id="`type-${index}`"
                        v-model="typeOption.type"
                        :options="typeOptions"
                        :searchable="false"
                        name=""
                    />
                  </div>

                  <div class="col-span-6 sm:col-span-3">
                    <FormLabel>
                      {{ $t('label.multiple') }}
                    </FormLabel>
                    <FormSwitch class="mt-2">
                      <FormSwitch.Input type="checkbox" v-model="typeOption.multi"/>
                    </FormSwitch>
                  </div>

                  <div class="col-span-6 sm:col-span-3">
                    <FormLabel>
                      {{ $t('label.required') }}
                    </FormLabel>
                    <FormSwitch class="mt-2">
                      <FormSwitch.Input type="checkbox" v-model="typeOption.required"/>
                    </FormSwitch>
                  </div>

                  <div class="col-span-12 sm:col-span-2 flex items-end">
                    <Button
                        variant="danger"
                        @click="removeTypeOption(index)"
                        size="sm"
                        class="w-full"
                        v-if="metaKeyParams.option.types.length > 1"
                    >
                      <Lucide icon="Trash2" class="w-4 h-4"/>
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                  variant="secondary"
                  @click="addTypeOption"
                  size="sm"
                  class="mt-2"
                  type="button"
              >
                <Lucide icon="Plus" class="w-4 h-4 mr-1"/>
                {{ $t('button.add-type-option') }}
              </Button>
            </div>

            <div class="col-span-12 grid grid-cols-12 gap-4 border-t pt-4">
              <div class="col-span-6">
                <FormLabel htmlFor="has-content">
                  {{ $t('label.has-content') }}
                </FormLabel>
                <FormSwitch class="mt-2">
                  <FormSwitch.Input id="has-content" type="checkbox" v-model="metaKeyParams.option.has_content"/>
                </FormSwitch>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>

    <template v-slot:footer>
      <div class="flex col-md-12 items-end justify-end gap-2">
        <Button variant="outline-secondary" @click="close" size="sm" class="shadow-md">
          {{ $t('button.cancel') }}
        </Button>
        <Button
            variant="primary"
            size="sm"
            form="addMetaKeyForm"
            class="shadow-md"
            :loading="isLoading"
        >
          {{ $t('button.save') }}
        </Button>
      </div>
    </template>
  </BaseDialog>
</template>

<style scoped>
</style>