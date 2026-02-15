<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useBreadcrumb } from '@/composables/useBreadcrumb';

const { t } = useI18n();
const { items } = useBreadcrumb();
</script>

<template>
  <nav
    v-if="items.length > 0"
    aria-label="Breadcrumb"
    class="breadcrumb flex items-center gap-1.5 overflow-x-auto py-3 text-sm"
  >
    <ol class="flex min-w-0 list-none flex-wrap items-center gap-1.5 p-0">
      <li
        v-for="(item, index) in items"
        :key="item.path + index"
        class="flex items-center gap-1.5"
      >
        <template v-if="index > 0">
          <span
            class="pointer-events-none shrink-0 text-slate-400 dark:text-slate-500"
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
            class="truncate font-medium text-slate-800 dark:text-slate-100"
            :aria-current="'page'"
          >
            {{ t(item.labelKey) }}
          </span>
        </template>
        <template v-else>
          <router-link
            :to="item.path"
            class="truncate text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {{ t(item.labelKey) }}
          </router-link>
        </template>
      </li>
    </ol>
  </nav>
</template>
