<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, onMounted, ref, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import BaseDatePicker from '@/core/ui/base/BaseDatePicker.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import {
  fetchDomainTreeCached,
  fetchMandatoryUnitListCached,
  fetchMemberLightListCached,
  fetchRuleLightListCached,
  fetchWarrantyListCached,
} from '@/core/erm/ruleAuthorTypeOptionsCache';
import TasksFilterAutoApply from './TasksFilterAutoApply.vue';
import TasksFilterDomainSectionReset from './TasksFilterDomainSectionReset.vue';
import TasksFilterDomainSectionFields from './TasksFilterDomainSectionFields.vue';

type DomainNode = Record<string, unknown> & { children?: DomainNode[] };
type Option = { value: string; label: string };

const props = withDefaults(
  defineProps<{
    table?: {
      replaceFilters: (f: Record<string, unknown>) => void;
      clearFilters: () => void;
      filters?: Ref<Record<string, unknown>> | Record<string, unknown>;
    } | null;
    toolbarClearTick?: number;
    includeMandatoryUnit?: boolean;
  }>(),
  {
    table: null,
    toolbarClearTick: 0,
    includeMandatoryUnit: true,
  }
);

const emit = defineEmits<{
  (e: 'apply', payload: Record<string, unknown>): void;
}>();

const { t } = useI18n();

const optionsLoading = ref(true);
const formKey = ref(0);
const domainTree = ref<DomainNode[]>([]);
const ruleOptions = ref<Option[]>([]);
const warrantyOptions = ref<Option[]>([]);
const mandatoryUnitOptions = ref<Option[]>([]);
const memberLightOptions = ref<Option[]>([]);

const formId = computed(() =>
  props.includeMandatoryUnit ? 'tasks-filter-form' : 'compliance-ops-filter-form'
);

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

function parseDomainTreeData(res: unknown): DomainNode[] {
  const r = res as { data?: unknown };
  const d = r?.data;
  if (Array.isArray(d)) return d as DomainNode[];
  return [];
}

function mapLightRules(res: unknown): Option[] {
  const list = extractErmList(res);
  return list
    .map((row) => {
      const value = String(row.id ?? '');
      const label = String(row.rule ?? row.title ?? value);
      return { value, label };
    })
    .filter((x) => x.value);
}

function mapWarrantyRows(rows: Record<string, unknown>[]): Option[] {
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

function mapMandatoryRows(rows: Record<string, unknown>[]): Option[] {
  return rows
    .map((row) => {
      const slug = row.slug != null ? String(row.slug) : '';
      const id = row.id != null ? String(row.id) : '';
      const value = slug || id;
      if (!value) return null;
      return {
        value,
        label: String(row.title ?? row.name ?? value),
      };
    })
    .filter((x): x is Option => x != null);
}

function mapMemberLightRows(rows: Record<string, unknown>[]): Option[] {
  return rows
    .map((m) => {
      const id = m.id ?? m.user_id;
      if (id == null) return null;
      const label =
        [m.name, m.full_name, m.email, m.mobile]
          .find((x) => typeof x === 'string' && String(x).trim()) ?? String(id);
      return { value: String(id), label: String(label).trim() };
    })
    .filter((x): x is Option => x != null);
}

const domainOptions = computed<Option[]>(() =>
  domainTree.value.map((d) => ({
    value: String(d.id ?? ''),
    label: String(d.title ?? d.name ?? d.id ?? ''),
  })).filter((x) => x.value)
);

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  const splitCsv = (v: unknown): string[] => {
    if (Array.isArray(v)) return (v as unknown[]).map(String);
    if (v == null || v === '') return [];
    return String(v)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };
  const mu = x.mandatory_unit;
  const mandatoryIds = Array.isArray(mu)
    ? (mu as unknown[]).map(String)
    : splitCsv(mu);

  return {
    title: String(x.title ?? ''),
    enforcer_ids: splitCsv(x.enforcer),
    code: String(x.code ?? ''),
    rule_ids: splitCsv(x.rule_id),
    warranty_ids: splitCsv(x.warranty_id),
    standard_id: x.standard_id != null && x.standard_id !== '' ? String(x.standard_id) : '',
    section_ids: splitCsv(x.section_id),
    mandatory_unit_ids: props.includeMandatoryUnit ? mandatoryIds : [],
    data_from: x.data_from != null ? String(x.data_from) : '',
    data_to: x.data_to != null ? String(x.data_to) : '',
  };
}

const formInitialValues = computed(() =>
  apiFiltersToFormValues(toValue(props.table?.filters) ?? {})
);

async function loadOptions() {
  optionsLoading.value = true;
  try {
    if (props.includeMandatoryUnit) {
      const [domainRes, rulesRes, warrantyRes, mandatoryRes, membersRes] = await Promise.all([
        fetchDomainTreeCached(ermRepo),
        fetchRuleLightListCached(ermRepo),
        fetchWarrantyListCached(ermRepo),
        fetchMandatoryUnitListCached(ermRepo),
        fetchMemberLightListCached(ermRepo),
      ]);
      const domainData = parseDomainTreeData(domainRes);
      domainTree.value = domainData;
      ruleOptions.value = mapLightRules(rulesRes);
      warrantyOptions.value = mapWarrantyRows(extractErmList(warrantyRes));
      mandatoryUnitOptions.value = mapMandatoryRows(extractErmList(mandatoryRes));
      memberLightOptions.value = mapMemberLightRows(extractErmList(membersRes));
    } else {
      const [domainRes, rulesRes, warrantyRes, membersRes] = await Promise.all([
        fetchDomainTreeCached(ermRepo),
        fetchRuleLightListCached(ermRepo),
        fetchWarrantyListCached(ermRepo),
        fetchMemberLightListCached(ermRepo),
      ]);
      const domainData = parseDomainTreeData(domainRes);
      domainTree.value = domainData;
      ruleOptions.value = mapLightRules(rulesRes);
      warrantyOptions.value = mapWarrantyRows(extractErmList(warrantyRes));
      mandatoryUnitOptions.value = [];
      memberLightOptions.value = mapMemberLightRows(extractErmList(membersRes));
    }
  } catch {
    toast(t('rule.form-load-options-error'), { type: 'error' });
    domainTree.value = [];
    ruleOptions.value = [];
    warrantyOptions.value = [];
    mandatoryUnitOptions.value = [];
    memberLightOptions.value = [];
  } finally {
    optionsLoading.value = false;
  }
}

onMounted(() => {
  void loadOptions();
});

watch(
  () => props.toolbarClearTick,
  (_v, prev) => {
    if (prev === undefined) return;
    formKey.value += 1;
  }
);

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  const title = String(values.title ?? '').trim();
  if (title) o.title = title;
  const enforcerIds = values.enforcer_ids as string[] | undefined;
  if (enforcerIds?.length) o.enforcer = enforcerIds.join(',');
  const code = String(values.code ?? '').trim();
  if (code) o.code = code;

  const ruleIds = values.rule_ids as string[] | undefined;
  if (ruleIds?.length) o.rule_id = ruleIds.join(',');

  const warrantyIds = values.warranty_ids as string[] | undefined;
  if (warrantyIds?.length) o.warranty_id = warrantyIds.join(',');

  const std = String(values.standard_id ?? '').trim();
  if (std) {
    const n = Number(std);
    o.standard_id = Number.isFinite(n) ? n : std;
  }

  const sectionIds = values.section_ids as string[] | undefined;
  if (sectionIds?.length) o.section_id = sectionIds.join(',');

  if (props.includeMandatoryUnit) {
    const mu = values.mandatory_unit_ids as string[] | undefined;
    if (mu?.length) o.mandatory_unit = mu;
  }

  const df = String(values.data_from ?? '').trim();
  if (df) o.data_from = df;
  const dt = String(values.data_to ?? '').trim();
  if (dt) o.data_to = dt;

  return o;
}

function onAutoApply(payload: Record<string, unknown>) {
  if (props.table) {
    props.table.replaceFilters(payload);
  } else {
    emit('apply', payload);
  }
}
</script>

<template>
  <div>
    <div
      v-if="optionsLoading"
      class="py-6 text-center text-xs text-slate-500 dark:text-slate-400"
    >
      {{ t('general.loading') }}
    </div>
    <Form
      v-else
      :id="formId"
      :key="formKey"
      class="space-y-3"
      :initial-values="formInitialValues"
      as="div"
    >
      <TasksFilterDomainSectionReset />
      <TasksFilterAutoApply
        :build-payload="buildPayload"
        :include-mandatory-unit="includeMandatoryUnit"
        @apply="onAutoApply"
      />
      <div class="space-y-3">
        <div class="w-full">
          <BaseInput
            name="title"
            compact-label
            :label="t('task.filter-field-title')"
          />
        </div>
        <div class="w-full">
          <BaseMultiSelect
            name="enforcer_ids"
            compact-label
            :label="t('task.filter-field-liaison')"
            :options="memberLightOptions"
            placeholder=""
            :disabled="memberLightOptions.length === 0"
          />
        </div>
        <div
          class="grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          <BaseMultiSelect
            name="rule_ids"
            compact-label
            :label="t('task.filter-field-rule')"
            :options="ruleOptions"
            placeholder=""
            :disabled="ruleOptions.length === 0"
          />
          <BaseMultiSelect
            name="warranty_ids"
            compact-label
            :label="t('task.filter-field-warranty')"
            :options="warrantyOptions"
            placeholder=""
            :disabled="warrantyOptions.length === 0"
          />
          <TasksFilterDomainSectionFields
            :domain-tree="domainTree"
            :domain-options="domainOptions"
          />
          <BaseMultiSelect
            v-if="includeMandatoryUnit"
            name="mandatory_unit_ids"
            compact-label
            :label="t('task.filter-field-mandatory-unit')"
            :options="mandatoryUnitOptions"
            placeholder=""
            :disabled="mandatoryUnitOptions.length === 0"
          />
          <BaseInput
            name="code"
            compact-label
            :label="t('task.code')"
            input-dir="ltr"
          />
          <BaseDatePicker
            name="data_from"
            compact-label
            :label="t('task.filter-date-from')"
            placeholder=""
          />
          <BaseDatePicker
            name="data_to"
            compact-label
            :label="t('task.filter-date-to')"
            placeholder=""
          />
        </div>
      </div>
    </Form>
  </div>
</template>
