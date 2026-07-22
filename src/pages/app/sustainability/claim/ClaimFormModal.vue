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
  return isEdit.value ? t('sustainability-claim-page.edit') : t('sustainability-claim-page.add');
});

// Tree data for cascading selects
interface TreeNode {
  slug: string;
  title: string;
  children?: TreeNode[];
}

const capitalOptions = ref<{ value: string; label: string }[]>([]);
const domainOptions = ref<{ value: string; label: string }[]>([]);
const componentOptions = ref<{ value: string; label: string }[]>([]);
const capabilityOptions = ref<{ value: string; label: string }[]>([]);

const selectedCapitalSlug = ref('');
const selectedDomainSlug = ref('');
const selectedComponentSlug = ref('');
const selectedCapabilitySlug = ref('');

const loadingCapitals = ref(false);
const loadingDomains = ref(false);
const loadingComponents = ref(false);
const loadingCapabilities = ref(false);

const claimTypeOptions = [
  { value: 'EXIST', label: 'Existence' },
  { value: 'DESIGN', label: 'Design Adequacy' },
  { value: 'IMPL', label: 'Implementation' },
  { value: 'EFFECT', label: 'Operating Effectiveness' },
  { value: 'IMPROVE', label: 'Learning & Improvement' },
];

const frequencyOptions = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

// Full tree data cache
const fullTree = ref<Record<string, unknown>[]>([]);

// Fetch full tree once
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

// Get capitals from cached tree
function getCapitals() {
  capitalOptions.value = fullTree.value.map((item: Record<string, unknown>) => ({
    value: String(item.slug ?? ''),
    label: String(item.title ?? ''),
  }));
}

// Get domains from cached tree
function getDomains(capitalSlug: string) {
  if (!capitalSlug) {
    domainOptions.value = [];
    return;
  }
  const capital = fullTree.value.find((item: Record<string, unknown>) => item.slug === capitalSlug);
  if (capital && Array.isArray(capital.children)) {
    domainOptions.value = capital.children.map((item: Record<string, unknown>) => ({
      value: String(item.slug ?? ''),
      label: String(item.title ?? ''),
    }));
  } else {
    domainOptions.value = [];
  }
}

// Get components from cached tree
function getComponents(domainSlug: string) {
  if (!domainSlug) {
    componentOptions.value = [];
    return;
  }
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

// Get capabilities from cached tree
function getCapabilities(componentSlug: string) {
  if (!componentSlug) {
    capabilityOptions.value = [];
    return;
  }
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

// Handle capital change
function onCapitalChange(slug: string) {
  selectedCapitalSlug.value = slug;
  selectedDomainSlug.value = '';
  selectedComponentSlug.value = '';
  selectedCapabilitySlug.value = '';
  domainOptions.value = [];
  componentOptions.value = [];
  capabilityOptions.value = [];
  if (slug) {
    getDomains(slug);
  }
}

// Handle domain change
function onDomainChange(slug: string) {
  selectedDomainSlug.value = slug;
  selectedComponentSlug.value = '';
  selectedCapabilitySlug.value = '';
  componentOptions.value = [];
  capabilityOptions.value = [];
  if (slug) {
    getComponents(slug);
  }
}

// Handle component change
function onComponentChange(slug: string) {
  selectedComponentSlug.value = slug;
  selectedCapabilitySlug.value = '';
  capabilityOptions.value = [];
  if (slug) {
    getCapabilities(slug);
  }
}

function handleCapabilityChange(slug: string) {
  selectedCapabilitySlug.value = slug;
}

const initialValues = ref({
  slug: '',
  title: '',
  titleEn: '',
  version: '',
  sequence: '',
  claimType: '',
  frequency: '',
  importance: '',
  industries: [] as string[],
  description: '',
  evidenceRequired: '',
  capitalSlug: '',
  domainSlug: '',
  componentSlug: '',
  capabilitySlug: '',
});

const validationSchema = computed(() =>
  yup.object({
    slug: yup
      .string()
      .trim()
      .required(t('sustainability-claim-page.validation-slug'))
      .matches(/^[A-Za-z][A-Za-z0-9]*(-[A-Za-z0-9]+)*$/, t('sustainability-claim-page.validation-slug-pattern')),
    title: yup
      .string()
      .trim()
      .required(t('sustainability-claim-page.validation-title')),
    titleEn: yup.string().trim().optional(),
    version: yup.string().trim().optional(),
    sequence: yup.string().trim().optional(),
    claimType: yup.string().trim().optional(),
    frequency: yup.string().trim().optional(),
    importance: yup.string().trim().optional(),
    industries: yup.array().optional(),
    description: yup.string().trim().optional(),
    evidenceRequired: yup.string().trim().optional(),
  })
);

function seedForm() {
  const rec = props.record;

  const capitalSlug = rec ? String(rec.capitalSlug ?? '') : '';
  const domainSlug = rec ? String(rec.domainSlug ?? '') : '';
  const componentSlug = rec ? String(rec.componentSlug ?? '') : '';
  const capabilitySlug = rec ? String(rec.capabilitySlug ?? '') : '';

  initialValues.value = {
    slug: rec ? String(rec.slug ?? '') : '',
    title: rec ? String(rec.title ?? '') : '',
    titleEn: rec ? String(rec.titleEn ?? '') : '',
    version: rec ? String(rec.version ?? '') : '',
    sequence: rec ? String(rec.sequence ?? '') : '',
    claimType: rec ? String(rec.claimType ?? '') : '',
    frequency: rec ? String(rec.frequency ?? '') : '',
    importance: rec ? String(rec.importance ?? '') : '',
    industries: rec && Array.isArray(rec.industries) ? (rec.industries as string[]) : [],
    description: rec ? String(rec.description ?? '') : '',
    evidenceRequired: rec ? String(rec.evidenceRequired ?? '') : '',

    // ADD THESE
    capitalSlug,
    domainSlug,
    componentSlug,
    capabilitySlug,
  };

  // Set controlled refs
  selectedCapitalSlug.value = capitalSlug;
  selectedDomainSlug.value = domainSlug;
  selectedComponentSlug.value = componentSlug;
  selectedCapabilitySlug.value = capabilitySlug;

  // Populate options in correct order
  if (capitalSlug) {
    getDomains(capitalSlug);
  }
  if (domainSlug) {
    getComponents(domainSlug);
  }
  if (componentSlug) {
    getCapabilities(componentSlug);
  }

  formKey.value += 1;
}
watch(
  () => [props.show, props.record] as const,
  ([visible]) => {
    if (!visible) return;

    // Load tree first, then seed form after tree is ready
    if (fullTree.value.length === 0) {
      fetchFullTree().then(() => {
        getCapitals();
        seedForm();
      });
    } else {
      getCapitals();
      seedForm();
    }
  },
  { immediate: true }
);

function close() {
  emit('update:show', false);
  emit('close');
}

function onDialogVisible(v: boolean) {
  emit('update:show', v);
  if (!v) emit('close');
}

async function onSubmit(values: Record<string, unknown>) {
  const slug = String(values.slug ?? '').trim();
  const title = String(values.title ?? '').trim();
  const titleEn = String(values.titleEn ?? '').trim();
  const version = String(values.version ?? '').trim();
  const sequence = values.sequence ? Number(values.sequence) : undefined;
  const claimType = String(values.claimType ?? '').trim();
  const frequency = String(values.frequency ?? '').trim() || undefined;
  const importance = values.importance ? Number(values.importance) : undefined;
  const industries = Array.isArray(values.industries) ? values.industries : [];
  const description = String(values.description ?? '').trim();
  const evidenceRequired = String(values.evidenceRequired ?? '').trim() || undefined;

  // Get titles from the tree for the selected slugs
  const capitalTitle = capitalOptions.value.find(o => o.value === selectedCapitalSlug.value)?.label ?? '';
  const domainTitle = domainOptions.value.find(o => o.value === selectedDomainSlug.value)?.label ?? '';
  const componentTitle = componentOptions.value.find(o => o.value === selectedComponentSlug.value)?.label ?? '';
  const capabilityTitle = capabilityOptions.value.find(o => o.value === selectedCapabilitySlug.value)?.label ?? '';

  // Get codes from the tree
  const capitalCode = selectedCapitalSlug.value;
  const domainCode = selectedDomainSlug.value;
  const componentCode = selectedComponentSlug.value;
  const capabilityCode = selectedCapabilitySlug.value;

  // Get capitalType from the tree
  const capitalNode = fullTree.value.find((item: Record<string, unknown>) => item.slug === selectedCapitalSlug.value);
  const capitalType = capitalNode ? String(capitalNode.capitalType ?? '') : '';

  saving.value = true;
  try {
    let result;
    if (isEdit.value && props.record) {
      const recordSlug = String(props.record.slug ?? '');
      result = await grcRepo.claimUpdate(recordSlug, {
        title,
        titleEn,
        version,
        sequence,
        claimType,
        frequency,
        importance,
        industries,
        description,
        evidenceRequired,
        capitalSlug: selectedCapitalSlug.value,
        capitalCode,
        capitalTitle,
        capitalType,
        domainSlug: selectedDomainSlug.value,
        domainCode,
        domainTitle,
        componentSlug: selectedComponentSlug.value,
        componentCode,
        componentTitle,
        capabilitySlug: selectedCapabilitySlug.value,
        capabilityCode,
        capabilityTitle,
        parentSlug: selectedCapabilitySlug.value,
        parentSource: 'capability',
      });
    } else {
      result = await grcRepo.claimCreate({
        slug,
        title,
        titleEn,
        version,
        sequence,
        claimType,
        frequency,
        importance,
        industries,
        description,
        evidenceRequired,
        capitalSlug: selectedCapitalSlug.value,
        capitalCode,
        capitalTitle,
        capitalType,
        domainSlug: selectedDomainSlug.value,
        domainCode,
        domainTitle,
        componentSlug: selectedComponentSlug.value,
        componentCode,
        componentTitle,
        capabilitySlug: selectedCapabilitySlug.value,
        capabilityCode,
        capabilityTitle,
        parentSlug: selectedCapabilitySlug.value,
        parentSource: 'capability',
        status: 1,
      });
    }

    if (result?.result) {
      toast(
        isEdit.value
          ? t('sustainability-claim-page.edit-success')
          : t('sustainability-claim-page.add-success'),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error ??
            (isEdit.value
              ? t('sustainability-claim-page.edit-error')
              : t('sustainability-claim-page.add-error'))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : isEdit.value
          ? t('sustainability-claim-page.edit-error')
          : t('sustainability-claim-page.add-error'),
      { type: 'error' }
    );
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal
    :visible="show"
    :title="modalTitle"
    size="md"
    @update:visible="onDialogVisible"
  >
    <Form
      id="claim-form"
      :key="formKey"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-4"
      @submit="onSubmit"
    >
      <div>
        <BaseInput
          name="slug"
          :label="t('sustainability-claim-page.col-slug')"
          type="text"
          required
          :disabled="isEdit"
          autofocus
        />
        <BaseInput
          name="title"
          :label="t('sustainability-claim-page.col-title')"
          type="text"
          required
        />
        <BaseInput
          name="titleEn"
          :label="t('sustainability-claim-page.col-title-en')"
          type="text"
        />

        <!-- Cascading Selects -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label min-h-0 py-1">
              <span class="label-text text-[0.6125rem] font-normal leading-snug">
                {{ t('sustainability-claim-page.col-capital') }}
              </span>
            </label>
            <BaseSelect
              name="capitalSlug"
              :model-value="selectedCapitalSlug"
              :options="capitalOptions"
              placeholder=""
              :disabled="loadingCapitals"
              @update:model-value="onCapitalChange"
            />
          </div>

          <div>
            <label class="label min-h-0 py-1">
              <span class="label-text text-[0.6125rem] font-normal leading-snug">
                {{ t('sustainability-claim-page.col-domain') }}
              </span>
            </label>
            <BaseSelect
              name="domainSlug"
              :model-value="selectedDomainSlug"
              :options="domainOptions"
              placeholder=""
              :disabled="loadingDomains || !selectedCapitalSlug"
              @update:model-value="onDomainChange"
            />
          </div>

          <div>
            <label class="label min-h-0 py-1">
              <span class="label-text text-[0.6125rem] font-normal leading-snug">
                {{ t('sustainability-claim-page.col-component') }}
              </span>
            </label>
            <BaseSelect
              name="componentSlug"
              :model-value="selectedComponentSlug"
              :options="componentOptions"
              placeholder=""
              :disabled="loadingComponents || !selectedDomainSlug"
              @update:model-value="onComponentChange"
            />
          </div>

          <div>
            <label class="label min-h-0 py-1">
              <span class="label-text text-[0.6125rem] font-normal leading-snug">
                {{ t('sustainability-claim-page.col-capability') }}
              </span>
            </label>
            <BaseSelect
              name="capabilitySlug"
              :model-value="selectedCapabilitySlug"
              :options="capabilityOptions"
              placeholder=""
              :disabled="loadingCapabilities || !selectedComponentSlug"
              @update:model-value="handleCapabilityChange"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <BaseInput
            name="version"
            :label="t('sustainability-claim-page.col-version')"
            type="text"
          />
          <BaseInput
            name="sequence"
            :label="t('sustainability-claim-page.col-sequence')"
            type="number"
          />
          <BaseInput
            name="importance"
            :label="t('sustainability-claim-page.col-importance')"
            type="number"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <BaseSelect
            name="claimType"
            :label="t('sustainability-claim-page.col-claim-type')"
            :options="claimTypeOptions"
            placeholder=""
            filter
          />
          <BaseSelect
            name="frequency"
            :label="t('sustainability-claim-page.col-frequency')"
            :options="frequencyOptions"
            placeholder=""
          />
        </div>
        <BaseInput
          name="description"
          :label="t('sustainability-claim-page.col-description')"
          type="textarea"
        />
        <BaseInput
          name="evidenceRequired"
          :label="t('sustainability-claim-page.col-evidence-required')"
          type="text"
        />
      </div>
    </Form>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          class="!rounded-lg"
          :disabled="saving"
          @click="close"
        >
          {{ t('rule.form-cancel') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          class="!rounded-lg !shadow-md !shadow-primary/20"
          form="claim-form"
          :disabled="saving"
        >
          {{ isEdit ? t('rule.form-edit-submit') : t('rule.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>
