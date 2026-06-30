<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import Lucide from "../../base-components/Lucide";
import TopBar from "../../components/TopBar";
import MobileMenu from "../../components/MobileMenu";
import _ from "lodash";
import { useTopMenuStore } from "../../stores/top-menu";
import {
  ProvideForceActiveMenu,
  forceActiveMenu,
  Route,
  FormattedMenu,
  nestedMenu,
  linkTo,
} from "./top-menu";
import { watch, reactive, computed, onMounted, provide } from "vue";

const route: Route = useRoute();
const router = useRouter();
let formattedMenu = reactive<Array<FormattedMenu>>([]);
const setFormattedMenu = (computedFormattedMenu: Array<FormattedMenu>) => {
  Object.assign(formattedMenu, computedFormattedMenu);
};
const topMenuStore = useTopMenuStore();
const topMenu = computed(() => nestedMenu(topMenuStore.menu, route));

provide<ProvideForceActiveMenu>("forceActiveMenu", (pageName: string) => {
  forceActiveMenu(route, pageName);
  setFormattedMenu(topMenu.value);
});

watch(topMenu, () => {
  setFormattedMenu(topMenu.value);
});

watch(
  computed(() => route.path),
  () => {
    delete route.forceActiveMenu;
  }
);

onMounted(() => {
  setFormattedMenu(topMenu.value);
});
</script>

<template>
  <div
    class="pt-2 pb-7 before:content-[''] before:absolute before:inset-0 before:bg-fixed before:bg-no-repeat before:bg-skew-pattern dark:before:bg-skew-pattern-dark"
  >
    <MobileMenu />
    <TopBar />
    <!-- BEGIN: Top Menu -->
    <nav
      :class="[
        'hidden top-nav md:block xl:pt-[12px] z-50 relative xl:px-6 -mt-2 xl:-mt-[3px]',

        // Animation
        'animate-[0.4s_ease-in-out_0.3s_intro-top-menu] animate-fill-mode-forwards opacity-0 translate-y-[35px]',
      ]"
    >
      <ul class="h-[50px] flex flex-wrap">
        <li v-for="(menu, menuKey) in formattedMenu" :key="menuKey">
          <a
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
            :class="[
              menu.active ? 'top-menu top-menu--active' : 'top-menu',

              // Animation
              {
                [`[&:not(.top-menu--active)]:opacity-0 [&:not(.top-menu--active)]:translate-y-[50px] animate-[0.4s_ease-in-out_0.3s_intro-top-menu] animate-fill-mode-forwards animate-delay-${
                  (menuKey + 1) * 10
                }`]: !menu.active,
              },
            ]"
            @click="(event: MouseEvent) => {
              event.preventDefault();
              linkTo(menu, router);
            }"
          >
            <div class="top-menu__icon">
              <Lucide :icon="menu.icon" />
            </div>
            <div class="top-menu__title">
              {{ menu.title }}
              <Lucide
                v-if="menu.subMenu"
                class="top-menu__sub-icon"
                icon="ChevronDown"
              />
            </div>
          </a>
          <ul
            v-if="menu.subMenu"
            :class="{ 'side-menu__sub-open': menu.activeDropdown }"
          >
            <li v-for="(subMenu, subMenuKey) in menu.subMenu" :key="subMenuKey">
              <a
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
                class="top-menu"
                @click="(event: MouseEvent) => {
                  event.preventDefault();
                  linkTo(subMenu, router);
                }"
              >
                <div class="top-menu__icon">
                  <Lucide :icon="subMenu.icon" />
                </div>
                <div class="top-menu__title">
                  {{ subMenu.title }}
                  <Lucide
                    v-if="subMenu.subMenu"
                    class="top-menu__sub-icon"
                    icon="ChevronDown"
                  />
                </div>
              </a>
              <ul
                v-if="subMenu.subMenu"
                :class="{ 'side-menu__sub-open': subMenu.activeDropdown }"
              >
                <li
                  v-for="(lastSubMenu, lastSubMenuKey) in subMenu.subMenu"
                  :key="lastSubMenuKey"
                >
                  <a
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
                    class="top-menu"
                    @click="(event: MouseEvent) => {
                      event.preventDefault();
                      linkTo(lastSubMenu, router);
                    }"
                  >
                    <div class="top-menu__icon">
                      <Lucide :icon="lastSubMenu.icon" />
                    </div>
                    <div class="top-menu__title">
                      {{ lastSubMenu.title }}
                    </div>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
    <!-- END: Top Menu -->
    <!-- BEGIN: Content -->
    <div
      :class="[
        'relative',
        'before:content-[\'\'] before:w-[95%] before:z-[-1] before:rounded-[1.3rem] before:bg-transparent xl:before:bg-white/10 before:h-full before:-mt-4 before:absolute before:mx-auto before:inset-x-0 before:dark:bg-darkmode-400/50',

        // Animation
        'before:translate-y-[35px] before:opacity-0 before:animate-[0.4s_ease-in-out_0.1s_intro-wrapper] before:animate-fill-mode-forwards',
      ]"
    >
      <div
        :class="[
          'translate-y-0 bg-transparent xl:bg-primary flex rounded-[1.3rem] md:pt-[80px] -mt-[7px] md:-mt-[67px] xl:-mt-[62px] dark:bg-transparent xl:dark:bg-darkmode-400',
          'before:hidden xl:before:block before:absolute before:inset-0 before:bg-black/[0.15] before:rounded-[1.3rem] before:z-[-1]',

          // Animation
          'animate-[0.4s_ease-in-out_0.2s_intro-wrapper] animate-fill-mode-forwards translate-y-[35px]',
        ]"
      >
        <!-- BEGIN: Content -->
        <div
          class="px-4 md:px-[22px] max-w-full md:max-w-auto rounded-[1.3rem] flex-1 min-w-0 min-h-screen pb-10 shadow-sm bg-slate-100 dark:bg-darkmode-700 before:content-[''] before:w-full before:h-px before:block"
        >
          <RouterView />
        </div>
        <!-- END: Content -->
      </div>
    </div>
    <!-- END: Content -->
  </div>
</template>
