<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';

const props = defineProps<{
  mode: 'editable' | 'readonly';
  categoryOptions: { value: string; label: string }[];
  subCategoryOptions: { value: string; label: string }[];
  memberOptions: { value: string; label: string }[];
}>();

const emit = defineEmits<{
  (e: 'categoryChange', value: unknown): void;
}>();

const { t } = useI18n();

const disabled = computed(() => props.mode === 'readonly');

const riskTypeOptions = computed(() => [
  { value: 'threat', label: t('risk.type-threat') },
  { value: 'opportunity', label: t('risk.type-opportunity') },
]);

function onCategoryChange(value: unknown) {
  emit('categoryChange', value);
}
</script>

<template>
  <div class="space-y-3">
    <BaseInput
      name="title"
      :label="t('risk.field-title')"
      :required="true"
      :disabled="disabled"
      :placeholder="t('risk.field-title-placeholder')"
    />
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
     <BaseSelect
        name="categorySlug"
        :label="t('risk.field-category')"
        :options="categoryOptions"
        :required="true"
        :disabled="disabled"
        :filter="true"
        @change="onCategoryChange"
      />
      <BaseSelect
        name="subCategorySlug"
        :label="t('risk.field-sub-category')"
        :options="subCategoryOptions"
        :required="true"
        :disabled="disabled"
        :filter="true"
      />
      <BaseSelect
        name="owner"
        :label="t('risk.field-owner')"
        :options="memberOptions"
        :disabled="disabled"
        :filter="true"
      />
      <BaseSelect
        name="riskType"
        :label="t('risk.field-risk-type')"
        :options="riskTypeOptions"
        :required="true"
        :disabled="disabled"
    />

    </div>

    <BaseInput
        name="description"
        :label="t('risk.field-description')"
        type="textarea"
        :rows="3"
        :disabled="disabled"
        :placeholder="t('risk.field-description-placeholder')"
    />
  </div>
</template>
