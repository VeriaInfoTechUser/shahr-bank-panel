<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import Lucide from '@/base-components/Lucide';
import Button from '@/base-components/Button';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useGlobalModal } from '@/composables/useGlobalModal';
import CategoryFormModal from './CategoryFormModal.vue';

interface CategoryNode {
  slug: string;
  title: string;
  description?: string;
  children?: CategoryNode[];
}

const { t } = useI18n();
const { openModal } = useGlobalModal();
const loading = ref(false);
const tree = ref<CategoryNode[]>([]);
const expanded = ref<Set<string>>(new Set());

async function fetchTree() {
  loading.value = true;
  try {
    const res = await grcRepo.governanceCategoriesTree();
    if (res?.result && Array.isArray(res.data)) {
      tree.value = res.data as CategoryNode[];
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
    component: CategoryFormModal,
    props: {},
    onSuccess: () => {
      void fetchTree();
    },
  });
}

function onAddChild(parentSlug: string, parentTitle: string) {
  expanded.value.add(parentSlug);
  openModal({
    component: CategoryFormModal,
    props: { parentSlug, parentTitle },
    onSuccess: () => {
      void fetchTree();
    },
  });
}

function onEdit(record: CategoryNode) {
  openModal({
    component: CategoryFormModal,
    props: { record },
    onSuccess: () => {
      void fetchTree();
    },
  });
}

function onDelete(record: CategoryNode) {
  openModal({
    component: BaseConfirmModal,
    props: {
      title: t('settings-page.category-delete-title'),
      message: t('settings-page.category-delete-message', { title: record.title }),
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const res = await grcRepo.governanceCategoryDelete(record.slug);
        if (!res?.result) {
          const msg = String(res?.error ?? t('settings-page.category-delete-error'));
          toast(msg, { type: 'error' });
          throw new Error(msg);
        }
      },
    },
    onSuccess: () => {
      toast(t('settings-page.category-delete-success'), { type: 'success' });
      void fetchTree();
    },
  });
}

onMounted(() => {
  fetchTree();
});
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12">
      <div class="rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-800 dark:text-slate-100">
            {{ t('settings-page.category-title') }}
          </h2>
          <Button
            type="button"
            variant="primary"
            size="sm"
            @click="onAddRoot"
          >
            <Lucide icon="Plus" class="mr-1 !h-3.5 !w-3.5" />
            {{ t('settings-page.category-add-parent') }}
          </Button>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>

        <div v-else-if="tree.length === 0" class="py-12 text-center text-sm text-slate-400">
          {{ t('general.no-data') }}
        </div>

        <ul v-else class="space-y-0.5">
          <template v-for="node in tree" :key="node.slug">
            <li>
              <div
                class="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-darkmode-700"
                :class="{ 'cursor-pointer': node.children?.length }"
                @click="node.children?.length ? toggle(node.slug) : undefined"
              >
                <Lucide
                  v-if="node.children?.length"
                  icon="ChevronRight"
                  class="h-4 w-4 shrink-0 text-slate-400 transition-transform"
                  :class="{ 'rotate-90': expanded.has(node.slug) }"
                />
                <span v-else class="h-4 w-4 shrink-0" />
                <span class="text-slate-700 dark:text-slate-200">{{ node.title }}</span>
                <span v-if="node.description" class="ml-2 text-xs text-slate-400">{{ node.description }}</span>
                <div class="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    size="sm"
                    class="!h-6 !px-1.5"
                    :title="t('settings-page.category-add-child')"
                    @click.stop="onAddChild(node.slug, node.title)"
                  >
                    <Lucide icon="Plus" class="!h-3 !w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    size="sm"
                    class="!h-6 !px-1.5"
                    :title="t('title.update')"
                    @click.stop="onEdit(node)"
                  >
                    <Lucide icon="Pencil" class="!h-3 !w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline-danger"
                    size="sm"
                    class="!h-6 !px-1.5"
                    :title="t('general.delete')"
                    @click.stop="onDelete(node)"
                  >
                    <Lucide icon="Trash2" class="!h-3 !w-3" />
                  </Button>
                </div>
              </div>

              <ul
                v-if="node.children?.length && expanded.has(node.slug)"
                class="ml-4 space-y-0.5 border-l border-slate-200 pl-2 dark:border-darkmode-600"
              >
                <template v-for="child in node.children" :key="child.slug">
                  <li>
                    <div
                      class="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-darkmode-700"
                      :class="{ 'cursor-pointer': child.children?.length }"
                      @click="child.children?.length ? toggle(child.slug) : undefined"
                    >
                      <Lucide
                        v-if="child.children?.length"
                        icon="ChevronRight"
                        class="h-4 w-4 shrink-0 text-slate-400 transition-transform"
                        :class="{ 'rotate-90': expanded.has(child.slug) }"
                      />
                      <span v-else class="h-4 w-4 shrink-0" />
                      <span class="text-slate-700 dark:text-slate-200">{{ child.title }}</span>
                      <span v-if="child.description" class="ml-2 text-xs text-slate-400">{{ child.description }}</span>
                      <div class="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="outline-secondary"
                          size="sm"
                          class="!h-6 !px-1.5"
                          :title="t('settings-page.category-add-child')"
                          @click.stop="onAddChild(child.slug, child.title)"
                        >
                          <Lucide icon="Plus" class="!h-3 !w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline-secondary"
                          size="sm"
                          class="!h-6 !px-1.5"
                          :title="t('title.update')"
                          @click.stop="onEdit(child)"
                        >
                          <Lucide icon="Pencil" class="!h-3 !w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          class="!h-6 !px-1.5"
                          :title="t('general.delete')"
                          @click.stop="onDelete(child)"
                        >
                          <Lucide icon="Trash2" class="!h-3 !w-3" />
                        </Button>
                      </div>
                    </div>

                    <ul
                      v-if="child.children?.length && expanded.has(child.slug)"
                      class="ml-4 space-y-0.5 border-l border-slate-200 pl-2 dark:border-darkmode-600"
                    >
                      <li v-for="grandchild in child.children" :key="grandchild.slug">
                        <div class="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-darkmode-700">
                          <span class="h-4 w-4 shrink-0" />
                          <span class="text-slate-700 dark:text-slate-200">{{ grandchild.title }}</span>
                          <span v-if="grandchild.description" class="ml-2 text-xs text-slate-400">{{ grandchild.description }}</span>
                          <div class="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="outline-secondary"
                              size="sm"
                              class="!h-6 !px-1.5"
                              :title="t('title.update')"
                              @click.stop="onEdit(grandchild)"
                            >
                              <Lucide icon="Pencil" class="!h-3 !w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline-danger"
                              size="sm"
                              class="!h-6 !px-1.5"
                              :title="t('general.delete')"
                              @click.stop="onDelete(grandchild)"
                            >
                              <Lucide icon="Trash2" class="!h-3 !w-3" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </li>
                </template>
              </ul>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>
