<template>
  <div class="meter">
    <label class="meter-label">
      {{ $t('environmental.energy.title') || 'Energy Management' }}
    </label>
    <div class="meter-bar">
      <div class="meter-fill" :style="{ width: `${value}%` }">
        <span v-if="value >= 20" class="meter-percentage">{{ value }}%</span>
      </div>
    </div>
    <div class="meter-value">{{ value }}% Renewable</div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface Props {
  value?: number;
}

withDefaults(defineProps<Props>(), {
  value: 0,
});

const { locale } = useI18n();
</script>

<style scoped lang="css">
.meter {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border-radius: 10px;
  border: 1px solid #d1fae5;
}

.meter-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

.meter-bar {
  width: 100%;
  height: 30px;
  background: #e5e7eb;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 1rem;
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  transition: width 0.3s ease;
}

.meter-percentage {
  white-space: nowrap;
}

.meter-value {
  font-size: 1rem;
  color: #059669;
  font-weight: 600;
}
</style>
