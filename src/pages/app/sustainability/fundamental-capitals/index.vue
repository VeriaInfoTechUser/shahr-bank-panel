<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import Lucide from '@/base-components/Lucide';
import Button from '@/base-components/Button';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useGlobalModal } from '@/composables/useGlobalModal';
import StructureFormModal from './StructureFormModal.vue';
import DomainFormModal from './DomainFormModal.vue';

interface CapitalNode {
  slug: string;
  title: string;
  type?: string;
  capitalType?: string;
  number?: string;
  description?: string;
  children?: CapitalNode[];
}

const { t } = useI18n();
const { openModal } = useGlobalModal();
const loading = ref(false);
const tree = ref<CapitalNode[]>([]);
const expanded = ref<Set<string>>(new Set());

async function fetchTree() {
  loading.value = true;
  try {
    const res = await grcRepo.capitalTree({ level: 4 });
    if (res?.result && Array.isArray(res.data)) {
      tree.value = res.data as CapitalNode[];
    }
  } catch {
    tree.value = [];
  } finally {
    loading.value = false;
  }
}

function toggle(slug: string) {
  if (expanded.value.has(slug)) {
    expanded.value.delete(slug);
  } else {
    expanded.value.add(slug);
  }
}

function onAddRoot() {
  openModal({
    component: StructureFormModal,
    props: {},
    onSuccess: () => {
      void fetchTree();
    },
  });
}

function onAddChild(parentSlug: string, parentTitle: string, nodeType?: string, nodeData?: CapitalNode) {
  expanded.value.add(parentSlug);

  // Build capital data from the parent node
  const capitalData = {
    slug: nodeData?.slug ?? parentSlug,
    title: nodeData?.title ?? parentTitle,
    capitalType: nodeData?.capitalType,
  };

  // nodeType comes directly from node.type field: "capital", "domain", "component", "capability"
  if (nodeType === 'capital') {
    // Capital -> Add Domain
    openModal({
      component: DomainFormModal,
      props: {
        capitalData,
      },
      onSuccess: () => {
        void fetchTree();
      },
    });
  } else if (nodeType === 'domain') {
    // Domain -> Add Component
    openModal({
      component: DomainFormModal,
      props: {
        capitalData,
      },
      onSuccess: () => {
        void fetchTree();
      },
    });
  } else if (nodeType === 'component') {
    // Component -> Add Capability
    openModal({
      component: DomainFormModal,
      props: {
        capitalData,
      },
      onSuccess: () => {
        void fetchTree();
      },
    });
  } else {
    // Default: open domain modal
    openModal({
      component: DomainFormModal,
      props: {
        capitalData,
      },
      onSuccess: () => {
        void fetchTree();
      },
    });
  }
}

function onEdit(record: CapitalNode) {
  openModal({
    component: StructureFormModal,
    props: { record },
    onSuccess: () => {
      void fetchTree();
    },
  });
}

function onDelete(record: CapitalNode) {
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('sustainability-fundamental-capitals-page.delete-title'),
      message: t('sustainability-fundamental-capitals-page.delete-message', { title: record.title }),
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const res = await grcRepo.capitalDelete(record.slug);
        if (!res?.result) {
          const msg = String(res?.error ?? t('sustainability-fundamental-capitals-page.delete-error'));
          toast(msg, { type: 'error' });
          throw new Error(msg);
        }
      },
    },
    onSuccess: () => {
      toast(t('sustainability-fundamental-capitals-page.delete-success'), { type: 'success' });
      void fetchTree();
    },
  });
}

onMounted(() => {
  fetchTree();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50/80 to-primary-muted/10 p-6 dark:from-darkmode-900 dark:via-darkmode-800 dark:to-primary-muted/5">
    <div class="mx-auto max-w-5xl">
      <!-- Header Card -->
      <div class="mb-6 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-lg shadow-primary/5 dark:border-darkmode-700/40 dark:bg-darkmode-800 dark:shadow-black/10">
        <div class="border-b border-slate-100 bg-gradient-to-r from-primary/5 via-transparent to-primary-muted/10 px-6 py-4 dark:border-darkmode-700/50 dark:from-primary/10 dark:to-primary-muted/5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20">
                <Lucide icon="Network" class="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {{ t('menu.sustainability-fundamental-capitals') }}
                </h1>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ t('sustainability-fundamental-capitals-page.description') }}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              class="!h-9 !rounded-xl !px-4 !shadow-md !shadow-primary/25 hover:!shadow-lg hover:!shadow-primary/30"
              @click="onAddRoot"
            >
              <Lucide icon="Plus" class="!h-4 !w-4" />
              {{ t('sustainability-fundamental-capitals-page.add-root') }}
            </Button>
          </div>
        </div>

        <!-- Content Area -->
        <div class="p-6">
          <!-- Loading State -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-16">
            <div class="relative">
              <div class="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="h-4 w-4 rounded-full bg-primary/20" />
              </div>
            </div>
            <span class="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('general.loading') }}</span>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="tree.length === 0"
            class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 dark:border-darkmode-600"
          >
            <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-darkmode-700">
              <Lucide icon="FolderOpen" class="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
              {{ t('general.no-data') }}
            </p>
          </div>

          <!-- Tree View -->
          <div v-else class="space-y-1">
            <template v-for="(node, index) in tree" :key="node.slug">
              <div
                class="group/tree overflow-hidden rounded-xl transition-all duration-200 hover:shadow-md"
                :class="[
                  expanded.has(node.slug)
                    ? 'bg-slate-50/80 ring-1 ring-slate-200/60 dark:bg-darkmode-700/50 dark:ring-darkmode-600/60'
                    : 'bg-white hover:bg-slate-50 dark:bg-darkmode-800 dark:hover:bg-darkmode-700/50'
                ]"
              >
                <!-- Root Node -->
                <div
                  class="flex items-center gap-3 px-4 py-3"
                  :class="{ 'cursor-pointer': node.children?.length }"
                  @click="node.children?.length ? toggle(node.slug) : undefined"
                >
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                    :class="node.children?.length
                      ? 'bg-primary/10 group-hover/tree:bg-primary/15 dark:bg-primary/20 dark:group-hover/tree:bg-primary/25'
                      : 'bg-slate-100 dark:bg-darkmode-600'"
                  >
                    <Lucide
                      v-if="node.children?.length"
                      icon="ChevronRight"
                      class="h-4 w-4 text-primary transition-transform duration-200"
                      :class="{ 'rotate-90': expanded.has(node.slug) }"
                    />
                    <Lucide v-else icon="Coins" class="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <span
                      class="block truncate text-sm font-medium transition-colors"
                      :class="expanded.has(node.slug)
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 group-hover/tree:text-slate-900 dark:text-slate-200 dark:group-hover/tree:text-slate-100'"
                    >
                      {{ node.title }}
                    </span>
                    <span v-if="node.description" class="mt-0.5 block truncate text-xs text-slate-400 dark:text-slate-500">
                      {{ node.description }}
                    </span>
                  </div>

                  <div class="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover/tree:opacity-100">
                    <button
                      type="button"
                      class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                      :title="t('sustainability-fundamental-capitals-page.add-child')"
                      @click.stop="onAddChild(node.slug, node.title, node.type || 'capital', node)"
                    >
                      <Lucide icon="Plus" class="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
                      :title="t('title.update')"
                      @click.stop="onEdit(node)"
                    >
                      <Lucide icon="Pencil" class="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger dark:hover:bg-danger/20"
                      :title="t('general.delete')"
                      @click.stop="onDelete(node)"
                    >
                      <Lucide icon="Trash2" class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Children -->
                <ul
                  v-if="node.children?.length && expanded.has(node.slug)"
                  class="border-t border-slate-100 bg-white/50 px-4 py-2 dark:border-darkmode-600/50 dark:bg-darkmode-800/50"
                >
                  <template v-for="(child, childIndex) in node.children" :key="child.slug">
                    <li>
                      <div
                        class="group/child flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                        :class="[
                          child.children?.length ? 'cursor-pointer' : '',
                          expanded.has(child.slug) ? 'bg-slate-50/80 dark:bg-darkmode-700/30' : 'hover:bg-slate-50 dark:hover:bg-darkmode-700/50'
                        ]"
                        @click="child.children?.length ? toggle(child.slug) : undefined"
                      >
                        <div
                          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
                          :class="child.children?.length
                            ? 'bg-primary/8 group-hover/child:bg-primary/12 dark:bg-primary/15 dark:group-hover/child:bg-primary/20'
                            : 'bg-slate-100 dark:bg-darkmode-600'"
                        >
                          <Lucide
                            v-if="child.children?.length"
                            icon="ChevronRight"
                            class="h-3.5 w-3.5 text-primary/70 transition-transform duration-200"
                            :class="{ 'rotate-90': expanded.has(child.slug) }"
                          />
                          <Lucide v-else icon="Coins" class="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        </div>

                        <div class="min-w-0 flex-1">
                          <span
                            class="block truncate text-sm transition-colors"
                            :class="expanded.has(child.slug)
                              ? 'font-medium text-emerald-700 dark:text-emerald-300'
                              : 'text-slate-600 group-hover/child:text-slate-800 dark:text-slate-300 dark:group-hover/child:text-slate-100'"
                          >
                            {{ child.title }}
                          </span>
                          <span v-if="child.description" class="mt-0.5 block truncate text-xs text-slate-400 dark:text-slate-500">
                            {{ child.description }}
                          </span>
                        </div>

                        <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/child:opacity-100">
                          <button
                            type="button"
                            class="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                            :title="t('sustainability-fundamental-capitals-page.add-child')"
                            @click.stop="onAddChild(child.slug, child.title, child.type || 'domain', child)"
                          >
                            <Lucide icon="Plus" class="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            class="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
                            :title="t('title.update')"
                            @click.stop="onEdit(child)"
                          >
                            <Lucide icon="Pencil" class="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            class="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger dark:hover:bg-danger/20"
                            :title="t('general.delete')"
                            @click.stop="onDelete(child)"
                          >
                            <Lucide icon="Trash2" class="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <!-- Grandchildren -->
                      <ul
                        v-if="child.children?.length && expanded.has(child.slug)"
                        class="ml-8 mt-1 space-y-0.5 border-l-2 border-primary/10 pl-3 dark:border-primary/20"
                      >
                        <li v-for="grandchild in child.children" :key="grandchild.slug">
                          <div
                            class="group/grandchild flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
                            :class="[
                              grandchild.children?.length ? 'cursor-pointer' : '',
                              expanded.has(grandchild.slug) ? 'bg-slate-50/80 dark:bg-darkmode-700/30' : 'hover:bg-slate-50 dark:hover:bg-darkmode-700/50'
                            ]"
                            @click="grandchild.children?.length ? toggle(grandchild.slug) : undefined"
                          >
                            <div
                              class="flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors"
                              :class="grandchild.children?.length
                                ? 'bg-primary/8 group-hover/grandchild:bg-primary/12 dark:bg-primary/15 dark:group-hover/grandchild:bg-primary/20'
                                : ''"
                            >
                              <Lucide
                                v-if="grandchild.children?.length"
                                icon="ChevronRight"
                                class="h-3.5 w-3.5 text-primary/70 transition-transform duration-200"
                                :class="{ 'rotate-90': expanded.has(grandchild.slug) }"
                              />
                              <div v-else class="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-darkmode-500" />
                            </div>

                            <div class="min-w-0 flex-1">
                              <span
                                class="block truncate text-sm transition-colors"
                                :class="expanded.has(grandchild.slug)
                                  ? 'font-medium text-violet-700 dark:text-violet-300'
                                  : 'text-slate-500 group-hover/grandchild:text-slate-700 dark:text-slate-400 dark:group-hover/grandchild:text-slate-200'"
                              >
                                {{ grandchild.title }}
                              </span>
                              <span v-if="grandchild.description" class="mt-0.5 block truncate text-xs text-slate-400 dark:text-slate-500">
                                {{ grandchild.description }}
                              </span>
                            </div>

                            <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/grandchild:opacity-100">
                              <button
                                type="button"
                                class="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                                :title="t('sustainability-fundamental-capitals-page.add-child')"
                                @click.stop="onAddChild(grandchild.slug, grandchild.title, grandchild.type || 'component', grandchild)"
                              >
                                <Lucide icon="Plus" class="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                class="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
                                :title="t('title.update')"
                                @click.stop="onEdit(grandchild)"
                              >
                                <Lucide icon="Pencil" class="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                class="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger dark:hover:bg-danger/20"
                                :title="t('general.delete')"
                                @click.stop="onDelete(grandchild)"
                              >
                                <Lucide icon="Trash2" class="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <!-- Great-grandchildren (level 4) -->
                          <ul
                            v-if="grandchild.children?.length && expanded.has(grandchild.slug)"
                            class="ml-6 mt-1 space-y-0.5 border-l-2 border-slate-200/60 pl-3 dark:border-darkmode-600/60"
                          >
                            <li v-for="greatGrandchild in grandchild.children" :key="greatGrandchild.slug">
                              <div class="group/ggchild flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-darkmode-700/30">
                                <div class="flex h-4 w-4 shrink-0 items-center justify-center">
                                  <div class="h-1 w-1 rounded-full bg-slate-300/70 dark:bg-darkmode-500/70" />
                                </div>

                                <div class="min-w-0 flex-1">
                                  <span class="block truncate text-xs text-amber-600 dark:text-amber-400">
                                    {{ greatGrandchild.title }}
                                  </span>
                                  <span v-if="greatGrandchild.description" class="mt-0.5 block truncate text-[10px] text-slate-400/70 dark:text-slate-500/70">
                                    {{ greatGrandchild.description }}
                                  </span>
                                </div>

                                <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover/ggchild:opacity-100">
                                  <button
                                    type="button"
                                    class="flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
                                    :title="t('title.update')"
                                    @click.stop="onEdit(greatGrandchild)"
                                  >
                                    <Lucide icon="Pencil" class="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    class="flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger dark:hover:bg-danger/20"
                                    :title="t('general.delete')"
                                    @click.stop="onDelete(greatGrandchild)"
                                  >
                                    <Lucide icon="Trash2" class="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </template>
                </ul>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
