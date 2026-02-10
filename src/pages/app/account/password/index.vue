<script setup>
import ProfileCard from "../ProfileCard.vue";
import {Form} from "vee-validate";
import {useUserStore} from "@/stores/user.js";
import {ref} from "vue";
import {storeToRefs} from "pinia";
import {object} from "yup";
import useValidate from "@/composables/useValidate.js";
import InputText from "@/base-components/Form/InputText.vue";
import {FormLabel} from "@/base-components/Form";
import Button from "@/base-components/Button";
import {useRoute} from "vue-router";
import {computed} from "vue";

const route = useRoute();
const currentTap = computed(() => route.path.split("/").reverse()[0] ?? '');

const userStore = useUserStore()
const user = userStore.currentUser
const userTemp = ref({});
const {updateProcessing} = storeToRefs(userStore);
const setPasswordSchemaValidation = object(
    useValidate(['password', 'verify_password']),
);
const updatePasswordSchemaValidation = object(
    useValidate(['current_password', 'password', 'verify_password']),
);
const isCurrentPassHidden = ref(true)
const isUpdatePassHidden = ref(true)
const isUpdatePassVerifyHidden = ref(true)
const updatePassword = ref(null)
const retypeUpdatePassword = ref(null)
const currentPassword = ref(null)

Object.assign(userTemp.value, user);
function cancel() {
  updatePassword.value = null
  retypeUpdatePassword.value = null
  currentPassword.value = null
}

function toggleCurrentPassVisibilityStatus() {
  isCurrentPassHidden.value = !isCurrentPassHidden.value
}

function toggleUpdatePassVisibilityStatus() {
  isUpdatePassHidden.value = !isUpdatePassHidden.value
}

function toggleUpdatePassVerifyVisibilityStatus() {
  isUpdatePassVerifyHidden.value = !isUpdatePassVerifyHidden.value;
}

function tryUpdatePassword() {
  if (userTemp.value.has_password) {
    userStore.tryUpdatePassword({
      current_credential: currentPassword.value,
      new_credential: updatePassword.value,
    });
  } else {
    userStore.trySetPassword({
      credential: updatePassword.value
    });
  }

}

</script>

<template>
  <section>
    <ProfileCard :currentTap="currentTap"/>
    <div class="min-h-[57vh] box p-4">
      <div class="  border-1 border-gray-200 max-w-[520px]">
        <Form :validation-schema="userTemp.has_password?updatePasswordSchemaValidation:setPasswordSchemaValidation"
              @submit="tryUpdatePassword">

          <div class="grid md:grid-cols-1 lg:grid-cols-1 grid-cols-1  ">
            <!--     for disable autocomplete     -->
            <input type="text" class="hidden"/>
            <!--     for disable autocomplete     -->
            <input type="password" class="hidden"/>
            <div class="pb-2 pt-6">
              <FormLabel htmlFor="input-wizard-3">
                {{ $t('label.current-password') }}
              </FormLabel>
              <InputText
                  v-if="userTemp.has_password"
                  class="flex-grow"
                  name="current_password"
                  :type="isCurrentPassHidden?'password':'string'"
                  v-model="currentPassword" />
            </div>
            <div class="py-2">
              <InputText
                  class="flex-grow"
                  name="password"
                  :type="isCurrentPassHidden?'password':'string'"
                  v-model="updatePassword"/>
            </div>
            <div class="py-2">
              <InputText class="flex-grow"
                         :label="$t('form.verify-new-password')"
                         name="verify_password"
                         :type="isUpdatePassVerifyHidden?'password':'string'"
                         v-model="retypeUpdatePassword" />
            </div>
          </div>
          <div class="py-[10px]" v-if="updateProcessing">
            <FreeStyleShimmer class="py-3" height="10px" width="100%" v-if="updateProcessing"/>
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