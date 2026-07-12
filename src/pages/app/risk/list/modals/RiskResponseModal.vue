<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { useGlobalModal } from '@/composables/useGlobalModal';
import { grcRepo } from '@/core/repositories/grcRepo';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useRisk, type Risk, type RiskTask } from '../useRisk';
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
const { loading: apiLoading, fetchRisk, updateRisk, transitionRisk, updateTasks } = useRisk();
const { categoryOptions, subCategoryOptions, getCategoryTitle, getSubCategoryTitle, fetchTree } = useRiskCategories();
const { parseTransitionErrors } = useRiskTransition();

const riskTypeOptions = computed(() => [
  { value: 'threat', label: t('risk.type-threat') },
  { value: 'opportunity', label: t('risk.type-opportunity') },
]);

const impactOptions = computed(() => [
  { value: 1, label: `1 - ${t('risk.impact-1')}` },
  { value: 2, label: `2 - ${t('risk.impact-2')}` },
  { value: 3, label: `3 - ${t('risk.impact-3')}` },
  { value: 4, label: `4 - ${t('risk.impact-4')}` },
  { value: 5, label: `5 - ${t('risk.impact-5')}` },
]);

const likelihoodOptions = computed(() => [
  { value: 1, label: `1 - ${t('risk.likelihood-1')}` },
  { value: 2, label: `2 - ${t('risk.likelihood-2')}` },
  { value: 3, label: `3 - ${t('risk.likelihood-3')}` },
  { value: 4, label: `4 - ${t('risk.likelihood-4')}` },
  { value: 5, label: `5 - ${t('risk.likelihood-5')}` },
]);

const threatStrategyOptions = computed(() => [
  { value: 'reduce', label: t('risk.strategy-reduce') },
  { value: 'accept', label: t('risk.strategy-accept') },
  { value: 'transfer', label: t('risk.strategy-transfer') },
  { value: 'avoid', label: t('risk.strategy-avoid') },
]);

const opportunityStrategyOptions = computed(() => [
  { value: 'exploit', label: t('risk.strategy-exploit') },
  { value: 'share', label: t('risk.strategy-share') },
  { value: 'enhance', label: t('risk.strategy-enhance') },
]);

const strategyOptions = computed(() =>
    risk.value?.riskType === 'opportunity' ? opportunityStrategyOptions.value : threatStrategyOptions.value
);


const formKey = ref(0);
const saving = ref(false);
const savingTasks = ref(false);
const transitioning = ref(false);
const risk = ref<Risk | null>(null);
const selectedCategorySlug = ref('');
const tasks = ref<RiskTask[]>([]);
const memberOptions = ref<{ value: string; label: string }[]>([]);
const initialValues = ref<Record<string, unknown>>({});
const accordionOpen = ref({ registration: false, analysis: false, response: true });
const formRef = ref<InstanceType<typeof Form>>();

const frameworkOptions = ref<{ value: string; label: string }[]>([]);
const domainOptions = ref<{ value: string; label: string }[]>([]);
const controlOptions = ref<{ value: string; label: string }[]>([]);
const selectedFrameworkSlug = ref('');
const selectedDomainSlug = ref('');

const validationSchema = computed(() => yup.object({}));

const statusBadgeClass = computed(() => 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm bg-orange-100 text-orange-800 border border-orange-200');

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

function toggleAccordion(section: 'registration' | 'analysis' | 'response') {
  accordionOpen.value[section] = !accordionOpen.value[section];
}

watch(
    () => [props.show, props.riskId],
    async ([show, id]) => {
      if (show && id) {
        await Promise.all([fetchTree(), loadMembers(), loadFrameworks()]);
        await loadRisk(id);
      }
    },
    { immediate: true }
);

async function loadFrameworks() {
  try {
    const res = await grcRepo.frameworkList({ limit: 100 });
    const list = res?.data?.list ?? [];
    frameworkOptions.value = list.map((f) => ({ value: f.slug, label: f.title ?? f.slug }));
  } catch {
    frameworkOptions.value = [];
  }
}

async function loadDomains(frameworkSlug: string) {
  if (!frameworkSlug) {
    domainOptions.value = [];
    return;
  }
  try {
    const res = await grcRepo.domainList({ frameworkSlug, limit: 100 });
    const list = res?.data?.list ?? [];
    domainOptions.value = list.map((d) => ({ value: d.slug, label: d.title ?? d.slug }));
  } catch {
    domainOptions.value = [];
  }
}

async function loadControls(domainSlug: string) {
  if (!domainSlug) {
    controlOptions.value = [];
    return;
  }
  try {
    const res = await grcRepo.controlList({ domainSlug, limit: 100 });
    const list = res?.data?.list ?? [];
    controlOptions.value = list.map((c) => ({ value: c.slug, label: c.title ?? c.slug }));
  } catch {
    controlOptions.value = [];
  }
}

function onFrameworkChange(value: unknown) {
  selectedFrameworkSlug.value = String(value ?? '');
  selectedDomainSlug.value = '';
  formRef.value?.setFieldValue('domainSlug', '');
  formRef.value?.setFieldValue('controlSlug', '');
  domainOptions.value = [];
  controlOptions.value = [];
  loadDomains(selectedFrameworkSlug.value);
}

function onDomainChange(value: unknown) {
  selectedDomainSlug.value = String(value ?? '');
  formRef.value?.setFieldValue('controlSlug', '');
  controlOptions.value = [];
  loadControls(selectedDomainSlug.value);
}

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
  const fwSlug = r.frameworkSlug ?? '';
  const domainSlug = r.domainSlug ?? '';
  const ctrlSlug = r.controlSlug ?? '';
  selectedFrameworkSlug.value = fwSlug;
  selectedDomainSlug.value = domainSlug;

  initialValues.value = {
    strategy: r.strategy ?? r.treatmentStrategy ?? '',
    frameworkSlug: fwSlug,
    domainSlug: domainSlug,
    controlSlug: ctrlSlug,
    impact: r.impact ?? '',
    likelihood: r.likelihood ?? '',
    vulnerability: r.vulnerability ?? '',
    threat: r.threat ?? '',
    responseDescription: r.responseDescription ?? '',
  };

  tasks.value = r.tasks ?? [];

  if (fwSlug) {
    loadDomains(fwSlug).then(() => {
      if (domainSlug) {
        loadControls(domainSlug);
      }
    });
  }
}

function close() {
  emit('update:show', false);
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
}

async function handleSave(values: Record<string, unknown>) {
  if (!risk.value) return;
  saving.value = true;
  try {
    const frameworkSlug = String(values.frameworkSlug ?? '');
    const domainSlug = String(values.domainSlug ?? '');
    const controlSlug = String(values.controlSlug ?? '');

    const frameworkTitle = frameworkOptions.value.find((f) => f.value === frameworkSlug)?.label ?? '';
    const domainTitle = domainOptions.value.find((d) => d.value === domainSlug)?.label ?? '';
    const controlTitle = controlOptions.value.find((c) => c.value === controlSlug)?.label ?? '';

    const data = {
      strategy: values.strategy,
      treatmentStrategy: values.strategy,
      responseDescription: values.responseDescription || '',
      frameworkSlug,
      frameworkTitle,
      domainSlug,
      domainTitle,
      controlSlug,
      controlTitle,
      tasks: tasks.value,
      impact: risk.value.impact ?? null,
      likelihood: risk.value.likelihood ?? null,
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

const newTaskTitle = ref('');

function addTask() {
  const title = newTaskTitle.value.trim();
  if (!title) return;
  tasks.value = [...tasks.value, title];
  newTaskTitle.value = '';
}

function removeTask(index: number) {
  tasks.value = tasks.value.filter((_, i) => i !== index);
}

function handleTransitionToMonitoring() {
  if (!risk.value) return;

  // Clear previous errors
  formRef.value?.setFieldError('frameworkSlug', undefined);
  formRef.value?.setFieldError('domainSlug', undefined);
  formRef.value?.setFieldError('controlSlug', undefined);
  formRef.value?.setFieldError('responseDescription', undefined);

  const values = formRef.value?.getValues();
  const frameworkSlug = String(values?.frameworkSlug ?? '');
  const domainSlug = String(values?.domainSlug ?? '');
  const controlSlug = String(values?.controlSlug ?? '');
  const responseDescription = String(values?.responseDescription ?? '').trim();

  let hasError = false;

  if (!frameworkSlug) {
    formRef.value?.setFieldError('frameworkSlug', t('validation.required'));
    hasError = true;
  }
  if (!domainSlug) {
    formRef.value?.setFieldError('domainSlug', t('validation.required'));
    hasError = true;
  }
  if (!controlSlug) {
    formRef.value?.setFieldError('controlSlug', t('validation.required'));
    hasError = true;
  }
  if (!responseDescription) {
    formRef.value?.setFieldError('responseDescription', t('validation.required'));
    hasError = true;
  }
  if (tasks.value.length === 0) {
    toast(t('risk.error-tasks-required'), { type: 'error' });
    hasError = true;
  }

  if (hasError) return;

  const frameworkTitle = frameworkOptions.value.find((f) => f.value === frameworkSlug)?.label ?? '';
  const domainTitle = domainOptions.value.find((d) => d.value === domainSlug)?.label ?? '';
  const controlTitle = controlOptions.value.find((c) => c.value === controlSlug)?.label ?? '';

  const payload = {
    strategy: values?.strategy,
    treatmentStrategy: values?.strategy,
    responseDescription,
    frameworkSlug,
    frameworkTitle,
    domainSlug,
    domainTitle,
    controlSlug,
    controlTitle,
    tasks: tasks.value,
    impact: risk.value!.impact ?? null,
    likelihood: risk.value!.likelihood ?? null,
  };

  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('risk.transition-confirm-title'),
      message: t('risk.transition-confirm-message', { status: t('risk.status-monitoring') }),
      confirmVariant: 'primary' as const,
      onConfirmAction: async () => {
        transitioning.value = true;
        try {
          const res = await transitionRisk(risk.value!.slug, 'monitoring', payload);
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
          transitioning.value = false;
        }
      },
    },
    onSuccess: async () => {
      toast(t('risk.transition-success'), { type: 'success' });
      close();
      emit('success');
    },
  });
}


</script>

<template>
  <BaseModal
      :visible="show"
      :title="risk?.title ?? t('risk.detail-title')"
      size="lg"
      :closable="true"
      @update:visible="onDialogVisible"
  >
    <div v-if="apiLoading && !risk" class="flex items-center justify-center py-10">
      <span class="text-sm text-slate-500">{{ t('general.loading') }}</span>
    </div>
    <div v-else-if="risk" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-darkmode-600">
        <span :class="statusBadgeClass">{{ t('risk.status-response') }}</span>
        <span :class="riskTypeBadgeClass">{{ t(`risk.type-${risk.riskType}`) }}</span>
        <span class="text-xs text-slate-400">{{ risk.createdAt }}</span>
      </div>

      <Form
          id="risk-response-modal-form"
          ref="formRef"
          :key="formKey"
          :validation-schema="validationSchema"
          :initial-values="initialValues"
          class="space-y-3"
          @submit="handleSave"
      >
        <div class="space-y-3">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
            <BaseSelect name="strategy" :label="t('risk.field-treatment-strategy')" :options="strategyOptions" :required="true" />
            <BaseSelect name="frameworkSlug" :label="t('risk.field-framework')" :options="frameworkOptions" :filter="true" @change="onFrameworkChange" />
            <BaseSelect name="domainSlug" :label="t('risk.field-domain')" :options="domainOptions" :filter="true" :disabled="!selectedFrameworkSlug" @change="onDomainChange" />
            <BaseSelect name="controlSlug" :label="t('risk.field-control')" :options="controlOptions" :filter="true" :disabled="!selectedDomainSlug" />
          </div>
          <div class="space-y-2">
            <label class="label min-h-0 py-1">
              <span class="label-text text-sm font-normal leading-snug">{{ t('risk.field-tasks') }}</span>
            </label>
            <div class="flex gap-2">
              <input
                  v-model="newTaskTitle"
                  type="text"
                  class="input input-bordered flex-1 !h-8 !min-h-0 px-2.5 text-xs font-light leading-snug placeholder:text-slate-400"
                  :placeholder="t('risk.task-add-placeholder')"
                  @keydown.enter.prevent="addTask"
              />
              <Button type="button" variant="primary" size="sm" class="!h-8" :disabled="!newTaskTitle.trim()" @click="addTask">
                <Lucide icon="Plus" class="!h-3.5 !w-3.5" />
              </Button>
            </div>
            <div v-if="tasks.length > 0" class="space-y-1">
              <div
                  v-for="(task, index) in tasks"
                  :key="index"
                  class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-darkmode-600 dark:bg-darkmode-800"
              >
                <span class="flex-1 text-slate-700 dark:text-slate-200">{{ task }}</span>

                <button type="button" class="text-slate-400 hover:text-red-500 transition" :disabled="savingTasks" @click="removeTask(index)">
                  <Lucide icon="Trash2" class="!h-3 !w-3" />
                </button>
              </div>
            </div>
          </div>
          <BaseInput name="responseDescription" :label="t('risk.field-response-description')" type="textarea" :rows="3" :placeholder="t('risk.field-response-description-placeholder')" />
        </div>
      </Form>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
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
            form="risk-response-modal-form"
            :disabled="saving"
        >
          {{ t('risk.action.save-response') }}
        </Button>
        <Button
            type="button"
            variant="primary"
            size="sm"
            :disabled="saving || transitioning"
            @click="handleTransitionToMonitoring"
        >
          {{ t('risk.action-send-monitoring') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
