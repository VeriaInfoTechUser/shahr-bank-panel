<script setup>
const props = defineProps({
  loading: {type: Boolean, default: true},
})
</script>

<template>
  <div>
    <div class="px-3 py-5 lg:py-0 md:py-0 xl:py-0 intro-y box" v-if="loading">
      <div class="flex-3 flex-col lg:flex-row border-slate-200/60">
        <div
            class="flex- px-3 pt-5 mt-6 border-t lg:my-0 md:my-0  xl:my-0 border-slate-200/60 lg:border-t-0 lg:py-0 md:py-0 xl:py-0">
          <div class="md:flex lg:flex xl:flex">
            <div class="flex-1 items-center px-3 justify-start">
              <div
                  class="relative flex-none w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 image-fit"
              >
                <div class="skeleton mt-2 h-28 w-28 rounded-full"></div>
              </div>
            </div>
            <div
                class="flex flex-col justify-center items-start "
            >
              <div class="flex items-center mt-3 truncate sm:whitespace-normal">
                <div class="min-w-20 me-1 text-sm truncate">
                  <div class="skeleton h-4 w-30"></div>
                </div>
              </div>
              <div class="flex items-center mt-3 truncate sm:whitespace-normal">
                <div class="min-w-20 me-1 text-sm truncate">
                  <div class="skeleton h-4 w-40"></div>
                </div>
              </div>
              <div class="flex items-center mt-3 truncate sm:whitespace-normal">
                <div class="min-w-20 me-1 text-sm  ">
                  <div class="skeleton h-4 w-28"></div>
                </div>
              </div>
            </div>
            <div class="relative w-full mt-10 bottom-0 items-end justify-items-center">
              <div class="absolute bottom-0 lg:end-0 flex gap-2">
                <div class="skeleton h-4 w-28"></div>
                <div class="skeleton h-4 w-28"></div>
                <div class="skeleton h-4 w-28"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>