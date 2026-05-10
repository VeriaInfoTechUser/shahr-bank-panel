<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, nextTick, onMounted, ref, toValue, watch } from 'vue';
import { Form, useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import {
  fetchDomainTreeCached,
  fetchMemberLightListCached,
  fetchRuleLightListCached,
} from '@/core/erm/ruleAuthorTypeOptionsCache';
import TasksFilterDomainSectionFields from '@/pages/app/base-info/tasks/TasksFilterDomainSectionFields.vue';

const optionsLoading = ref(true);
const isFormResetting = ref(false);
const domainTree = ref<DomainNode[]>([]);
const ruleOptions = ref<Option[]>([]);
const memberLightOptions = ref<Option[]>([]);
const ready = ref(false);

type DomainNode = Record<string, unknown> & { children?: DomainNode[] };
type Option = { value: string; label: string };

const props = defineProps<{
  table?: {
    replaceFilters: (f: Record<string, unknown>) => void;
    clearFilters: () => void;
    filters?: Ref<Record<string, unknown>> | Record<string, unknown>;
  } | null;
  toolbarClearTick?: number;
  panelOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'apply', payload: Record<string, unknown>): void;
}>();

const { t } = useI18n();

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

  return {
    rule_ids: splitCsv(x.rule_id),
    enforcer_ids: splitCsv(x.enforcer),
    section_ids: splitCsv(x.section_id),
  };
}

const formInitialValues = computed(() =>
  apiFiltersToFormValues(toValue(props.table?.filters) ?? {})
);

// Use form ref to get reactive values
const formRef = ref<InstanceType<typeof Form>>();
const values = computed(() => {
  const v = formRef.value?.values ?? {};
  console.log('📊 [RiskDashboardFilterPanel] Current form values:', v);
  return v;
});

function emitIfReady() {
  if (!ready.value || isFormResetting.value || !values.value) return;
  const payload = buildPayload(values.value as Record<string, unknown>);
  console.log('🔍 [RiskDashboardFilterPanel] Filter values changed:', {
    formValues: values.value,
    builtPayload: payload,
    timestamp: new Date().toISOString()
  });
  if (props.table) {
    props.table.replaceFilters(payload);
  } else {
    emit('apply', payload);
  }
}

// Watch all filter fields and trigger auto-apply
watch(
  () => [
    values.value?.rule_ids,
    values.value?.enforcer_ids,
    values.value?.section_ids
  ],
  (newValues, oldValues) => {
    console.log('🔄 [RiskDashboardFilterPanel] Form values changed:', {
      newValues,
      oldValues,
      currentValues: values.value,
      isFormResetting: isFormResetting.value,
      ready: ready.value,
      timestamp: new Date().toISOString()
    });
    emitIfReady();
  },
  { deep: true }
);

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const domainRes = await fetchDomainTreeCached(ermRepo);
    const rulesRes = await fetchRuleLightListCached(ermRepo);
    const membersRes = await fetchMemberLightListCached(ermRepo);
    
    const domainData = parseDomainTreeData(domainRes);
    domainTree.value = domainData;
    ruleOptions.value = mapLightRules(rulesRes);
    memberLightOptions.value = mapMemberLightRows(extractErmList(membersRes));
  } catch {
    toast(t('rule.form-load-options-error'), { type: 'error' });
    domainTree.value = [];
    ruleOptions.value = [];
    memberLightOptions.value = [];
  } finally {
    optionsLoading.value = false;
  }
}

onMounted(() => {
  console.log('🎯 [RiskDashboardFilterPanel] Component mounted');
  void loadOptions();
  void nextTick(() => {
    ready.value = true;
    console.log('✅ [RiskDashboardFilterPanel] Component ready');
  });
});

watch(
  () => props.toolbarClearTick,
  (_v, prev) => {
    if (prev === undefined) return;
    console.log('🧽 [RiskDashboardFilterPanel] Toolbar clear triggered, clearing form');
    isFormResetting.value = true;
    // Reset form to empty values
    if (formRef.value?.resetForm) {
      formRef.value.resetForm({
        values: {
          rule_ids: [],
          enforcer_ids: [],
          section_ids: [],
        }
      });
    }
    nextTick(() => {
      console.log('🧹 [RiskDashboardFilterPanel] Form cleared');
      isFormResetting.value = false;
    });
  }
);

watch(
  () => props.panelOpen,
  (open) => {
    if (!open) return;
    const currentFilters = toValue(props.table?.filters);
    console.log('🔄 [RiskDashboardFilterPanel] Panel opened, syncing with current filters:', {
      currentFilters,
      timestamp: new Date().toISOString()
    });
    isFormResetting.value = true;
    // Reset form to sync with current filters
    const newValues = apiFiltersToFormValues(currentFilters ?? {});
    console.log('📝 [RiskDashboardFilterPanel] Setting form values:', newValues);
    if (formRef.value?.resetForm) {
      formRef.value.resetForm({ values: newValues });
    }
    nextTick(() => {
      console.log('✅ [RiskDashboardFilterPanel] Form synced with filters');
      isFormResetting.value = false;
    });
  }
);

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  if (!values) return {};

  const o: Record<string, unknown> = {};

  const ruleIds = values.rule_ids as string[] | undefined;
  if (ruleIds?.length) o.rule_id = ruleIds.join(',');

  const enforcerIds = values.enforcer_ids as string[] | undefined;
  if (enforcerIds?.length) o.enforcer = enforcerIds.join(',');

  const sectionIds = values.section_ids as string[] | undefined;
  if (sectionIds?.length) o.section_id = sectionIds.join(',');

  return o;
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
      ref="formRef"
      v-else
      class="space-y-3"
      :initial-values="formInitialValues"
      as="div"
    >
      <div class="space-y-3">
        <div class="w-full">
          <BaseMultiSelect
            name="rule_ids"
            compact-label
            :label="t('task.filter-field-rule')"
            :options="ruleOptions"
            placeholder=""
            :disabled="ruleOptions.length === 0"
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
          <TasksFilterDomainSectionFields
            :domain-tree="domainTree"
            :domain-options="domainOptions"
          />
        </div>
      </div>
    </Form>
  </div>
</template>
