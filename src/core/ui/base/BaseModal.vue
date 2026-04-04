<script setup lang="ts">
import { computed, nextTick } from 'vue';
import Dialog from 'primevue/dialog';

/** وقتی `rootClass` ست نشده باشد، عرض از این نقشه گرفته می‌شود. */
export type BaseModalSize = 'default' | 'sm' | 'md' | 'lg' | 'xl';

const MODAL_SKIN =
  'rounded-xl border border-slate-200 bg-white shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800';

/** عرض محتوا: `default` همان حداکثر ~56rem قبلی؛ `sm` حدود ۴۰٪ باریک‌تر از آن (≈۳۳.۶rem). */
const SIZE_WIDTH: Record<BaseModalSize, string> = {
  default: 'max-w-4xl w-[min(100%,56rem)]',
  sm: 'w-[min(100%,33.6rem)] max-w-[33.6rem]',
  md: 'max-w-3xl w-[min(100%,48rem)]',
  lg: 'max-w-4xl w-[min(100%,56rem)]',
  xl: 'max-w-5xl w-[min(100%,64rem)]',
};

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    closable?: boolean;
    dismissableMask?: boolean;
    /**
     * اگر غیرخالی باشد، کل کلاس ریشهٔ Prime Dialog را جایگزین می‌کند (رفتار قبلی برای مودال‌های سفارشی).
     * اگر خالی/undefined باشد، از `size` + پوستهٔ ثابت استفاده می‌شود.
     */
    rootClass?: string;
    /** عرض نسبی وقتی `rootClass` ست نشده باشد. پیش‌فرض = همان اندازهٔ قبلی پنل. */
    size?: BaseModalSize;
    /** کلاس اختیاری برای باکس داخلی محتوا (پیش‌فرض `p-2`). */
    contentClass?: string;
  }>(),
  {
    closable: true,
    dismissableMask: true,
    rootClass: undefined,
    size: 'default',
    contentClass: 'p-2',
  }
);

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'hide'): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
});

const resolvedRootClass = computed(() => {
  const raw = props.rootClass;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).trim();
  }
  const key = props.size ?? 'default';
  const width = SIZE_WIDTH[key] ?? SIZE_WIDTH.default;
  return `${width} ${MODAL_SKIN}`;
});

function onHide() {
  emit('update:visible', false);
  emit('hide');
}

/** بعد از باز شدن، در صورت وجود، اولین input/textarea داخل `[data-autofocus-modal]` فوکوس می‌شود. */
function onDialogShow() {
  nextTick(() => {
    setTimeout(() => {
      const wrap = document.querySelector('[data-autofocus-modal]');
      const el = wrap?.querySelector(
        'input:not([type="hidden"]), textarea'
      ) as HTMLElement | null;
      el?.focus({ preventScroll: true });
    }, 150);
  });
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="title"
    :closable="closable"
    :dismissableMask="dismissableMask"
    append-to="body"
    :modal="true"
    :pt="{
      root: {
        class: resolvedRootClass,
      },
      title: {
        class:
          'font-normal leading-tight text-slate-700 dark:text-slate-200 !text-[16px]',
      },
      content: { class: 'text-sm' },
      footer: {
        class:
          'flex flex-wrap items-center justify-end gap-2',
      },
      pcCloseButton: { root: { class: '!h-7 !w-7 min-h-0' } },
    }"
    @hide="onHide"
    @show="onDialogShow"
  >
    <!-- PrimeVue بدون [autofocus] در محتوا فوکوس را به دکمهٔ بستن می‌دهد؛ این عنصر فوکوس اولیه را می‌گیرد. -->
    <div :class="contentClass">
      <div
        tabindex="-1"
        autofocus
        class="sr-only outline-none"
        aria-hidden="true"
      />
      <slot />
    </div>
    <template #footer>
      <slot name="footer" />
    </template>
  </Dialog>
</template>
