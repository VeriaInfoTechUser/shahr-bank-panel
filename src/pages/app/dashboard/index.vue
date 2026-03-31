<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide/Lucide.vue';

const { t, locale } = useI18n();
const router = useRouter();

type PrimaryRoute =
  | 'app-compliance-operations'
  | 'app-risk-operations'
  | 'app-base-info-rules-regulations'
  | 'app-base-info-tasks';

interface Spot {
  route: PrimaryRoute;
  titleKey: string;
  descKey: string;
  icon: string;
}

const spots = computed<Spot[]>(() => [
  {
    route: 'app-base-info-rules-regulations',
    titleKey: 'menu.rules-regulations',
    descKey: 'dashboard-page.spot-rules-desc',
    icon: 'FileText',
  },
  {
    route: 'app-base-info-tasks',
    titleKey: 'menu.tasks',
    descKey: 'dashboard-page.spot-tasks-desc',
    icon: 'ClipboardList',
  },
  {
    route: 'app-compliance-operations',
    titleKey: 'menu.compliance-operations',
    descKey: 'dashboard-page.spot-compliance-desc',
    icon: 'ShieldCheck',
  },
  {
    route: 'app-risk-operations',
    titleKey: 'menu.risk-operations',
    descKey: 'dashboard-page.spot-risk-desc',
    icon: 'AlertTriangle',
  },
]);

const todayLabel = computed(() => {
  const loc = locale.value;
  const tag = loc === 'fa' ? 'fa-IR' : loc === 'ar' ? 'ar' : 'en-US';
  return new Date().toLocaleDateString(tag, { dateStyle: 'long' });
});

function go(name: PrimaryRoute) {
  router.push({ name });
}
</script>

<template>
  <div
    class="mx-auto max-w-5xl px-1 pb-12 pt-2 md:px-2"
  >
    <header
      class="mb-10 md:mb-14"
    >
      <div
        class="flex flex-col gap-6 border-b border-slate-200/80 pb-8 dark:border-darkmode-600 sm:flex-row sm:items-end sm:justify-between"
      >
        <div class="space-y-2">
          <h1
            class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl"
          >
            {{ t('menu.dashboard') }}
          </h1>
          <p
            class="max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400"
          >
            {{ t('dashboard-page.subtitle') }}
          </p>
        </div>
        <time
          class="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500"
          :datetime="new Date().toISOString()"
        >
          <span class="text-slate-500 dark:text-slate-400">{{
            t('dashboard-page.date-prefix')
          }}</span>
          {{ '\u00A0' }}{{ todayLabel }}
        </time>
      </div>
    </header>

    <div class="grid gap-5 md:grid-cols-2 lg:gap-6">
      <button
        v-for="spot in spots"
        :key="spot.route"
        type="button"
        class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-start shadow-sm ring-0 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500"
        @click="go(spot.route)"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/80 opacity-0 transition group-hover:opacity-100 dark:from-transparent dark:to-darkmode-900/40"
        />
        <div class="relative flex flex-1 flex-col p-6 md:p-7">
          <div
            class="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-primary/10 group-hover:text-primary dark:bg-darkmode-700 dark:text-slate-200 dark:group-hover:bg-primary/15 dark:group-hover:text-primary"
          >
            <Lucide :icon="spot.icon" class="h-5 w-5" />
          </div>
          <h2
            class="mb-2 text-base font-semibold text-slate-900 dark:text-slate-50"
          >
            {{ t(spot.titleKey) }}
          </h2>
          <p
            class="mb-6 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
          >
            {{ t(spot.descKey) }}
          </p>
          <span
            class="inline-flex items-center gap-1.5 text-xs font-medium text-primary opacity-90 transition group-hover:opacity-100"
          >
            {{ t('dashboard-page.cta') }}
            <Lucide
              icon="ArrowLeft"
              class="h-3.5 w-3.5 transition group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </button>
    </div>

    <p
      class="mt-10 text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500"
    >
      {{ t('dashboard-page.footer-hint') }}
    </p>
  </div>
</template>
