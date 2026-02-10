<script setup>
import {Form} from "vee-validate";
import {ref, computed} from "vue";
import {storeToRefs} from "pinia";
import {object} from "yup";
import useValidate from "@/composables/useValidate";
import ProfileCard from "@/pages/app/account/ProfileCard.vue";
import InputText from "@/base-components/Form/InputText.vue";
import Button from "@/base-components/Button";
import {useUserStore} from "@/stores/user";
import {FormLabel} from "@/base-components/Form";
import {useRoute} from "vue-router";

const route = useRoute();
const currentTap = computed(() => route.path.split("/").reverse()[0] ?? '');

const userStore = useUserStore()
const user = userStore.currentUser
const userTemp = ref({});
const {updateProcessing} = storeToRefs(userStore);
const updateValidation = object(
    useValidate(['first_name', 'last_name']),
);
Object.assign(userTemp.value, user);

function cancel() {
  Object.assign(userTemp.value, user);
}

function tryUpdateProfile() {
  userStore.tryUpdateProfile({
    first_name: userTemp.value.first_name,
    last_name: userTemp.value.last_name,
  });
}

</script>

<template>
  <section>
    <ProfileCard :currentTap="currentTap"/>
    <div class="min-h-[57vh] box p-4">
      <div class="  border-1 border-gray-200 max-w-[520px]">
        <Form :validation-schema="updateValidation" @submit="tryUpdateProfile">
          <div class="grid md:grid-cols-1 lg:grid-cols-1 grid-cols-1 gap-2">
            <div class="pb-2 pt-6">
              <InputText class="flex-grow"
                         :label="$t('form.first-name')"
                         name="first_name"
                         :has-default-error-message="true"
                         :is-disabled="updateProcessing"
                         v-model="userTemp.first_name"/>
            </div>
            <div class="py-2">
              <InputText class="flex-grow"
                         :label="$t('form.last-name')"
                         name="last_name"
                         :has-default-error-message="true"
                         :is-disabled="updateProcessing"
                         v-model="userTemp.last_name"/>
            </div>
          </div>
          <div class="py-[6px]" v-if="updateProcessing">
            <progress class="progress w-full progress-primary"></progress>
          </div>
          <div class="flex justify-end mt-3 gap-2" v-else>
            <Button variant="secondary" size="sm" class="py-1.5" @click="cancel" type="button">
              {{ $t('button.cancel') }}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {{ $t('button.update') }}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  </section>
</template>

<style scoped>

</style>