<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { Form, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { useRisk } from './useRisk';
import { useRiskCategories } from './useRiskCategories';
import { ermRepo } from '@/core/repositories/ermRepo';
import RegistrationSection from './sections/RegistrationSection.vue';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const { loading, createRisk } = useRisk();
const { categoryOptions, subCategoryOptions, getCategoryTitle, getSubCategoryTitle, fetchTree } = useRiskCategories();
const saving = ref(false);
const formKey = ref(0);
const selectedCategorySlug = ref('');
const memberOptions = ref<{ value: string; label: string }[]>([]);

const { setFieldValue } = useForm();

const initialValues = ref({
  title: '',
  draft_description: '',
  riskType: '',
  categorySlug: '',
  subCategorySlug: '',
  ownerId: '',
});

const validationSchema = computed(() =>
  yup.object({
    title: yup.string().trim().required(t('validation.required')),
    draft_description: yup.string().trim().optional(),
    riskType: yup.string().trim().required(t('validation.required')),
    categorySlug: yup.string().trim().required(t('validation.required')),
    subCategorySlug: yup.string().trim().required(t('validation.required')),
    ownerId: yup.string().trim().optional(),
  })
);

function mapMembers(list: Record<string, unknown>[]) {
  return list
    .map((m) => {
      const id = m.id ?? m.user_id;
      if (id == null) return null;
      const label =
        [m.name, m.full_name, m.email, m.mobile]
          .find((x) => typeof x === 'string' && String(x).trim()) ?? String(id);
      return { value: String(id), label: String(label).trim() };
    })
    .filter((x): x is { value: string; label: string } => x != null);
}

watch(
  () => props.show,
  (show) => {
    if (show) {
      initialValues.value = {
        title: '',
        draft_description: '',
        riskType: '',
        categorySlug: '',
        subCategorySlug: '',
        ownerId: '',
      };
      selectedCategorySlug.value = '';
      formKey.value += 1;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  fetchTree();
  try {
    const res = await ermRepo.memberList({ page: 1, limit: 500 });
    const list = res?.data?.list ?? [];
    memberOptions.value = mapMembers(Array.isArray(list) ? list : []);
  } catch {
    memberOptions.value = [];
  }
});

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}

function onCategoryChange(value: unknown) {
  selectedCategorySlug.value = String(value ?? '');
  setFieldValue('subCategorySlug', '');
}

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    const catSlug = String(values.categorySlug ?? '');
    const subCatSlug = String(values.subCategorySlug ?? '');
    const data = {
      title: String(values.title ?? ''),
      draft_description: String(values.draft_description ?? ''),
      riskType: String(values.riskType ?? ''),
      categorySlug: catSlug,
      categoryTitle: getCategoryTitle(catSlug),
      subCategorySlug: subCatSlug,
      subCategoryTitle: getSubCategoryTitle(catSlug, subCatSlug),
      ownerId: String(values.ownerId ?? ''),
      status: 'draft',
    };
    await createRisk(data);
    toast(t('risk.create-success'), { type: 'success' });
    emit('success');
    close();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('risk.create-error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="t('risk.create-title')"
    size="md"
    @update:visible="onDialogVisible"
  >
    <Form
      :key="formKey"
      id="create-risk-form"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
    >
      <RegistrationSection
        mode="editable"
        :category-options="categoryOptions"
        :sub-category-options="subCategoryOptions(selectedCategorySlug)"
        :member-options="memberOptions"
        @category-change="onCategoryChange"
      />
    </Form>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          :disabled="saving"
          @click="close"
        >
          {{ t('general.cancel') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          form="create-risk-form"
          :disabled="saving"
        >
          {{ t('risk.action.save-draft') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
