<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import Tippy from "../../base-components/Tippy";
import Lucide from "../../base-components/Lucide";
import TopBar from "../../components/TopBar";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb.vue";
import MobileMenu from "../../components/MobileMenu";
import { useSideMenuStore } from "../../stores/side-menu";
import { usePermissionStore } from "@/core/permission/permissionStore";
import {
  ProvideForceActiveMenu,
  forceActiveMenu,
  Route,
  FormattedMenu,
  nestedMenu,
  linkTo,
  enter,
  leave,
} from "./side-menu";
import { watch, reactive, ref, shallowRef, computed, onMounted, provide } from "vue";
import { useI18n } from "vue-i18n";
import type { BreadcrumbSlotContent } from "@/composables/useBreadcrumb";

/** Ref for breadcrumb slot: pages can set a component to render at the end of the breadcrumb row. shallowRef avoids making the component reactive. */
const breadcrumbExtraRef = shallowRef<BreadcrumbSlotContent | null>(null);
provide("breadcrumbExtra", breadcrumbExtraRef);

const route: Route = useRoute();
const router = useRouter();
const { locale } = useI18n();

/** آیکون دکمه‌ی جمع/بازکردن منو، متناسب با جهت چیدمان (RTL: سایدبار سمت راست) */
const collapseIcon = computed(() => {
  const rtl = locale.value === "fa" || locale.value === "ar";
  if (sidebarCollapsed.value) return rtl ? "ChevronsLeft" : "SidebarOpen";
  return rtl ? "ChevronsRight" : "SidebarClose";
});
let formattedMenu = reactive<Array<FormattedMenu | "divider">>([]);
const setFormattedMenu = (
  computedFormattedMenu: Array<FormattedMenu | "divider">
) => {
  Object.assign(formattedMenu, computedFormattedMenu);
};
const sideMenuStore = useSideMenuStore();
const permStore = usePermissionStore();

const userRoles = permStore.roles;

function filterMenu(items: typeof sideMenuStore.menu): typeof sideMenuStore.menu {
  return items
    .map(item => {
      if (typeof item === "string") return item;
      
      if (item.requiredRole && !userRoles.includes(item.requiredRole)) {
        return null;
      }
      
      const newItem: typeof item = { ...item };
      
      if (item.subMenu && item.subMenu.length > 0) {
        const filteredSubMenu = filterMenu(item.subMenu);
        const menuItemsOnly = filteredSubMenu.filter((sub): sub is typeof item => typeof sub !== "string" && sub !== null);
        if (menuItemsOnly.length > 0) {
          newItem.subMenu = menuItemsOnly;
          return newItem;
        }
        return null;
      }
      
      return newItem;
    })
    .filter((item): item is typeof item => item !== null);
}

const filteredMenu = ref(filterMenu(sideMenuStore.menu));
const sideMenu = computed(() => nestedMenu(filteredMenu.value, route));
const windowWidth = ref(window.innerWidth);
/** آستانه‌ی عرض: در نمایشگرهای باریک‌تر از ۱۰۸۰px منو به‌صورت خودکار بسته می‌شود */
const SM_BREAKPOINT = 1080;
const sidebarCollapsed = ref(false);
/** آخرین وضعیت اندازه‌ی صفحه: فقط هنگام عبور از آستانه، وضعیت منو را خودکار تنظیم می‌کنیم */
let lastSmallViewport: boolean | null = null;

function syncCollapseWithViewport() {
  const small = window.innerWidth < SM_BREAKPOINT;
  if (lastSmallViewport === null || small !== lastSmallViewport) {
    // در اندازه‌های کوچک منو بسته شروع می‌شود؛ کاربر می‌تواند آن را باز کند
    sidebarCollapsed.value = small;
    lastSmallViewport = small;
  }
}

provide<ProvideForceActiveMenu>("forceActiveMenu", (pageName: string) => {
  forceActiveMenu(route, pageName);
  setFormattedMenu(sideMenu.value);
});

watch(
  computed(() => route.path),
  () => {
    delete route.forceActiveMenu;
    setFormattedMenu(sideMenu.value);
  }
);

onMounted(() => {
  setFormattedMenu(sideMenu.value);
  syncCollapseWithViewport();

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
    syncCollapseWithViewport();
  });
});
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <TopBar />
    <div class="flex flex-1 items-stretch min-h-0">
      <!-- BEGIN: Sidebar -->
      <aside
        :class="[
          'sidebar flex flex-col shrink-0 bg-surface-subtle border-e border-border/80 transition-all duration-300 overflow-hidden',
          sidebarCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
        ]"
      >
        <!-- BEGIN: Sidebar Header (collapse toggle) -->
        <div
          class="flex pt-2.5 px-2"
          :class="sidebarCollapsed ? 'justify-center' : 'justify-between'"
        >
          <button
            type="button"
            class="flex items-center gap-2 rounded-xl px-2.5 py-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
            @click="sidebarCollapsed = !sidebarCollapsed"
            :title="$t(sidebarCollapsed ? 'panel.expand-menu' : 'panel.collapse-menu')"
          >
            <Lucide :icon="collapseIcon" class="h-4.5 w-4.5" />
            <span v-if="!sidebarCollapsed" class="text-xs font-medium">{{ $t('panel.collapse-menu') }}</span>
          </button>
        </div>
        <!-- END: Sidebar Header -->

        <!-- BEGIN: Side Menu -->
        <nav
          :class="[
            'side-nav flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3',
            sidebarCollapsed && 'side-nav--collapsed',
          ]"
        >
          <ul>
            <!-- BEGIN: First Child -->
            <template v-for="(menu, menuKey) in formattedMenu">
              <li
                v-if="menu == 'divider'"
                type="li"
                :class="[
                  'side-nav__divider my-2.5',
                  // Animation
                  `opacity-0 animate-[0.4s_ease-in-out_0.1s_intro-divider] animate-fill-mode-forwards animate-delay-${
                    (menuKey + 1) * 10
                  }`,
                ]"
                :key="'divider-' + menuKey"
              ></li>
              <li v-else :key="menuKey">
                <Tippy
                  as="a"
                  :content=" $t(menu.title) "
                  :options="{
                    placement: 'right',
                  }"
                  :disable="!sidebarCollapsed"
                  :href="
                  menu.subMenu
                    ? '#'
                    : ((pageName: string | undefined) => {
                        try {
                          return router.resolve({
                            name: pageName,
                          }).fullPath;
                        } catch (err) {
                          return '';
                        }
                      })(menu.pageName)
                "
                  @click="(event: MouseEvent) => {
                  event.preventDefault();
                  linkTo(menu, router);
                  setFormattedMenu([...formattedMenu]);
                }"
                  :class="[
                    menu.active ? 'side-menu side-menu--active' : 'side-menu',

                    // Animation
                    {
                      [`opacity-0 translate-x-[50px] animate-[0.4s_ease-in-out_0.1s_intro-menu] animate-fill-mode-forwards animate-delay-${
                        (menuKey + 1) * 10
                      }`]: !menu.active,
                    },
                  ]"
                >
                <div class="side-menu__icon side-menu__icon--root">
                  <Lucide :icon="menu.icon" />
                </div>
                  <div class="side-menu__title">
                    <span class="truncate">{{ $t(menu.title) }}</span>
                    <div
                      v-if="menu.subMenu"
                      :class="[
                        'side-menu__sub-icon',
                        { 'transform rotate-180': menu.activeDropdown },
                      ]"
                    >
                      <Lucide icon="ChevronDown" />
                    </div>
                  </div>
                </Tippy>
                <Transition @enter="enter" @leave="leave">
                  <ul
                    v-if="menu.subMenu && menu.activeDropdown"
                    :class="{ 'side-menu__sub-open': menu.activeDropdown }"
                  >
                    <li
                      v-for="(subMenu, subMenuKey) in menu.subMenu"
                      :key="subMenuKey"
                    >
                      <Tippy
                        as="a"
                        :content=" $t(subMenu.title)"
                        :options="{
                          placement: 'right',
                        }"
                        :disable="!sidebarCollapsed"
                        :href="
                        subMenu.subMenu
                          ? '#'
                          : ((pageName: string | undefined) => {
                              try {
                                return router.resolve({
                                  name: pageName,
                                }).fullPath;
                              } catch (err) {
                                return '';
                              }
                            })(subMenu.pageName)
                      "
                        :class="[
                          subMenu.active
                            ? 'side-menu side-menu--active'
                            : 'side-menu',

                          // Animation
                          {
                            [`opacity-0 translate-x-[50px] animate-[0.4s_ease-in-out_0.1s_intro-menu] animate-fill-mode-forwards animate-delay-${
                              (subMenuKey + 1) * 10
                            }`]: !subMenu.active,
                          },
                        ]"
                        @click="(event: MouseEvent) => {
                        event.preventDefault();
                        linkTo(subMenu, router);
                        setFormattedMenu([...formattedMenu]);
                      }"
                      >
                    <div class="side-menu__icon side-menu__icon--sub">
                      <Lucide :icon="subMenu.icon" />
                    </div>
                        <div class="side-menu__title">
                          <span class="truncate">{{ $t(subMenu.title) }}</span>
                          <div
                            v-if="subMenu.subMenu"
                            :class="[
                              'side-menu__sub-icon',
                              {
                                'transform rotate-180': subMenu.activeDropdown,
                              },
                            ]"
                          >
                            <Lucide icon="ChevronDown" />
                          </div>
                        </div>
                      </Tippy>
                      <Transition
                        @enter="enter"
                        @leave="leave"
                        v-if="subMenu.subMenu"
                      >
                        <ul
                          v-if="subMenu.subMenu && subMenu.activeDropdown"
                          :class="{
                            'side-menu__sub-open': subMenu.activeDropdown,
                          }"
                        >
                          <li
                            v-for="(
                              lastSubMenu, lastSubMenuKey
                            ) in subMenu.subMenu"
                            :key="lastSubMenuKey"
                          >
                            <Tippy
                              as="a"
                              :content="$t(lastSubMenu.title)"
                              :options="{
                                placement: 'right',
                              }"
                              :disable="!sidebarCollapsed"
                              :href="
                              lastSubMenu.subMenu
                                ? '#'
                                : ((pageName: string | undefined) => {
                                    try {
                                      return router.resolve({
                                        name: pageName,
                                      }).fullPath;
                                    } catch (err) {
                                      return '';
                                    }
                                  })(lastSubMenu.pageName)
                            "
                              :class="[
                                lastSubMenu.active
                                  ? 'side-menu side-menu--active'
                                  : 'side-menu',

                                // Animation
                                {
                                  [`opacity-0 translate-x-[50px] animate-[0.4s_ease-in-out_0.1s_intro-menu] animate-fill-mode-forwards animate-delay-${
                                    (lastSubMenuKey + 1) * 10
                                  }`]: !lastSubMenu.active,
                                },
                              ]"
                              @click="(event: MouseEvent) => {
                              event.preventDefault();
                              linkTo(lastSubMenu, router);
                              setFormattedMenu([...formattedMenu]);
                            }"
                            >
                        <div class="side-menu__icon side-menu__icon--sub-nested">
                          <Lucide :icon="lastSubMenu.icon" />
                        </div>
                              <div class="side-menu__title">
                                <span class="truncate">{{$t(lastSubMenu.title) }}</span>
                              </div>
                            </Tippy>
                          </li>
                        </ul>
                      </Transition>
                    </li>
                  </ul>
                </Transition>
              </li>
            </template>
            <!-- END: First Child -->
          </ul>
        </nav>
        <!-- END: Side Menu -->


      </aside>
      <!-- END: Sidebar -->

      <!-- BEGIN: Content -->
      <main class="flex-1 min-w-0 flex flex-col">
        <div class="sticky top-0 z-30 border-b border-border/70 bg-surface/95 backdrop-blur px-4 md:px-6 shadow-sm">
          <Breadcrumb />
        </div>
        <div class="flex-1 px-4 md:px-6 py-5 md:py-6">
          <RouterView />
        </div>
        <!-- BEGIN: Footer -->
        <footer class="border-t border-border/70 bg-surface/70 px-4 md:px-6 py-3.5">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-text-muted">
            <div class="flex items-center gap-2 min-w-0">
              <span class="truncate font-semibold text-text-secondary" :title="$t('title.web-title-short')">{{ $t('title.web-title-short') }}</span>
              <span class="shrink-0 text-text-disabled">·</span>
              <span>{{ $t('panel.footer-version') }}</span>
              <span class="text-text-disabled">·</span>
              <button class="transition-colors hover:text-primary">{{ $t('panel.footer-support') }}</button>
              <span class="text-text-disabled">·</span>
              <button class="transition-colors hover:text-primary">{{ $t('panel.footer-privacy') }}</button>
            </div>
            <span>© ۱۴۰۳ {{ $t('panel.footer-copyright') }}</span>
          </div>
        </footer>
        <!-- END: Footer -->
      </main>
      <!-- END: Content -->
    </div>
  </div>
</template>
