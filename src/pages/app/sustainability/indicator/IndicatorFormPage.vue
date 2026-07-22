<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { grcRepo } from '@/core/repositories/grcRepo';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const saving = ref(false);
const formKey = ref(0);
const loading = ref(false);

const slug = computed(() => route.params.slug as string | undefined);
const isEdit = computed(() => !!slug.value);

const pageTitle = computed(() => isEdit.value
    ? t('sustainability-indicator-page.edit')
    : t('sustainability-indicator-page.add')
);

// Tree & Options
const fullTree = ref<Record<string, unknown>[]>([]);

const capitalOptions = ref<{ value: string; label: string }[]>([]);
const domainOptions = ref<{ value: string; label: string }[]>([]);
const componentOptions = ref<{ value: string; label: string }[]>([]);
const capabilityOptions = ref<{ value: string; label: string }[]>([]);
const claimOptions = ref<{ value: string; label: string }[]>([]);

// Selected values
const selectedCapitalSlug = ref('');
const selectedDomainSlug = ref('');
const selectedComponentSlug = ref('');
const selectedCapabilitySlug = ref('');
const selectedClaimSlug = ref('');

// Dropdown options
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

const dataTypeOptions = [
  { value: 'float', label: 'Float' },
  { value: 'integer', label: 'Integer' },
  { value: 'string', label: 'String' },
  { value: 'boolean', label: 'Boolean' },
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

// ==================== CASCADING FUNCTIONS ====================
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
      ? capital.children.map((item: Record<string, unknown>) => ({
        value: String(item.slug ?? ''),
        label: String(item.title ?? ''),
      }))
      : [];
}

function getComponents(domainSlug: string) {
  if (!domainSlug) { componentOptions.value = []; return; }
  for (const capital of fullTree.value) {
    if (Array.isArray(capital.children)) {
      const domain = capital.children.find((d: Record<string, unknown>) => d.slug === domainSlug);
      if (domain && Array.isArray(domain.children)) {
        componentOptions.value = domain.children.map((item: Record<string, unknown>) => ({
          value: String(item.slug ?? ''),
          label: String(item.title ?? ''),
        }));
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
            capabilityOptions.value = component.children.map((item: Record<string, unknown>) => ({
              value: String(item.slug ?? ''),
              label: String(item.title ?? ''),
            }));
            return;
          }
        }
      }
    }
  }
  capabilityOptions.value = [];
}

async function fetchClaims(capabilitySlug: string) {
  if (!capabilitySlug) {
    claimOptions.value = [];
    return;
  }
  try {
    const res = await grcRepo.claimList({ capabilitySlug, limit: 100 });
    const list = res?.data?.list ?? [];
    claimOptions.value = Array.isArray(list)
        ? list.map((item: Record<string, unknown>) => ({
          value: String(item.slug ?? ''),
          label: String(item.title ?? ''),
        }))
        : [];
  } catch {
    claimOptions.value = [];
  }
}

// Change Handlers
function resetLowerLevels() {
  selectedDomainSlug.value = '';
  selectedComponentSlug.value = '';
  selectedCapabilitySlug.value = '';
  selectedClaimSlug.value = '';
  domainOptions.value = [];
  componentOptions.value = [];
  capabilityOptions.value = [];
  claimOptions.value = [];
}

function onCapitalChange(slug: string) {
  selectedCapitalSlug.value = slug;
  resetLowerLevels();
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

// ==================== FORM SETUP ====================
const initialValues = ref({
  slug: '', title: '', titleEn: '', version: '', unit: '',
  indicatorType: '', metricType: '', metricRole: '', dataType: '',
  direction: '', frequency: '', calculationType: '',
  minValue: '', maxValue: '', annualTarget: '', targetYear: '',
  dataOwner: '', dataSource: '', description: '',
  sustainabilityGoal: '', reportingPeriod: '', collectionFrequency: '',
  capitalSlug: '', domainSlug: '', componentSlug: '', capabilitySlug: '', claimSlug: '',
});

const validationSchema = computed(() => yup.object({
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
}));

// ==================== LOAD RECORD ====================
async function loadRecord() {
  if (!slug.value) return;
  loading.value = true;

  try {
    const res = await grcRepo.indicatorGet(slug.value);
    if (res?.result && res.data) {
      const rec = res.data as Record<string, unknown>;

      const capitalSlug = String(rec.capitalSlug ?? '');
      const domainSlug = String(rec.domainSlug ?? '');
      const componentSlug = String(rec.componentSlug ?? '');
      const capabilitySlug = String(rec.capabilitySlug ?? '');
      const claimSlug = String(rec.claimSlug ?? '');

      // Set form initial values
      initialValues.value = {
        slug: String(rec.slug ?? ''),
        title: String(rec.title ?? ''),
        titleEn: String(rec.titleEn ?? ''),
        version: String(rec.version ?? ''),
        unit: String(rec.unit ?? ''),
        indicatorType: String(rec.indicatorType ?? ''),
        metricType: String(rec.metricType ?? ''),
        metricRole: String(rec.metricRole ?? ''),
        dataType: String(rec.dataType ?? ''),
        direction: String(rec.direction ?? ''),
        frequency: String(rec.frequency ?? ''),
        calculationType: String(rec.calculationType ?? ''),
        minValue: String(rec.minValue ?? ''),
        maxValue: String(rec.maxValue ?? ''),
        annualTarget: String(rec.annualTarget ?? ''),
        targetYear: String(rec.targetYear ?? ''),
        dataOwner: String(rec.dataOwner ?? ''),
        dataSource: String(rec.dataSource ?? ''),
        description: String(rec.description ?? ''),
        sustainabilityGoal: String(rec.sustainabilityGoal ?? ''),
        reportingPeriod: String(rec.reportingPeriod ?? ''),
        collectionFrequency: String(rec.collectionFrequency ?? ''),
        capitalSlug, domainSlug, componentSlug, capabilitySlug, claimSlug,
      };

      // Set selected slugs
      selectedCapitalSlug.value = capitalSlug;
      selectedDomainSlug.value = domainSlug;
      selectedComponentSlug.value = componentSlug;
      selectedCapabilitySlug.value = capabilitySlug;
      selectedClaimSlug.value = claimSlug;

      // Populate options sequentially
      if (capitalSlug) {
        getDomains(capitalSlug);
        await nextTick();
      }
      if (domainSlug) {
        getComponents(domainSlug);
        await nextTick();
      }
      if (componentSlug) {
        getCapabilities(componentSlug);
        await nextTick();
      }
      if (capabilitySlug) {
        await fetchClaims(capabilitySlug);
        await nextTick();
      }

      formKey.value += 1;
    }
  } catch (err) {
    console.error(err);
    toast(t('general.error'), { type: 'error' });
  } finally {
    loading.value = false;
  }
}

// ==================== LIFECYCLE ====================
async function fetchFullTree() {
  try {
    const res = await grcRepo.capitalTree({ level: 4 });
    if (res?.result && Array.isArray(res.data)) fullTree.value = res.data;
  } catch (e) {
    console.error(e);
    fullTree.value = [];
  }
}

onMounted(async () => {
  await fetchFullTree();
  getCapitals();
  if (isEdit.value) {
    await loadRecord();
  } else {
    formKey.value += 1;
  }
});

function goBack() {
  router.push({ name: 'app-sustainability-indicator' });
}

async function onSubmit(values: Record<string, unknown>) {
  const capitalTitle = capitalOptions.value.find(o => o.value === selectedCapitalSlug.value)?.label ?? '';
  const domainTitle = domainOptions.value.find(o => o.value === selectedDomainSlug.value)?.label ?? '';
  const componentTitle = componentOptions.value.find(o => o.value === selectedComponentSlug.value)?.label ?? '';
  const capabilityTitle = capabilityOptions.value.find(o => o.value === selectedCapabilitySlug.value)?.label ?? '';
  const claimTitle = claimOptions.value.find(o => o.value === selectedClaimSlug.value)?.label ?? '';

  const capitalCode = selectedCapitalSlug.value;
  const domainCode = selectedDomainSlug.value;
  const componentCode = selectedComponentSlug.value;
  const capabilityCode = selectedCapabilitySlug.value;
  const claimCode = selectedClaimSlug.value;

  const capitalNode = fullTree.value.find((item: Record<string, unknown>) => item.slug === selectedCapitalSlug.value);
  const capitalType = capitalNode ? String(capitalNode.capitalType ?? '') : '';

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
    capitalCode, capitalTitle, capitalType,
    domainSlug: selectedDomainSlug.value || undefined,
    domainCode, domainTitle,
    componentSlug: selectedComponentSlug.value || undefined,
    componentCode, componentTitle,
    capabilitySlug: selectedCapabilitySlug.value || undefined,
    capabilityCode, capabilityTitle,
    claimSlug: selectedClaimSlug.value || undefined,
    claimCode, claimTitle,
    parentSlug: selectedClaimSlug.value || selectedCapabilitySlug.value || selectedComponentSlug.value || selectedDomainSlug.value || selectedCapitalSlug.value || undefined,
    parentSource: selectedClaimSlug.value ? 'claim' : selectedCapabilitySlug.value ? 'capability' : selectedComponentSlug.value ? 'component' : selectedDomainSlug.value ? 'domain' : 'capital',
    status: 1,
  };

  saving.value = true;
  try {
    let result;
    if (isEdit.value && slug.value) {
      result = await grcRepo.indicatorUpdate(slug.value, data);
    } else {
      result = await grcRepo.indicatorCreate(data);
    }

    if (result?.result) {
      toast(isEdit.value ? t('sustainability-indicator-page.edit-success') : t('sustainability-indicator-page.add-success'), { type: 'success' });
      if (isEdit.value) {
        goBack();
      } else {
        // Redirect to detail page after creation
        const newSlug = data.slug || String(result.data?.slug ?? '');
        router.push({ name: 'app-sustainability-indicator-detail', params: { slug: newSlug } });
      }
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
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50/80 to-primary-muted/10 p-6 dark:from-darkmode-900 dark:via-darkmode-800 dark:to-primary-muted/5">
    <div class="mx-auto max-w-5xl">
      <!-- Header -->
      <div class="mb-6 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-lg shadow-primary/5 dark:border-darkmode-700/40 dark:bg-darkmode-800 dark:shadow-black/10">
        <div class="border-b border-slate-100 bg-gradient-to-r from-primary/5 via-transparent to-primary-muted/10 px-6 py-4 dark:border-darkmode-700/50 dark:from-primary/10 dark:to-primary-muted/5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-darkmode-700" @click="goBack">
                <Lucide icon="ArrowRight" class="h-4 w-4" />
              </button>
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20">
                <Lucide icon="BarChart3" class="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ pageTitle }}</h1>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-16">
          <div class="h-8 w-8 animate-spin rounded-full border-3 border-slate-300 border-t-primary"></div>
        </div>

        <!-- Form -->
        <div v-else class="p-6">
          <Form :key="formKey" :validation-schema="validationSchema" :initial-values="initialValues" class="space-y-6" @submit="onSubmit">
            <!-- Basic Info -->
            <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-darkmode-600 dark:bg-darkmode-700/30">
              <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{{ t('sustainability-indicator-page.section-basic') }}</h3>
              <div class="grid grid-cols-2 gap-4">
                <BaseInput name="slug" :label="t('sustainability-indicator-page.col-slug')" type="text" required :disabled="isEdit" autofocus />
                <BaseInput name="title" :label="t('sustainability-indicator-page.col-title')" type="text" required />
              </div>
              <div class="grid grid-cols-2 gap-4 mt-3">
                <BaseInput name="titleEn" :label="t('sustainability-indicator-page.col-title-en')" type="text" />
                <BaseInput name="version" :label="t('sustainability-indicator-page.col-version')" type="text" />
              </div>
            </div>

            <!-- Cascading Selects -->
            <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-darkmode-600 dark:bg-darkmode-700/30">
              <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{{ t('sustainability-indicator-page.section-tree') }}</h3>
              <div class="grid grid-cols-3 gap-4">
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
              <div class="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label class="label min-h-0 py-1"><span class="label-text text-[0.6125rem] font-normal leading-snug">{{ t('sustainability-indicator-page.col-capability') }}</span></label>
                  <BaseSelect name="capabilitySlug" :model-value="selectedCapabilitySlug" :options="capabilityOptions" placeholder="" :disabled="!selectedComponentSlug" @update:model-value="onCapabilityChange" />
                </div>
                <div>
                  <label class="label min-h-0 py-1"><span class="label-text text-[0.6125rem] font-normal leading-snug">{{ t('sustainability-indicator-page.col-claim') }}</span></label>
                  <BaseSelect name="claimSlug" :model-value="selectedClaimSlug" :options="claimOptions" placeholder="" :disabled="!selectedCapabilitySlug" @update:model-value="onClaimChange" />
                </div>
              </div>
            </div>

            <!-- Indicator Properties -->
            <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-darkmode-600 dark:bg-darkmode-700/30">
              <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{{ t('sustainability-indicator-page.section-properties') }}</h3>
              <div class="grid grid-cols-4 gap-4">
                <BaseSelect name="indicatorType" :label="t('sustainability-indicator-page.col-indicator-type')" :options="indicatorTypeOptions" placeholder="" filter />
                <BaseSelect name="metricType" :label="t('sustainability-indicator-page.col-metric-type')" :options="metricTypeOptions" placeholder="" />
                <BaseSelect name="metricRole" :label="t('sustainability-indicator-page.col-metric-role')" :options="metricRoleOptions" placeholder="" />
                <BaseSelect name="dataType" :label="t('sustainability-indicator-page.col-data-type')" :options="dataTypeOptions" placeholder="" />
              </div>
              <div class="grid grid-cols-4 gap-4 mt-3">
                <BaseInput name="unit" :label="t('sustainability-indicator-page.col-unit')" type="text" />
                <BaseSelect name="direction" :label="t('sustainability-indicator-page.col-direction')" :options="directionOptions" placeholder="" />
                <BaseSelect name="frequency" :label="t('sustainability-indicator-page.col-frequency')" :options="frequencyOptions" placeholder="" />
                <BaseSelect name="calculationType" :label="t('sustainability-indicator-page.col-calculation-type')" :options="calculationTypeOptions" placeholder="" />
              </div>
              <div class="grid grid-cols-4 gap-4 mt-3">
                <BaseInput name="minValue" :label="t('sustainability-indicator-page.col-min-value')" type="number" />
                <BaseInput name="maxValue" :label="t('sustainability-indicator-page.col-max-value')" type="number" />
                <BaseInput name="annualTarget" :label="t('sustainability-indicator-page.col-annual-target')" type="number" />
                <BaseInput name="targetYear" :label="t('sustainability-indicator-page.col-target-year')" type="number" />
              </div>
              <div class="grid grid-cols-3 gap-4 mt-3">
                <BaseInput name="dataOwner" :label="t('sustainability-indicator-page.col-data-owner')" type="text" />
                <BaseInput name="dataSource" :label="t('sustainability-indicator-page.col-data-source')" type="text" />
                <BaseInput name="reportingPeriod" :label="t('sustainability-indicator-page.col-reporting-period')" type="text" />
              </div>
              <div class="mt-3">
                <BaseInput name="sustainabilityGoal" :label="t('sustainability-indicator-page.col-sustainability-goal')" type="textarea" />
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
              <Button type="button" variant="outline-secondary" size="sm" class="!rounded-lg" @click="goBack">{{ t('rule.form-cancel') }}</Button>
              <Button type="submit" variant="primary" size="sm" class="!rounded-lg !px-6" :disabled="saving">
                <Lucide v-if="saving" icon="Loader2" class="h-4 w-4 animate-spin" />
                {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  </div>
</template>
