<script setup>
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import Button from "@/base-components/Button";
import BaseCard from "@/base-components/Card/BaseCard.vue";

const emit =defineEmits(['close'])
const props = defineProps({
  show:{
    type:Boolean,
    default:false
  },
  currentUser:{
    type:Object,
  },
})
function close(){
  emit('close')
}
</script>

<template>
  <section>
    <BaseDialog
        :size="'lg'"
        staticBackdrop
        :open="show"
        :has-footer="true"
        :title="$t('title.user-roles')"
        @close="close"
    >


      <div class="grid grid-cols-2 gap-4 p-3 gap-y-3">
      <div
          class="w-full "
          v-for="(section,key) in currentUser.roles"
          :key="key"
      >
        <h3 class="mb-2 pb-1 border-b">
          {{$t(`title.${key}`)}}
        </h3>
        <div class="flex gap-2 flex-wrap">
          <Button size="sm"
                      class="btn-outline"
                      v-for="role in section"
                      :key="role.id"
          >
            {{ role.title }}
          </Button>
        </div>
      </div>
      </div>
      <template v-slot:footer>
        <div class="flex col-md-12 items-end justify-end gap-2">
          <Button variant="outline-secondary" @click="close" size="sm" class=" shadow-md justify-end items-end">
            {{ $t('button.close') }}
          </Button>
        </div>
      </template>
    </BaseDialog>
  </section>
</template>

<style scoped>

</style>