<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { grcRepo } from '@/core/repositories/grcRepo';

const props = withDefaults(
  defineProps<{
    show: boolean;
    record?: Record<string, unknown> | null;
  }>(),
  {
    record: null,
  }
);

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useI18n();

const saving = ref(false);
const formKey = ref(0);

const isEdit = computed(() => {
  const r = props.record;
  if (!r || typeof r !== 'object') return false;
  return r.slug != null && r.slug !== '';
});

const modalTitle = computed(() => {
  return isEdit.value ? t('sustainability-indicator-page.edit') : t('sustainability-indicator-page.add');
});

const fullTree = ref<Record<string, unknown>[]>([]);

const capitalOptions = ref<{ value: string; label: string }[]>([]);
const domainOptions = ref<{ value: string; label: string }[]>([]);
const componentOptions = ref<{ value: string; label: string }[]>([]);
const capabilityOptions = ref<{ value: string; label: string }[]>([]);
const claimOptions = ref<{ value: string; label: string }[]>([]);

const selectedCapitalSlug = ref('');
const selectedDomainSlug = ref('');
const selectedComponentSlug = ref('');
const selectedCapabilitySlug = ref('');
const selectedClaimSlug = ref('');

const indicatorTypeOptions = [
  { value: 'KPI', label: 'KPI' },
  { value: 'KRI', label: 'KRI' },
  { value: 'KCI', label: 'KCI' },
  { value: 'RES', label: 'RES' },
];

const metricTypeOptions = [
  { value: 'Quantitative', label: 'Quantitative' },
  { value: 'Qualitative', label: 'Qualitative' },
];

const metricRoleOptions = [
  { value: 'INDICATOR', label: 'Indicator' },
  { value: 'KPIC', label: 'KPIC' },
  { value: 'CONTROL', label: 'Control' },
];

const directionOptions = [
  { value: 'HIGH', label: 'HIGH' },
  { value: 'LOW', label: 'LOW' },
];

const frequencyOptions = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

const calculationTypeOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
];

const dataTypeOptions = [
  { value: 'float', label: 'Float' },
  { value: 'integer', label: 'Integer' },
  { value: 'string', label: 'String' },
  { value: 'boolean', label: 'Boolean' },
];

async function fetchFullTree() {
  try {
    const res = await grcRepo.capitalTree({ level: 4 });
    if (res?.result && Array.isArray(res.data)) {
      fullTree.value = res.data;
    }
  } catch {
    fullTree.value = [];
  }
}

function getCapitals() {
  capitalOptions.value = fullTree.value.map((item: Record<string, unknown>) => ({
    value: String(item.slug ?? ''),
    label: String(item.title ?? ''),
  }));
}

function getDomains(capitalSlug: string) {
  if (!capitalSlug) { domainOptions.value = []; return; }
  const capital = fullTree.value.find((item: Record<string, unknown>) => item.slug === capitalSlug);
  domainOptions.value = capital && Array.isArray(capital.children)
    ? capital.children.map((item: Record<string, unknown>) => ({ value: String(item.slug ?? ''), label: String(item.title ?? '') }))
    : [];
}

function getComponents(domainSlug: string) {
  if (!domainSlug) { componentOptions.value = []; return; }
  for (const capital of fullTree.value) {
    if (Array.isArray(capital.children)) {
      const domain = capital.children.find((d: Record<string, unknown>) => d.slug === domainSlug);
      if (domain && Array.isArray(domain.children)) {
        componentOptions.value = domain.children.map((item: Record<string, unknown>) => ({ value: String(item.slug ?? ''), label: String(item.title ?? '') }));
        return;
      }
    }
  }
  componentOptions.value = [];
}

function getCapabilities(componentSlug: string) {
  if (!componentSlug) { capabilityOptions.value = []; return; }
  for (const capital of fullTree.value) {
    if (Array.isArray(capital.children)) {
      for (const domain of capital.children) {
        if (Array.isArray(domain.children)) {
          const component = domain.children.find((c: Record<string, unknown>) => c.slug === componentSlug);
          if (component && Array.isArray(component.children)) {
            capabilityOptions.value = component.children.map((item: Record<string, unknown>) => ({ value: String(item.slug ?? ''), label: String(item.title ?? '') }));
            return;
          }
        }
      }
    }
  }
  capabilityOptions.value = [];
}

async function fetchClaims(capabilitySlug: string) {
  if (!capabilitySlug) { claimOptions.value = []; return; }
  try {
    const res = await grcRepo.claimList({ capabilitySlug, limit: 100 });
    const list = res?.data?.list ?? [];
    claimOptions.value = (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => ({
      value: String(item.slug ?? ''),
      label: String(item.title ?? ''),
    }));
  } catch {
    claimOptions.value = [];
  }
}

function onCapitalChange(slug: string) {
  selectedCapitalSlug.value = slug;
  selectedDomainSlug.value = '';
  selectedComponentSlug.value = '';
  selectedCapabilitySlug.value = '';
  selectedClaimSlug.value = '';
  domainOptions.value = [];
  componentOptions.value = [];
  capabilityOptions.value = [];
  claimOptions.value = [];
  if (slug) getDomains(slug);
}

function onDomainChange(slug: string) {
  selectedDomainSlug.value = slug;
  selectedComponentSlug.value = '';
  selectedCapabilitySlug.value = '';
  selectedClaimSlug.value = '';
  componentOptions.value = [];
  capabilityOptions.value = [];
  claimOptions.value = [];
  if (slug) getComponents(slug);
}

function onComponentChange(slug: string) {
  selectedComponentSlug.value = slug;
  selectedCapabilitySlug.value = '';
  selectedClaimSlug.value = '';
  capabilityOptions.value = [];
  claimOptions.value = [];
  if (slug) getCapabilities(slug);
}

function onCapabilityChange(slug: string) {
  selectedCapabilitySlug.value = slug;
  selectedClaimSlug.value = '';
  claimOptions.value = [];
  if (slug) fetchClaims(slug);
}

function onClaimChange(slug: string) {
  selectedClaimSlug.value = slug;
}

const initialValues = ref({
  slug: '',
  title: '',
  titleEn: '',
  version: '',
  unit: '',
  indicatorType: '',
  metricType: '',
  metricRole: '',
  dataType: '',
  direction: '',
  frequency: '',
  calculationType: '',
  minValue: '',
  maxValue: '',
  annualTarget: '',
  targetYear: '',
  dataOwner: '',
  dataSource: '',
  description: '',
  sustainabilityGoal: '',
  reportingPeriod: '',
  collectionFrequency: '',
});

const validationSchema = computed(() =>
  yup.object({
    slug: yup.string().trim().required(t('sustainability-indicator-page.validation-slug')),
    title: yup.string().trim().required(t('sustainability-indicator-page.validation-title')),
    titleEn: yup.string().trim().optional(),
    version: yup.string().trim().optional(),
    unit: yup.string().trim().optional(),
    indicatorType: yup.string().trim().optional(),
    metricType: yup.string().trim().optional(),
    metricRole: yup.string().trim().optional(),
    dataType: yup.string().trim().optional(),
    direction: yup.string().trim().optional(),
    frequency: yup.string().trim().optional(),
    calculationType: yup.string().trim().optional(),
    minValue: yup.string().trim().optional(),
    maxValue: yup.string().trim().optional(),
    annualTarget: yup.string().trim().optional(),
    targetYear: yup.string().trim().optional(),
    dataOwner: yup.string().trim().optional(),
    dataSource: yup.string().trim().optional(),
    description: yup.string().trim().optional(),
    sustainabilityGoal: yup.string().trim().optional(),
    reportingPeriod: yup.string().trim().optional(),
    collectionFrequency: yup.string().trim().optional(),
  })
);

function seedForm() {
  const rec = props.record;
  initialValues.value = {
    slug: rec ? String(rec.slug ?? '') : '',
    title: rec ? String(rec.title ?? '') : '',
    titleEn: rec ? String(rec.titleEn ?? '') : '',
    version: rec ? String(rec.version ?? '') : '',
    unit: rec ? String(rec.unit ?? '') : '',
    indicatorType: rec ? String(rec.indicatorType ?? '') : '',
    metricType: rec ? String(rec.metricType ?? '') : '',
    metricRole: rec ? String(rec.metricRole ?? '') : '',
    dataType: rec ? String(rec.dataType ?? '') : '',
    direction: rec ? String(rec.direction ?? '') : '',
    frequency: rec ? String(rec.frequency ?? '') : '',
    calculationType: rec ? String(rec.calculationType ?? '') : '',
    minValue: rec ? String(rec.minValue ?? '') : '',
    maxValue: rec ? String(rec.maxValue ?? '') : '',
    annualTarget: rec ? String(rec.annualTarget ?? '') : '',
    targetYear: rec ? String(rec.targetYear ?? '') : '',
    dataOwner: rec ? String(rec.dataOwner ?? '') : '',
    dataSource: rec ? String(rec.dataSource ?? '') : '',
    description: rec ? String(rec.description ?? '') : '',
    sustainabilityGoal: rec ? String(rec.sustainabilityGoal ?? '') : '',
    reportingPeriod: rec ? String(rec.reportingPeriod ?? '') : '',
    collectionFrequency: rec ? String(rec.collectionFrequency ?? '') : '',
  };

  if (rec) {
    selectedCapitalSlug.value = String(rec.capitalSlug ?? '');
    selectedDomainSlug.value = String(rec.domainSlug ?? '');
    selectedComponentSlug.value = String(rec.componentSlug ?? '');
    selectedCapabilitySlug.value = String(rec.capabilitySlug ?? '');
    selectedClaimSlug.value = String(rec.claimSlug ?? '');

    if (selectedCapitalSlug.value) getDomains(selectedCapitalSlug.value);
    if (selectedDomainSlug.value) getComponents(selectedDomainSlug.value);
    if (selectedComponentSlug.value) getCapabilities(selectedComponentSlug.value);
    if (selectedCapabilitySlug.value) fetchClaims(selectedCapabilitySlug.value);
  }

  formKey.value += 1;
}

watch(
  () => [props.show, props.record] as const,
  ([visible]) => {
    if (!visible) return;
    if (fullTree.value.length === 0) {
      fetchFullTree().then(() => { getCapitals(); seedForm(); });
    } else {
      getCapitals();
      seedForm();
    }
  },
  { immediate: true }
);

function close() { emit('update:show', false); emit('close'); }
function onDialogVisible(v: boolean) { emit('update:show', v); if (!v) emit('close'); }

async function onSubmit(values: Record<string, unknown>) {
  const data: Record<string, unknown> = {
    slug: String(values.slug ?? '').trim(),
    title: String(values.title ?? '').trim(),
    titleEn: String(values.titleEn ?? '').trim() || undefined,
    version: String(values.version ?? '').trim() || undefined,
    unit: String(values.unit ?? '').trim() || undefined,
    indicatorType: String(values.indicatorType ?? '').trim() || undefined,
    metricType: String(values.metricType ?? '').trim() || undefined,
    metricRole: String(values.metricRole ?? '').trim() || undefined,
    dataType: String(values.dataType ?? '').trim() || undefined,
    direction: String(values.direction ?? '').trim() || undefined,
    frequency: String(values.frequency ?? '').trim() || undefined,
    calculationType: String(values.calculationType ?? '').trim() || undefined,
    minValue: values.minValue ? Number(values.minValue) : undefined,
    maxValue: values.maxValue ? Number(values.maxValue) : undefined,
    annualTarget: values.annualTarget ? Number(values.annualTarget) : undefined,
    targetYear: values.targetYear ? Number(values.targetYear) : undefined,
    dataOwner: String(values.dataOwner ?? '').trim() || undefined,
    dataSource: String(values.dataSource ?? '').trim() || undefined,
    sustainabilityGoal: String(values.sustainabilityGoal ?? '').trim() || undefined,
    reportingPeriod: String(values.reportingPeriod ?? '').trim() || undefined,
    collectionFrequency: String(values.collectionFrequency ?? '').trim() || undefined,
    capitalSlug: selectedCapitalSlug.value || undefined,
    domainSlug: selectedDomainSlug.value || undefined,
    componentSlug: selectedComponentSlug.value || undefined,
    capabilitySlug: selectedCapabilitySlug.value || undefined,
    claimSlug: selectedClaimSlug.value || undefined,
    status: 1,
  };

  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const recordSlug = String(props.record.slug ?? '');
      result = await grcRepo.indicatorUpdate(recordSlug, data);
    } else {
      result = await grcRepo.indicatorCreate(data);
    }

    if (result?.result) {
      toast(isEdit.value ? t('sustainability-indicator-page.edit-success') : t('sustainability-indicator-page.add-success'), { type: 'success' });
      emit('success');
      close();
    } else {
      toast(String(result?.error ?? (isEdit.value ? t('sustainability-indicator-page.edit-error') : t('sustainability-indicator-page.add-error'))), { type: 'error' });
    }
  } catch (e) {
    toast(e instanceof Error ? e.message : (isEdit.value ? t('sustainability-indicator-page.edit-error') : t('sustainability-indicator-page.add-error')), { type: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal :visible="show" :title="modalTitle" size="lg" @update:visible="onDialogVisible">
    <Form id="indicator-form" :key="formKey" :validation-schema="validationSchema" :initial-values="initialValues" class="space-y-4" @submit="onSubmit">
      <div>
        <div class="grid grid-cols-2 gap-3">
          <BaseInput name="slug" :label="t('sustainability-indicator-page.col-slug')" type="text" required :disabled="isEdit" autofocus />
          <BaseInput name="title" :label="t('sustainability-indicator-page.col-title')" type="text" required />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <BaseInput name="titleEn" :label="t('sustainability-indicator-page.col-title-en')" type="text" />
          <BaseInput name="version" :label="t('sustainability-indicator-page.col-version')" type="text" />
        </div>

        <!-- Cascading Selects -->
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="label min-h-0 py-1"><span class="label-text text-[0.6125rem] font-normal leading-snug">{{ t('sustainability-indicator-page.col-capital') }}</span></label>
            <BaseSelect name="capitalSlug" :model-value="selectedCapitalSlug" :options="capitalOptions" placeholder="" @update:model-value="onCapitalChange" />
          </div>
          <div>
            <label class="label min-h-0 py-1"><span class="label-text text-[0.6125rem] font-normal leading-snug">{{ t('sustainability-indicator-page.col-domain') }}</span></label>
            <BaseSelect name="domainSlug" :model-value="selectedDomainSlug" :options="domainOptions" placeholder="" :disabled="!selectedCapitalSlug" @update:model-value="onDomainChange" />
          </div>
          <div>
            <label class="label min-h-0 py-1"><span class="label-text text-[0.6125rem] font-normal leading-snug">{{ t('sustainability-indicator-page.col-component') }}</span></label>
            <BaseSelect name="componentSlug" :model-value="selectedComponentSlug" :options="componentOptions" placeholder="" :disabled="!selectedDomainSlug" @update:model-value="onComponentChange" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label min-h-0 py-1"><span class="label-text text-[0.6125rem] font-normal leading-snug">{{ t('sustainability-indicator-page.col-capability') }}</span></label>
            <BaseSelect name="capabilitySlug" :model-value="selectedCapabilitySlug" :options="capabilityOptions" placeholder="" :disabled="!selectedComponentSlug" @update:model-value="onCapabilityChange" />
          </div>
          <div>
            <label class="label min-h-0 py-1"><span class="label-text text-[0.6125rem] font-normal leading-snug">{{ t('sustainability-indicator-page.col-claim') }}</span></label>
            <BaseSelect name="claimSlug" :model-value="selectedClaimSlug" :options="claimOptions" placeholder="" :disabled="!selectedCapabilitySlug" @update:model-value="onClaimChange" />
          </div>
        </div>

        <!-- Indicator Properties -->
        <div class="grid grid-cols-4 gap-3">
          <BaseSelect name="indicatorType" :label="t('sustainability-indicator-page.col-indicator-type')" :options="indicatorTypeOptions" placeholder="" filter />
          <BaseSelect name="metricType" :label="t('sustainability-indicator-page.col-metric-type')" :options="metricTypeOptions" placeholder="" />
          <BaseSelect name="metricRole" :label="t('sustainability-indicator-page.col-metric-role')" :options="metricRoleOptions" placeholder="" />
          <BaseSelect name="dataType" :label="t('sustainability-indicator-page.col-data-type')" :options="dataTypeOptions" placeholder="" />
        </div>
        <div class="grid grid-cols-4 gap-3">
          <BaseInput name="unit" :label="t('sustainability-indicator-page.col-unit')" type="text" />
          <BaseSelect name="direction" :label="t('sustainability-indicator-page.col-direction')" :options="directionOptions" placeholder="" />
          <BaseSelect name="frequency" :label="t('sustainability-indicator-page.col-frequency')" :options="frequencyOptions" placeholder="" />
          <BaseSelect name="calculationType" :label="t('sustainability-indicator-page.col-calculation-type')" :options="calculationTypeOptions" placeholder="" />
        </div>
        <div class="grid grid-cols-4 gap-3">
          <BaseInput name="minValue" :label="t('sustainability-indicator-page.col-min-value')" type="number" />
          <BaseInput name="maxValue" :label="t('sustainability-indicator-page.col-max-value')" type="number" />
          <BaseInput name="annualTarget" :label="t('sustainability-indicator-page.col-annual-target')" type="number" />
          <BaseInput name="targetYear" :label="t('sustainability-indicator-page.col-target-year')" type="number" />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <BaseInput name="dataOwner" :label="t('sustainability-indicator-page.col-data-owner')" type="text" />
          <BaseInput name="dataSource" :label="t('sustainability-indicator-page.col-data-source')" type="text" />
          <BaseInput name="reportingPeriod" :label="t('sustainability-indicator-page.col-reporting-period')" type="text" />
        </div>
        <BaseInput name="sustainabilityGoal" :label="t('sustainability-indicator-page.col-sustainability-goal')" type="textarea" />
      </div>
    </Form>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline-secondary" size="sm" class="!rounded-lg" :disabled="saving" @click="close">{{ t('rule.form-cancel') }}</Button>
        <Button type="submit" variant="primary" size="sm" class="!rounded-lg !shadow-md !shadow-primary/20" form="indicator-form" :disabled="saving">{{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}</Button>
      </div>
    </template>
  </BaseModal>
</template>
