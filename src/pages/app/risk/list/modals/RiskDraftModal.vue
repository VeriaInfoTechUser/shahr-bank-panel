<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import Button from '@/base-components/Button';
import { useGlobalModal } from '@/composables/useGlobalModal';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useRisk, type Risk } from '../useRisk';
import { useRiskCategories } from '../useRiskCategories';
import { useRiskTransition } from '../useRiskTransition';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';

const props = defineProps<{
  show: boolean;
  riskId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();
const { openModal } = useGlobalModal();
const { loading: apiLoading, fetchRisk, updateRisk, deleteRisk, transitionRisk } = useRisk();
const { categoryOptions, subCategoryOptions, getCategoryTitle, getSubCategoryTitle, fetchTree } = useRiskCategories();
const { parseTransitionErrors } = useRiskTransition();

const formKey = ref(0);
const saving = ref(false);
const registering = ref(false);
const risk = ref<Risk | null>(null);
const selectedCategorySlug = ref('');
const memberOptions = ref<{ value: string; label: string }[]>([]);
const initialValues = ref<Record<string, unknown>>({});
const formRef = ref<InstanceType<typeof Form>>();

const validationSchema = computed(() => yup.object({
  title: yup.string().trim().required(t('validation.required')),
  draftDescription: yup.string().trim().required(t('validation.required')),
  riskType: yup.string().trim().required(t('validation.required')),
  categorySlug: yup.string().trim().required(t('validation.required')),
  subCategorySlug: yup.string().trim().required(t('validation.required')),
  ownerId: yup.string().trim().required(t('validation.required')),
}));

const riskTypeOptions = computed(() => [
  { value: 'threat', label: t('risk.type-threat') },
  { value: 'opportunity', label: t('risk.type-opportunity') },
]);

const statusBadgeClass = computed(() => 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm bg-slate-100 text-slate-700 border border-slate-200');

const riskTypeBadgeClass = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm';
  const rt = risk.value?.riskType;
  if (rt === 'threat') return `${base} bg-red-50 text-red-700 border border-red-200`;
  if (rt === 'opportunity') return `${base} bg-green-50 text-green-700 border border-green-200`;
  return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
});

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
  () => [props.show, props.riskId],
  async ([show, id]) => {
    if (show && id) {
      await Promise.all([fetchTree(), loadMembers()]);
      await loadRisk(id);
    }
  },
  { immediate: true }
);

async function loadMembers() {
  try {
    const res = await ermRepo.memberList({ page: 1, limit: 500 });
    const list = res?.data?.list ?? [];
    memberOptions.value = mapMembers(Array.isArray(list) ? list : []);
  } catch {
    memberOptions.value = [];
  }
}

async function loadRisk(id: string) {
  const data = await fetchRisk(id);
  if (!data) return;
  risk.value = data;
  selectedCategorySlug.value = data.categorySlug ?? '';

  await nextTick();
  populateForm(data);
  formKey.value += 1;
}

function populateForm(r: Risk) {
  initialValues.value = {
    title: r.title ?? '',
    draftDescription: r.draftDescription ?? '',
    riskType: r.riskType ?? '',
    categorySlug: r.categorySlug ?? '',
    subCategorySlug: r.subCategorySlug ?? '',
    ownerId: r.ownerId ?? '',
  };
}

function close() {
  emit('update:show', false);
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
}

function onCategoryChange(value: unknown) {
  selectedCategorySlug.value = String(value ?? '');
}

async function handleSave(values: Record<string, unknown>) {
  if (!risk.value) return;
  saving.value = true;
  try {
    const catSlug = String(values.categorySlug ?? '');
    const subCatSlug = String(values.subCategorySlug ?? '');
    const data = {
      title: values.title,
      draftDescription: values.draftDescription,
      riskType: values.riskType,
      categorySlug: catSlug,
      categoryTitle: getCategoryTitle(catSlug),
      subCategorySlug: subCatSlug,
      subCategoryTitle: getSubCategoryTitle(catSlug, subCatSlug),
      ownerId: values.ownerId,
    };

    await updateRisk(risk.value.slug, data);
    toast(t('risk.save-success'), { type: 'success' });
    await loadRisk(risk.value.slug);
    emit('success');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : t('risk.save-error');
    toast(message, { type: 'error' });
  } finally {
    saving.value = false;
  }
}

function handleRegister() {
  formRef.value?.validate().then(({ valid }) => {
    if (!valid) return;
    const values = formRef.value?.getValues();
    if (!String(values?.draftDescription ?? '').trim()) {
      openModal({
        component: BaseConfirmModal,
        props: {
          title: t('risk.warning-title'),
          message: t('risk.warning-description-required', { description: t('risk.field-draft-description') }),
        },
      });
      return;
    }
    openModal({
      component: BaseConfirmModal,
      props: {
        title: t('risk.transition-confirm-title'),
        message: t('risk.transition-confirm-message', { status: t('risk.status-registered') }),
        confirmVariant: 'primary' as const,
        onConfirmAction: async () => {
          registering.value = true;
          try {
            const catSlug = String(values?.categorySlug ?? '');
            const subCatSlug = String(values?.subCategorySlug ?? '');
            const body: Record<string, unknown> = {
              draftDescription: values.draftDescription,
              title: values.title,
              riskType: values.riskType,
              categorySlug: catSlug,
              categoryTitle: getCategoryTitle(catSlug),
              subCategorySlug: subCatSlug,
              subCategoryTitle: getSubCategoryTitle(catSlug, subCatSlug),
            };
            const res = await transitionRisk(risk.value!.slug, 'registered', body);
            if (!res) throw new Error(t('risk.transition-error'));
          } catch (err: unknown) {
            if (err instanceof Error) {
              const parsed = parseTransitionErrors([err.message]);
              if (parsed.length > 0 && parsed[0] !== err.message) {
                throw new Error(t(parsed[0]));
              }
            }
            throw err;
          } finally {
            registering.value = false;
          }
        },
      },
      onSuccess: async () => {
        toast(t('risk.transition-success'), { type: 'success' });
        close();
        emit('success');
      },
    });
  });
}

function handleDelete() {
  if (!risk.value) return;
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.delete-confirm-title'),
      message: t('risk.delete-confirm-message'),
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        await deleteRisk(risk.value!.slug);
      },
    },
    onSuccess: () => {
      toast(t('risk.delete-success'), { type: 'success' });
      emit('success');
      close();
    },
  });
}


</script>

<template>
  <BaseModal
    :visible="show"
    :title="risk?.title ?? t('risk.detail-title')"
    size="md"
    :closable="true"
    @update:visible="onDialogVisible"
  >
    <div v-if="apiLoading && !risk" class="flex items-center justify-center py-10">
      <span class="text-sm text-slate-500">{{ t('general.loading') }}</span>
    </div>
    <div v-else-if="risk" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-darkmode-600">
        <span :class="statusBadgeClass">{{ t('risk.status-draft') }}</span>
        <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>
        <span class="text-xs text-slate-400">{{ risk.createdAt }}</span>
      </div>

      <Form
        id="risk-draft-modal-form"
        ref="formRef"
        :key="formKey"
        :validation-schema="validationSchema"
        :initial-values="initialValues"
        class="space-y-3"
        @submit="handleSave"
      >
        <div class="space-y-3">
          <BaseInput
            name="title"
            :label="t('risk.field-title')"
            :required="true"
            :placeholder="t('risk.field-title-placeholder')"
          />
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
            <BaseSelect
              name="categorySlug"
              :label="t('risk.field-category')"
              :options="categoryOptions"
              :required="true"
              :filter="true"
              @change="onCategoryChange"
            />
            <BaseSelect
              name="subCategorySlug"
              :label="t('risk.field-sub-category')"
              :options="subCategoryOptions(selectedCategorySlug)"
              :required="true"
              :filter="true"
            />
            <BaseSelect
              name="ownerId"
              :label="t('risk.field-owner')"
              :options="memberOptions"
              :filter="true"
            />
            <BaseSelect
              name="riskType"
              :label="t('risk.field-risk-type')"
              :options="riskTypeOptions"
              :required="true"
            />
          </div>
          <BaseInput
            name="draftDescription"
            :label="t('risk.field-draft-description')"
            type="textarea"
            :rows="3"
            :placeholder="t('risk.field-draft-description-placeholder')"
          />
        </div>
      </Form>
    </div>
    <template #footer>
      <div class="flex items-center justify-between">
        <div class="flex gap-2">

          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            @click="close"
          >
            {{ t('general.close') }}
          </Button>
          <Button
              type="submit"
              variant="outline-secondary"
              size="sm"
              form="risk-draft-modal-form"
              :disabled="saving"
          >
            {{ t('title.update') }}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            :disabled="saving || registering"
            @click="handleRegister"
          >
            {{ t('risk.action-register') }}
          </Button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>
