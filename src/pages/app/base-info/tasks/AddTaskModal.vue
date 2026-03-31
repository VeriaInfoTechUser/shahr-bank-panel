<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import Button from '@/base-components/Button';
import { ermRepo } from '@/core/repositories/ermRepo';

type TaskRow = Record<string, unknown>;
type Option = { value: string; label: string };
type DomainNode = Record<string, unknown> & { children?: DomainNode[] };

const props = withDefaults(
  defineProps<{
    show: boolean;
    mode?: 'add' | 'edit';
    task?: TaskRow | null;
    /** در حالت افزودن: شناسهٔ تعهد والد (صفحهٔ فیلترشده با reference_id) */
    referenceId?: number | null;
  }>(),
  {
    mode: 'add',
    task: null,
    referenceId: null,
  }
);

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t, locale } = useI18n();
const formRef = ref<InstanceType<typeof Form> | null>(null);
const optionsLoading = ref(true);
const saving = ref(false);
const formKey = ref(0);
const selectedDomainId = ref('');

const domainTree = ref<DomainNode[]>([]);
const domainOptions = ref<Option[]>([]);
const warrantyRows = ref<Record<string, unknown>[]>([]);
const warrantyOptions = ref<Option[]>([]);
const ruleOptions = ref<Option[]>([]);
const mandatoryUnitOptions = ref<Option[]>([]);
const mandatoryUnitsRaw = ref<Record<string, unknown>[]>([]);

function extractErmList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  const r = res as { data?: unknown; list?: unknown[] };
  const d = r?.data;
  if (Array.isArray(d)) return d as Record<string, unknown>[];
  if (d && typeof d === 'object' && 'list' in d && Array.isArray((d as { list: unknown[] }).list)) {
    return (d as { list: Record<string, unknown>[] }).list;
  }
  if (Array.isArray(r?.list)) return r.list as Record<string, unknown>[];
  return [];
}

function mapRowsToIdFirstOptions(rows: Record<string, unknown>[]): Option[] {
  return rows
    .map((row) => {
      const value = String(row.id ?? row.value ?? row.slug ?? '');
      const label = String(row.title ?? row.name ?? value);
      return { value, label };
    })
    .filter((x) => x.value);
}

function mapWarrantyRowsToOptions(rows: Record<string, unknown>[]): Option[] {
  return rows
    .map((row) => {
      const numId = Number(row.id ?? row.warranty_id ?? row.value);
      if (!Number.isFinite(numId)) return null;
      return {
        value: String(numId),
        label: String(row.title ?? row.name ?? row.id ?? ''),
      };
    })
    .filter((x): x is Option => x != null);
}

const initialValues = ref({
  domain_id: '',
  section_id: '',
  warranty_id: '',
  code: '',
  has_clause: '0',
  rule_id: '',
  mandatory_unit_ids: [] as string[],
  title: '',
});

const validationSchema = computed(() =>
  yup.object({
    domain_id: yup.string().required(t('task.validation-domain-required')),
    section_id: yup.string().required(t('task.validation-subject-required')),
    warranty_id: yup.string().required(t('task.validation-type-required')),
    code: yup.string().optional(),
    has_clause: yup.string().required(),
    rule_id: yup.string().required(t('task.validation-rule-required')),
    mandatory_unit_ids: yup
      .array()
      .of(yup.string())
      .min(1, t('task.validation-mandatory-unit-required')),
    title: yup.string().required(t('task.validation-title-required')),
  })
);

watch(locale, async () => {
  await nextTick();
  const exposed = formRef.value as { validate?: () => Promise<unknown> } | null;
  await exposed?.validate?.();
});

const subjectOptions = computed<Option[]>(() => {
  const domain = domainTree.value.find((d) => String(d.id) === selectedDomainId.value);
  const children = Array.isArray(domain?.children) ? domain.children : [];
  return children.map((c) => ({
    value: String(c.id ?? c.slug ?? ''),
    label: String(c.title ?? c.name ?? c.id ?? ''),
  })).filter((x) => x.value);
});

/** حوزه = گرهٔ والد در درخت؛ موضوع = برگ. API گاهی `section.children` (موضوع) و گاهی `section.parent_id` (حوزه) می‌دهد */
function resolveDomainAndSectionIds(row: TaskRow): { domainId: string; sectionId: string } {
  const section = row.section as Record<string, unknown> | undefined;
  const topSectionId =
    row.section_id != null && row.section_id !== '' ? String(row.section_id) : '';
  const domainFromRow = row.domain as Record<string, unknown> | undefined;

  if (!section) {
    return {
      domainId: String(row.domain_id ?? domainFromRow?.id ?? ''),
      sectionId: topSectionId,
    };
  }

  const childrenRaw = section.children;
  if (childrenRaw != null) {
    if (Array.isArray(childrenRaw) && childrenRaw.length > 0) {
      const matched =
        topSectionId.length > 0
          ? childrenRaw.find(
              (c) => String((c as Record<string, unknown>).id) === topSectionId
            )
          : undefined;
      const child = (matched ?? childrenRaw[0]) as Record<string, unknown>;
      return {
        domainId: String(section.id ?? ''),
        sectionId: String(child.id ?? topSectionId),
      };
    }
    if (typeof childrenRaw === 'object') {
      const child = childrenRaw as Record<string, unknown>;
      return {
        domainId: String(section.id ?? ''),
        sectionId: String(child.id ?? topSectionId),
      };
    }
  }

  const parentId = section.parent_id;
  if (parentId != null && parentId !== '') {
    return {
      domainId: String(parentId),
      sectionId: String(section.id ?? topSectionId),
    };
  }

  return {
    domainId: String(
      domainFromRow?.id ?? row.domain_id ?? section.domain_id ?? section.id ?? ''
    ),
    sectionId: String(topSectionId || (section.id ?? '')),
  };
}

function buildInitialValues() {
  if (props.mode !== 'edit' || !props.task) {
    selectedDomainId.value = '';
    initialValues.value = {
      domain_id: '',
      section_id: '',
      warranty_id: '',
      code: '',
      has_clause: '0',
      rule_id: '',
      mandatory_unit_ids: [],
      title: '',
    };
    return;
  }

  const row = props.task;
  const { domainId, sectionId } = resolveDomainAndSectionIds(row);
  const mandatory = row.mandatory_unit as Array<Record<string, unknown>> | undefined;
  const warranty = row.warranty as Record<string, unknown> | undefined;
  const rule = row.rule as Record<string, unknown> | undefined;

  selectedDomainId.value = domainId;
  initialValues.value = {
    domain_id: domainId,
    section_id: sectionId,
    warranty_id: String(
      warranty?.id ?? warranty?.warranty_id ?? row.warranty_id ?? ''
    ),
    code: String(row.code ?? ''),
    has_clause: row.has_clause === 1 || row.has_clause === true ? '1' : '0',
    rule_id: String(rule?.id ?? row.rule_id ?? ''),
    mandatory_unit_ids: Array.isArray(mandatory)
      ? mandatory
          .map((m) => String(m.id ?? ''))
          .filter((id) => id !== '')
      : [],
    title: String(row.title ?? ''),
  };
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const listParams = { page: 1, limit: 500, api_version: 8 };
    const [domainRes, warrantyRes, rulesRes, mandatoryRes] = await Promise.all([
      ermRepo.domainTree(listParams),
      ermRepo.warrantyList(listParams),
      ermRepo.list(listParams),
      ermRepo.mandatoryUnitList(listParams),
    ]);

    const domainData = (domainRes as { data?: unknown[] })?.data;
    domainTree.value = Array.isArray(domainData) ? (domainData as DomainNode[]) : [];
    domainOptions.value = domainTree.value.map((d) => ({
      value: String(d.id ?? d.slug ?? ''),
      label: String(d.title ?? d.name ?? d.id ?? ''),
    })).filter((x) => x.value);

    warrantyRows.value = extractErmList(warrantyRes);
    warrantyOptions.value = mapWarrantyRowsToOptions(warrantyRows.value);
    const rulesData = (rulesRes as { data?: { list?: unknown[] } | unknown[] })?.data;
    const rulesList = Array.isArray(rulesData)
      ? rulesData
      : (rulesData && typeof rulesData === 'object' && 'list' in rulesData && Array.isArray((rulesData as { list: unknown[] }).list))
        ? (rulesData as { list: unknown[] }).list
        : [];
    ruleOptions.value = rulesList
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          value: String(row.id ?? row.value ?? row.slug ?? ''),
          label: String(row.rule ?? row.title ?? row.name ?? row.id ?? ''),
        };
      })
      .filter((x) => x.value);
    mandatoryUnitsRaw.value = extractErmList(mandatoryRes);
    mandatoryUnitOptions.value = mapRowsToIdFirstOptions(mandatoryUnitsRaw.value);
  } catch {
    toast(t('rule.form-load-options-error'), { type: 'error' });
    domainTree.value = [];
    domainOptions.value = [];
    warrantyRows.value = [];
    warrantyOptions.value = [];
    ruleOptions.value = [];
    mandatoryUnitOptions.value = [];
    mandatoryUnitsRaw.value = [];
  } finally {
    optionsLoading.value = false;
    if (props.show && props.mode === 'edit' && props.task && domainTree.value.length > 0) {
      const { domainId, sectionId } = resolveDomainAndSectionIds(props.task);
      selectedDomainId.value = domainId;
      initialValues.value = {
        ...initialValues.value,
        domain_id: domainId,
        section_id: sectionId,
      };
      await nextTick();
      await nextTick();
      const formApi = formRef.value as {
        setFieldValue?: (n: string, v: unknown, shouldValidate?: boolean) => void;
      } | null;
      formApi?.setFieldValue?.('domain_id', domainId, false);
      formApi?.setFieldValue?.('section_id', sectionId, false);
    }
  }
}

watch(
  () => [props.show, props.mode, props.task] as const,
  ([show]) => {
    if (!show) return;
    buildInitialValues();
    formKey.value += 1;
    void loadOptions();
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

function onDomainChanged(
  domainId: unknown,
  setFieldValue: (field: string, value: unknown) => void
) {
  const next = String(domainId ?? '');
  if (next === selectedDomainId.value) return;
  selectedDomainId.value = next;
  setFieldValue('section_id', '');
}

function buildMandatoryUnitPayload(ids: string[]): { id: number; slug: string; title: string }[] {
  return ids
    .map((raw) => String(raw ?? '').trim())
    .filter(Boolean)
    .map((id) => {
      const row = mandatoryUnitsRaw.value.find(
        (x) =>
          String(x.id) === id ||
          String(x.slug ?? '') === id ||
          String(x.value ?? '') === id
      );
      if (!row || row.id == null) return null;
      const nid = Number(row.id);
      if (!Number.isFinite(nid)) return null;
      return {
        id: nid,
        slug: String(row.slug ?? ''),
        title: String(row.title ?? row.name ?? ''),
      };
    })
    .filter((x): x is { id: number; slug: string; title: string } => x != null);
}

function resolveReferenceIdForPayload(): number {
  if (props.mode === 'edit' && props.task) {
    const r = props.task.reference_id;
    if (r != null && r !== '') {
      const n = Number(r);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  }
  if (props.mode === 'add' && props.referenceId != null) {
    const n = Number(props.referenceId);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

async function onSubmit(values: Record<string, unknown>) {
  saving.value = true;
  try {
    const rawMandatoryIds = Array.isArray(values.mandatory_unit_ids)
      ? (values.mandatory_unit_ids as unknown[])
          .map((x) => String(x ?? ''))
          .filter((id) => id !== '')
      : [];
    const mandatory_unit = buildMandatoryUnitPayload(rawMandatoryIds);

    if (mandatory_unit.length === 0) {
      toast(t('task.validation-mandatory-unit-required'), { type: 'error' });
      return;
    }

    const warrantyIdStr = String(values.warranty_id ?? '').trim();
    let warrantyNumId = Number(warrantyIdStr);
    if (Number.isNaN(warrantyNumId)) {
      const found = warrantyRows.value.find(
        (x) =>
          String(x.id ?? '') === warrantyIdStr ||
          String(x.warranty_id ?? '') === warrantyIdStr ||
          String(x.slug ?? '') === warrantyIdStr ||
          String(x.value ?? '') === warrantyIdStr
      );
      warrantyNumId = Number(found?.id ?? found?.warranty_id);
    }
    if (Number.isNaN(warrantyNumId)) {
      toast(t('task.validation-type-required'), { type: 'error' });
      return;
    }

    const payload: Record<string, unknown> = {
      id: props.mode === 'edit' ? props.task?.id ?? null : null,
      rule_id: Number(values.rule_id),
      warranty_id: warrantyNumId,
      section_id: Number(values.section_id),
      has_clause: String(values.has_clause) === '1' ? 1 : 0,
      reference_id: resolveReferenceIdForPayload(),
      type: 'compliance',
      title: String(values.title ?? ''),
      code: String(values.code ?? ''),
      limit: null,
      page: null,
      standard_id: 1,
      data_from: null,
      data_to: null,
      enforce_data_from: null,
      enforce_data_to: null,
      enforcer: '',
      level: '',
      compliance_enforcer: '',
      risk_response_type: '',
      min_risk: '',
      max_risk: '',
      mandatory_unit,
    };

    const result = props.mode === 'edit'
      ? await ermRepo.editTask(payload)
      : await ermRepo.addTask(payload);

    if (result?.result) {
      toast(
        props.mode === 'edit' ? t('task.form-edit-success') : t('task.form-add-success'),
        { type: 'success' }
      );
      emit('success');
      close();
    } else {
      toast(
        String(
          result?.error?.message ??
            (props.mode === 'edit' ? t('task.form-edit-error') : t('task.form-add-error'))
        ),
        { type: 'error' }
      );
    }
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : props.mode === 'edit'
          ? t('task.form-edit-error')
          : t('task.form-add-error'),
      { type: 'error' }
    );
  } finally {
    saving.value = false;
  }
}

const clauseOptions = computed<Option[]>(() => [
  { value: '1', label: t('task.clause-yes') },
  { value: '0', label: t('task.clause-no') },
]);
</script>

<template>
  <BaseModal
    :visible="show"
    :title="props.mode === 'edit' ? t('task.modal-edit-title') : t('task.modal-add-title')"
    @update:visible="onDialogVisible"
  >
    <div v-if="optionsLoading" class="py-8 text-center text-sm text-slate-500">
      {{ t('general.loading') }}
    </div>
    <Form
      v-else
      id="add-task-modal-form"
      ref="formRef"
      :key="formKey"
      :validation-schema="validationSchema"
      :initial-values="initialValues"
      class="space-y-3"
      @submit="onSubmit"
      v-slot="{ setFieldValue }"
    >
      <div class="space-y-3">
        <BaseInput
          name="title"
          :label="t('task.form-title')"
          :required="true"
        />
        <BaseSelect
          name="rule_id"
          :label="t('task.form-rule')"
          :options="ruleOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :disabled="ruleOptions.length === 0"
          :filter="true"
        />
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
        <BaseSelect
          name="domain_id"
          :label="t('task.form-domain')"
          :options="domainOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :disabled="domainOptions.length === 0"
          :filter="true"
          @change="(v) => onDomainChanged(v, setFieldValue)"
        />
        <BaseSelect
          name="section_id"
          :label="t('task.form-subject')"
          :options="subjectOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :disabled="subjectOptions.length === 0"
        />
        <BaseSelect
          name="warranty_id"
          :label="t('task.form-type')"
          :options="warrantyOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :disabled="warrantyOptions.length === 0"
        />
        <BaseInput
          name="code"
          :label="t('task.form-code')"
        />
        <BaseMultiSelect
          name="mandatory_unit_ids"
          :label="t('task.form-mandatory-unit')"
          :options="mandatoryUnitOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
          :disabled="mandatoryUnitOptions.length === 0"
        />
        <BaseSelect
          name="has_clause"
          :label="t('task.form-clause')"
          :options="clauseOptions"
          :placeholder="t('rule.form-select-placeholder')"
          :required="true"
        />
      </div>
    </Form>
    <template #footer>
      <div v-if="!optionsLoading" class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          :disabled="saving"
          @click="close"
        >
          {{ t('rule.form-cancel') }}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          form="add-task-modal-form"
          :disabled="saving"
        >
          {{ props.mode === 'edit' ? t('task.form-edit-submit') : t('task.form-submit') }}
        </Button>
      </div>
    </template>
  </BaseModal>
</template>

