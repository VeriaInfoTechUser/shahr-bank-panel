<script setup lang="ts">
import { watch } from 'vue';
import { useFormContext, useFormValues } from 'vee-validate';

export interface DataSourceFilterParents {
  capitalSlug: string[];
  domainSlug: string[];
  componentSlug: string[];
  capabilitySlug: string[];
  claimSlug: string[];
}

const emit = defineEmits<{
  (e: 'parents', parents: DataSourceFilterParents): void;
}>();

const values = useFormValues();
const { setFieldValue } = useFormContext();

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (v === undefined || v === null || v === '') return [];
  return [String(v)];
}

function sameArr(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => x === b[i]);
}

function snapshot(): DataSourceFilterParents {
  return {
    capitalSlug: arr(values.value.capitalSlug),
    domainSlug: arr(values.value.domainSlug),
    componentSlug: arr(values.value.componentSlug),
    capabilitySlug: arr(values.value.capabilitySlug),
    claimSlug: arr(values.value.claimSlug),
  };
}

let prev: DataSourceFilterParents | null = null;

watch(
  snapshot,
  (next) => {
    emit('parents', next);
    if (!prev) {
      prev = next;
      return;
    }
    // هر بار که یک والد تغییر کند، همهٔ فرزندانِ زیر آن خالی می‌شوند
    if (!sameArr(next.capitalSlug, prev.capitalSlug)) {
      setFieldValue('domainSlug', [], false);
      setFieldValue('componentSlug', [], false);
      setFieldValue('capabilitySlug', [], false);
      setFieldValue('claimSlug', [], false);
      setFieldValue('indicatorSlug', [], false);
    }
    if (!sameArr(next.domainSlug, prev.domainSlug)) {
      setFieldValue('componentSlug', [], false);
      setFieldValue('capabilitySlug', [], false);
      setFieldValue('claimSlug', [], false);
      setFieldValue('indicatorSlug', [], false);
    }
    if (!sameArr(next.componentSlug, prev.componentSlug)) {
      setFieldValue('capabilitySlug', [], false);
      setFieldValue('claimSlug', [], false);
      setFieldValue('indicatorSlug', [], false);
    }
    if (!sameArr(next.capabilitySlug, prev.capabilitySlug)) {
      setFieldValue('claimSlug', [], false);
      setFieldValue('indicatorSlug', [], false);
    }
    if (!sameArr(next.claimSlug, prev.claimSlug)) {
      setFieldValue('indicatorSlug', [], false);
    }
    prev = next;
  },
  { deep: true, flush: 'post' }
);
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
