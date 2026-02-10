<script setup>
import { Form } from "vee-validate";
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import { FormLabel, FormSwitch } from "@/base-components/Form";
import InputText from "@/base-components/Form/InputText.vue";
import Button from "@/base-components/Button";
import { computed, nextTick, ref, watch } from "vue";
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";
import { uri } from "@/constants/config";
import { useFetch } from "@/composables/useFetch.js";
import { toast } from "vue3-toastify";
import { object } from "yup";
import useValidate from "@/composables/useValidate";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  metaKey: {
    type: Object,
    default: null,
  },
  metaContent: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "submit"]);

const getDefaultFormState = () => ({
  id: null,
  title: "",
  image_url: "",
  icon: "",
  slug: "",
  type: "",
  status: 1,
  parent_id: null,
  priority: 0,
  value: "",
  time_create_view: null,
});

const metaContentForm = ref(getDefaultFormState());

const metaKeyDisplayName = computed(() => props.metaKey?.key ?? "");
const metaKeyValueLabel = computed(() => props.metaKey?.value ?? "");
const isEditMode = computed(() => !!metaContentForm.value.id);
const metaTypeOptions = ["product", "blog", "page"];
const imagePreview = ref("");
const iconPreview = ref("");
const imageUploader = ref(null);
const iconUploader = ref(null);
const imageFile = ref(null);
const iconFile = ref(null);
const isLoading = ref(false);
const slugPrefix = "meta-";
const validationSchema = object(useValidate(['title', 'value']));

const sanitizeSlug = (text = "") =>
    text
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+/, "");

const generateUniqueSlug = () => {
  const metaKeySlug = sanitizeSlug(props.metaKey?.key ?? "");
  const uniqueChar = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  return `meta-${metaKeySlug}-${uniqueChar}`;
};

const determineInitialType = () => {
  const candidateType = props.metaKey?.option?.types?.[0]?.type ?? props.metaKey?.type ?? metaContentForm.value.type ?? metaTypeOptions[0];
  return metaTypeOptions.includes(candidateType) ? candidateType : metaTypeOptions[0];
};

function populateFromMetaContent(content) {
  const baseState = getDefaultFormState();
  metaContentForm.value = {
    ...baseState,
    ...content,
    id: content?.id ?? null,
    title: content?.title ?? "",
    slug: content?.slug ?? generateUniqueSlug(),
    type: metaTypeOptions.includes(content?.type) ? content.type : determineInitialType(),
    value: content?.value ?? "",
    image_url: content?.image_url ?? "",
    icon: content?.icon ?? "",
    status: Number(content?.status ?? 1),
    priority: content?.priority ?? 0,
    time_create_view: content?.time_create_view ?? null,
    parent_id: content?.parent_id ?? null,
  };
  imagePreview.value = metaContentForm.value.image_url || "";
  iconPreview.value = metaContentForm.value.icon || "";
  imageFile.value = null;
  iconFile.value = null;
}

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      const baseState = getDefaultFormState();
      metaContentForm.value = {
        ...baseState,
        type: determineInitialType(),
        slug: generateUniqueSlug(),
      };
      if (props.metaContent) {
        populateFromMetaContent(props.metaContent);
      } else {
        imagePreview.value = metaContentForm.value.image_url || "";
        iconPreview.value = metaContentForm.value.icon || "";
        imageFile.value = null;
        iconFile.value = null;
      }
    } else {
      metaContentForm.value = getDefaultFormState();
      imagePreview.value = "";
      iconPreview.value = "";
      imageFile.value = null;
      iconFile.value = null;
      isLoading.value = false;
    }
  },
  { immediate: true }
);

watch(
    () => props.metaContent,
    (newContent) => {
      if (props.show && newContent) {
        populateFromMetaContent(newContent);
      }
    },
    { deep: true }
);


function closeDialog() {
  isLoading.value = false;
  emit("close");
}

async function onSubmitMetaContent() {
  if (isLoading.value) return;
  isLoading.value = true;
  const payload = { ...metaContentForm.value };

  if (imageFile.value) {
    const uploaded = await uploadFile(imageFile.value);
    if (!uploaded) {
      toast.error($t("error.error-upload-image"));
      isLoading.value = false;
      return;
    }
    payload.image_url = uploaded;
  }
  if (iconFile.value) {
    const uploadedIcon = await uploadFile(iconFile.value);
    if (!uploadedIcon) {
      toast.error($t("error.error-upload-image"));
      isLoading.value = false;
      return;
    }
    payload.icon = uploadedIcon;
  }

  emit("submit", {
    metaKey: props.metaKey,
    payload,
  });
  isLoading.value = false;
}

function triggerFile(field) {
  if (field === "image") {
    imageUploader.value?.click();
  } else if (field === "icon") {
    iconUploader.value?.click();
  }
}

function handleFileChange(event, field) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result ?? "";
    if (field === "image_url") {
      imagePreview.value = result;
      imageFile.value = file;
    } else if (field === "icon") {
      iconPreview.value = result;
      iconFile.value = file;
    }
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
      :size="'lg'"
      staticBackdrop
      :open="show"
      :has-footer="true"
      :title="metaContentForm.id ? $t('button.update') : $t('button.add-data')"
      @close="closeDialog"
  >
    <div class="rounded-md px-2 py-2 w-full max-h-[78vh] overflow-auto pb-8">
      <div class="bg-slate-100 dark:bg-slate-800 rounded-md px-4 py-3 mb-4 text-sm">
        <div class="font-semibold text-slate-700 dark:text-slate-200">
          {{ $t('label.key') }}: <span>{{ metaKeyDisplayName }}</span>
        </div>
        <div class="text-slate-600 dark:text-slate-300" v-if="metaKeyValueLabel">
          {{ $t('label.value') }}: <span>{{ metaKeyValueLabel }}</span>
        </div>
      </div>

      <Form id="addMetaContentForm" :validation-schema="validationSchema" @submit="onSubmitMetaContent">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-6">
            <FormLabel for="meta-content-title">
              {{ $t('label.title') }}
            </FormLabel>
            <InputText
                name="title"
                id="meta-content-title"
                v-model="metaContentForm.title"
                type="text"
            />
          </div>

          <div class="col-span-12 md:col-span-6">
            <FormLabel for="meta-content-value">
              {{ $t('label.value') }}
            </FormLabel>
            <InputText
                name="value"
                id="meta-content-value"
                v-model="metaContentForm.value"
                type="text"
                :disabled="isEditMode"
                :readonly="isEditMode"
            />
          </div>

          <div class="col-span-12 md:col-span-6">
            <FormLabel for="meta-content-image">
              {{ $t('label.image-url') }}
            </FormLabel>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <input
                    ref="imageUploader"
                    id="meta-content-image"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleFileChange($event, 'image_url')"
                />
                <Button
                    variant="outline-secondary"
                    size="sm"
                    type="button"
                    @click="triggerFile('image')"
                >
                  {{ $t('product.upload_image') }}
                </Button>
              </div>
              <div
                  class="w-full h-36 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden"
              >
                <img
                    v-if="imagePreview"
                    :src="imagePreview"
                    alt="meta image preview"
                    class="object-contain w-full h-full"
                />
                <span v-else class="text-xs text-gray-400">
                  {{ $t('product.no_image') }}
                </span>
              </div>
            </div>
          </div>

          <div class="col-span-12 md:col-span-6">
            <FormLabel for="meta-content-icon">
              {{ $t('label.icon') }}
            </FormLabel>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <input
                    ref="iconUploader"
                    id="meta-content-icon"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleFileChange($event, 'icon')"
                />
                <Button
                    variant="outline-secondary"
                    size="sm"
                    type="button"
                    @click="triggerFile('icon')"
                >
                  {{ $t('product.upload_image') }}
                </Button>
              </div>
              <div
                  class="w-full h-36 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden"
              >
                <img
                    v-if="iconPreview"
                    :src="iconPreview"
                    alt="meta icon preview"
                    class="object-contain w-full h-full"
                />
                <span v-else class="text-xs text-gray-400">
                  {{ $t('product.no_image') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button variant="outline-secondary" size="sm" @click="closeDialog">
          {{ $t('button.cancel') }}
        </Button>
        <Button
            variant="primary"
            size="sm"
            form="addMetaContentForm"
            :loading="isLoading"
            :disabled="isLoading"
        >
          {{ metaContentForm.id ? $t('common.save_changes') : $t('button.save') }}
        </Button>
      </div>
    </template>
  </BaseDialog>
</template>

<style scoped>
</style>

