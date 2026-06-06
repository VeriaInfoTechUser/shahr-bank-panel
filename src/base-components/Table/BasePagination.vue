<script setup>
import {computed,  ref} from 'vue';
import {VueAwesomePaginate} from "vue-awesome-paginate";

const props = defineProps({

  pageOptions:{
    type: Object,
  }

});

const emit = defineEmits(['page-change']);

function click(){
  emit('page-change')
}

</script>

<template>
  <!-- component -->
  <div >
    <vue-awesome-paginate
        :total-items="pageOptions.count"
        v-model="pageOptions.page"
        :items-per-page="pageOptions.limit"
        :show-jump-buttons="true"
        :max-pages-shown="5"
        @click="click"
    />
  </div>
</template>


<style scoped>
:deep(.paginate-buttons ) {
  @apply   h-8 w-8 rounded-full cursor-pointer bg-gray-200 border border-gray-300 text-black
}

:deep(.active-page) {
  @apply   bg-blue-500 border border-blue-500 text-white
}
:deep(.paginate-buttons:hover) {
  @apply   bg-gray-300
}
:deep(.pagination-container) {
  @apply   flex space-x-2.5
}

:deep(.active-page:hover) {
  @apply   bg-[#2988c8]
}

</style>