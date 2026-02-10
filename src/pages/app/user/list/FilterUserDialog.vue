<script setup>
import BaseDialog from "@/base-components/Dialog/BaseDialog.vue";
import {FormInput, FormLabel} from "@/base-components/Form";
import { statusList} from "@/utils/variables";
import BaseInputSelect from "@/base-components/Form/BaseInputSelect.vue";
import Button from "@/base-components/Button";

const emit =defineEmits(['close','filter','removeFilter'])
const props = defineProps({
  show:{
    type:Boolean,
    default:false
  },
  filterData:{
    type:Object,
  },
  isFilterLoading:{
    type:Boolean,
    default:false
  }
})

function close(){
  emit('close')
}
function filter(){
  emit('filter')
}
function removeFilter(){
  emit('removeFilter')
}

</script>

<template>
  <section>
    <BaseDialog
        :size="'lg'"
        staticBackdrop
        :open="show"
        :has-footer="true"
        :title="$t('title.filter-user')"
        @close="close"
    >
      <div class="grid grid-cols-12 gap-4 p-3 gap-y-3">


        <div class="col-span-12 lg:col-span-6 md:col-span-6 xl:col-span-6">
          <FormLabel htmlFor="input-filter-3" class="text-xs">
            {{$t('title.name')}}
          </FormLabel>
          <FormInput
              id="input-filter-3"
              type="text"
              class="flex-1"
              v-model="filterData.name"
          />
        </div>

        <div class="col-span-12 lg:col-span-6 md:col-span-6 xl:col-span-6">
          <FormLabel htmlFor="input-filter-3" class="text-xs">
            {{$t('title.email')}}
          </FormLabel>
          <FormInput
              id="input-filter-3"
              type="text"
              class="flex-1"
              v-model="filterData.email"
          />
        </div>
        <div class="col-span-12">
          <FormLabel htmlFor="input-filter-2" class="text-xs">
            {{ $t('title.status') }}
          </FormLabel>
            <BaseInputSelect
                class="primary"
                v-model="filterData.status"
                name="value"
                deselect-label=""
                :is-multiple="false"
                track-by="value"
                label="label"
                :options="statusList??[]"
                :searchable="false"
                :allow-empty="false"
                :is-preselect-first="false"
            >
            </BaseInputSelect>
        </div>
      </div>
      <template v-slot:footer>
        <FreeStyleShimmer class="py-3" height="10px" width="100%" v-if="isFilterLoading"/>
        <div class="flex col-md-12 items-end justify-end gap-2" v-else>
          <Button variant="outline-secondary" @click="close" size="sm" class=" shadow-md justify-end items-end">
            {{ $t('button.cancel') }}
          </Button>
          <Button variant="outline-primary" @click="removeFilter" size="sm" class="shadow-md justify-end items-end">
            {{ $t('button.remove-filter') }}
          </Button>
          <Button variant="primary" size="sm" @click="filter" class="shadow-md justify-end items-end">
            {{ $t('button.filter') }}
          </Button>
        </div>
      </template>
    </BaseDialog>
  </section>
</template>

<style scoped>

</style>