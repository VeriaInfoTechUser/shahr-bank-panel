<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, ref, onMounted, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import BaseDateRangePicker from '@/core/ui/base/BaseDateRangePicker.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import {
  DROPDOWN_LIST_PARAMS,
  fetchRuleAuthorListCached,
  fetchRuleCategoryListCached,
  fetchRuleTypeListCached,
} from '@/core/erm/ruleAuthorTypeOptionsCache';
import RulesRegulationsFilterAutoApply from './RulesRegulationsFilterAutoApply.vue';

const props = withDefaults(
  defineProps<{
    /** اگر ست شود، اعمال/پاک با جدول همگام می‌شود */
    table?: {
      replaceFilters: (f: Record<string, unknown>) => void;
      clearFilters: () => void;
      /** وضعیت فعلی فیلتر جدول؛ با بسته شدن پاپ‌آور برای مقداردهی مجدد فرم لازم است */
      filters?: Ref<Record<string, unknown>> | Record<string, unknown>;
    } | null;
    /** با افزایش از تولبار پس از پاک کردن فیلترها، فرم باز هم خالی می‌شود */
    toolbarClearTick?: number;
  }>(),
  {
    table: null,
    toolbarClearTick: 0,
  }
);

const emit = defineEmits<{
  (e: 'apply', payload: Record<string, unknown>): void;
}>();

const { t } = useI18n();

const optionsLoading = ref(true);
const formKey = ref(0);
const categoryOptions = ref<{ value: string; label: string }[]>([]);
const typeOptions = ref<{ value: string; label: string }[]>([]);
const authorOptions = ref<{ value: string; label: string }[]>([]);

const formId = 'rules-regulations-filter-form';

/** معکوس buildPayload — مقداردهی فرم از فیلترهای ذخیره‌شده در جدول (بعد از بستن پنل) */
function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  const requirement = x.requirement;
  const validity = x.validity;
  return {
    rule: String(x.rule ?? ''),
    code: String(x.code ?? ''),
    author: Array.isArray(x.author) ? (x.author as unknown[]).map(String) : [],
    category: Array.isArray(x.category) ? (x.category as unknown[]).map(String) : [],
    type: Array.isArray(x.type) ? (x.type as unknown[]).map(String) : [],
    requirement_select:
      requirement === 1 || requirement === true
        ? '1'
        : requirement === 0 || requirement === false
          ? '0'
          : '',
    validity_select:
      validity === 1 || validity === true
        ? '1'
        : validity === 0 || validity === false
          ? '0'
          : '',
    approval_at_from: x.approval_at_from != null ? String(x.approval_at_from) : '',
    approval_at_to: x.approval_at_to != null ? String(x.approval_at_to) : '',
    promulgation_at_from:
      x.promulgation_at_from != null ? String(x.promulgation_at_from) : '',
    promulgation_at_to:
      x.promulgation_at_to != null ? String(x.promulgation_at_to) : '',
    cancellation_at_from:
      x.cancellation_at_from != null ? String(x.cancellation_at_from) : '',
    cancellation_at_to:
      x.cancellation_at_to != null ? String(x.cancellation_at_to) : '',
    data_from: x.data_from != null ? String(x.data_from) : '',
    data_to: x.data_to != null ? String(x.data_to) : '',
  };
}

const formInitialValues = computed(() =>
  apiFiltersToFormValues(toValue(props.table?.filters) ?? {})
);

const requirementFilterOptions = computed(() => [
  { value: '', label: t('rule.filter-option-any') },
  { value: '1', label: t('rule.requirement-yes') },
  { value: '0', label: t('rule.requirement-no') },
]);

const validityFilterOptions = computed(() => [
  { value: '', label: t('rule.filter-option-any') },
  { value: '1', label: t('rule.validity-active') },
  { value: '0', label: t('rule.validity-inactive') },
]);

function normalizeList(res: unknown): { value: string; label: string }[] {
  if (Array.isArray(res)) {
    return res
      .map((item) => {
        const row = item as Record<string, unknown>;
        const value = String(row.value ?? row.slug ?? row.id ?? '');
        const label = String(row.title ?? row.name ?? value);
        return { value, label };
      })
      .filter((x) => x.value);
  }
  const r = res as { data?: { list?: unknown[] } | unknown[] };
  let list: unknown[] = [];
  const d = r?.data;
  if (Array.isArray(d)) list = d;
  else if (
    d &&
    typeof d === 'object' &&
    'list' in d &&
    Array.isArray((d as { list: unknown[] }).list)
  ) {
    list = (d as { list: unknown[] }).list;
  }
  return list
    .map((item) => {
      const row = item as Record<string, unknown>;
      const value = String(row.value ?? row.slug ?? row.id ?? '');
      const label = String(row.title ?? row.name ?? value);
      return { value, label };
    })
    .filter((x) => x.value);
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const [catRes, typeRes, authorRes] = await Promise.all([
      fetchRuleCategoryListCached(ermRepo),
      fetchRuleTypeListCached(ermRepo),
      fetchRuleAuthorListCached(ermRepo),
    ]);
    categoryOptions.value = normalizeList(catRes);
    typeOptions.value = normalizeList(typeRes);
    authorOptions.value = normalizeList(authorRes);
  } catch {
    toast(t('rule.form-load-options-error'), { type: 'error' });
    categoryOptions.value = [];
    typeOptions.value = [];
    authorOptions.value = [];
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
  const rule = String(values.rule ?? '').trim();
  if (rule) o.rule = rule;
  const code = String(values.code ?? '').trim();
  if (code) o.code = code;
  const author = values.author as string[] | undefined;
  if (author?.length) o.author = author;
  const category = values.category as string[] | undefined;
  if (category?.length) o.category = category;
  const type = values.type as string[] | undefined;
  if (type?.length) o.type = type;
  const rq = String(values.requirement_select ?? '').trim();
  if (rq === '1') o.requirement = 1;
  else if (rq === '0') o.requirement = 0;
  const vl = String(values.validity_select ?? '').trim();
  if (vl === '1') o.validity = 1;
  else if (vl === '0') o.validity = 0;
  const approvalFrom = String(values.approval_at_from ?? '').trim();
  if (approvalFrom) o.approval_at_from = approvalFrom;
  const approvalTo = String(values.approval_at_to ?? '').trim();
  if (approvalTo) o.approval_at_to = approvalTo;
  const promFrom = String(values.promulgation_at_from ?? '').trim();
  if (promFrom) o.promulgation_at_from = promFrom;
  const promTo = String(values.promulgation_at_to ?? '').trim();
  if (promTo) o.promulgation_at_to = promTo;
  const cancelFrom = String(values.cancellation_at_from ?? '').trim();
  if (cancelFrom) o.cancellation_at_from = cancelFrom;
  const cancelTo = String(values.cancellation_at_to ?? '').trim();
  if (cancelTo) o.cancellation_at_to = cancelTo;
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
      <RulesRegulationsFilterAutoApply
        :build-payload="buildPayload"
        @apply="onAutoApply"
      />
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-3">
        <div class="col-span-full md:col-span-3 lg:col-span-3">
          <BaseInput
            name="rule"
            compact-label
            :label="t('rule.filter-field-rule')"
          />
        </div>
        <BaseInput
          name="code"
          compact-label
          :label="t('rule.filter-field-code')"
          input-dir="ltr"
        />
        <BaseMultiSelect
          name="author"
          compact-label
          :label="t('rule.filter-field-author')"
          :options="authorOptions"
          placeholder=""
          :disabled="authorOptions.length === 0"
        />
        <BaseMultiSelect
          name="category"
          compact-label
          :label="t('rule.filter-field-category')"
          :options="categoryOptions"
          placeholder=""
          :disabled="categoryOptions.length === 0"
        />
        <BaseMultiSelect
          name="type"
          compact-label
          :label="t('rule.filter-field-type')"
          :options="typeOptions"
          placeholder=""
          :disabled="typeOptions.length === 0"
        />
        <BaseSelect
          name="requirement_select"
          compact-label
          :label="t('rule.form-requirement')"
          :options="requirementFilterOptions"
          placeholder=""
        />
        <BaseSelect
          name="validity_select"
          compact-label
          :label="t('rule.validity')"
          :options="validityFilterOptions"
          placeholder=""
        />
        <div class="col-span-full grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BaseDateRangePicker
            name-from="approval_at_from"
            name-to="approval_at_to"
            compact-label
            :label="t('rule.filter-approval-range')"
          />
          <BaseDateRangePicker
            name-from="promulgation_at_from"
            name-to="promulgation_at_to"
            compact-label
            :label="t('rule.filter-promulgation-range')"
          />
          <BaseDateRangePicker
            name-from="cancellation_at_from"
            name-to="cancellation_at_to"
            compact-label
            :label="t('rule.filter-cancellation-range')"
          />
          <BaseDateRangePicker
            name-from="data_from"
            name-to="data_to"
            compact-label
            :label="t('rule.filter-record-entry-range')"
          />
        </div>
      </div>
    </Form>
  </div>
</template>
