<script setup lang="ts">
import { inject, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBreadcrumb, type BreadcrumbSlotContent } from '@/composables/useBreadcrumb';

const { t } = useI18n();
const { items } = useBreadcrumb();

/** Injected by layout (SideMenu). Set from any page via useBreadcrumbSlot().setContent(component, props) */
const breadcrumbExtra = inject<ReturnType<typeof ref<BreadcrumbSlotContent | null>> | null>(
  'breadcrumbExtra',
  null
);
const extraContent = computed(() => breadcrumbExtra?.value ?? null);
</script>

<template>
  <div class="breadcrumb-row flex min-w-0 items-center justify-between gap-4 py-3">
    <nav
      v-if="items.length > 0"
      aria-label="Breadcrumb"
      class="breadcrumb flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto text-sm"
    >
      <ol class="flex min-w-0 list-none flex-wrap items-center gap-1.5 p-0">
        <li
          v-for="(item, index) in items"
          :key="item.path + index"
          class="flex items-center gap-1.5"
        >
          <template v-if="index > 0">
            <span
              class="pointer-events-none shrink-0 text-text-muted"
              aria-hidden="true"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </template>
          <template v-if="item.isLast">
            <span
              class="truncate font-medium text-text-primary"
              :aria-current="'page'"
            >
              {{ t(item.labelKey) }}
            </span>
          </template>
          <template v-else>
            <router-link
              :to="item.path"
              class="truncate text-text-secondary transition hover:text-text-primary"
            >
              {{ t(item.labelKey) }}
            </router-link>
          </template>
        </li>
      </ol>
    </nav>
    <!-- Slot: content injected by page via useBreadcrumbSlot().setContent(component, props) -->
    <div class="breadcrumb-extra flex shrink-0 items-center justify-end gap-2">
      <component
        v-if="extraContent"
        :is="extraContent.component"
        v-bind="extraContent.props"
      />
    </div>
  </div>
</template>
