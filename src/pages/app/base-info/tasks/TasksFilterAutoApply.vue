<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useFormValues } from 'vee-validate';
import { watchDebounced } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    buildPayload: (v: Record<string, unknown>) => Record<string, unknown>;
    includeMandatoryUnit?: boolean;
    includeComplianceEnforcer?: boolean;
    includeEnforcer?: boolean;
    includeLevel?: boolean;
    includeRiskResponseType?: boolean;
    includeWarrantyDomainSection?: boolean;
    includeRiskIntensityRange?: boolean;
  }>(),
  {
    includeMandatoryUnit: true,
    includeComplianceEnforcer: false,
    includeEnforcer: true,
    includeLevel: true,
    includeRiskResponseType: false,
    includeWarrantyDomainSection: true,
    includeRiskIntensityRange: false,
  }
);

const emit = defineEmits<{
  (e: 'apply', payload: Record<string, unknown>): void;
}>();

const values = useFormValues();
const ready = ref(false);

onMounted(() => {
  void nextTick(() => {
    ready.value = true;
  });
});

function emitIfReady() {
  if (!ready.value) return;
  const payload = props.buildPayload(values.value as Record<string, unknown>);
  emit('apply', payload);
}

watchDebounced(
  () => String(values.value.title ?? ''),
  () => emitIfReady(),
  { debounce: 450 }
);
watchDebounced(
  () => String(values.value.code ?? ''),
  () => emitIfReady(),
  { debounce: 450 }
);

const nonTextFilterSlice = computed(() => ({
  ...(props.includeEnforcer ? { enforcer_ids: values.value.enforcer_ids } : {}),
  ...(props.includeComplianceEnforcer
    ? { compliance_enforcer_ids: values.value.compliance_enforcer_ids }
    : {}),
  ...(props.includeLevel ? { level_ids: values.value.level_ids } : {}),
  ...(props.includeRiskResponseType
    ? { risk_response_type_ids: values.value.risk_response_type_ids }
    : {}),
  rule_ids: values.value.rule_ids,
  ...(props.includeWarrantyDomainSection
    ? {
        warranty_ids: values.value.warranty_ids,
        section_ids: values.value.section_ids,
        standard_id: values.value.standard_id,
      }
    : {}),
  ...(props.includeMandatoryUnit ? { mandatory_unit_ids: values.value.mandatory_unit_ids } : {}),
  data_from: values.value.data_from,
  data_to: values.value.data_to,
}));

/** شدت ریسک: جدا با debounce تا بعد از ایستادن پوینتر ارسال شود */
const riskIntensitySlice = computed(() => {
  if (!props.includeRiskIntensityRange) return null;
  return {
    min_risk: values.value.min_risk,
    max_risk: values.value.max_risk,
  };
});

watch(
  nonTextFilterSlice,
  () => emitIfReady(),
  { deep: true }
);

watchDebounced(
  riskIntensitySlice,
  (slice) => {
    if (!ready.value || slice == null) return;
    emitIfReady();
  },
  { debounce: 420, deep: true }
);
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
