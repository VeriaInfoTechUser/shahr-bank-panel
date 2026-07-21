<script setup>
import Button from "@/base-components/Button";
import Lucide from "@/base-components/Lucide";
import { computed, onMounted, ref } from "vue";
import Vue3Datatable from "@bhplugin/vue3-datatable";
import "@bhplugin/vue3-datatable/dist/style.css";
import { useRoute, useRouter } from "vue-router";
import { userRepo } from "@/core/repositories/userRepo";
import { useApiState } from "@/core/composables/useApiState";
import "vue-awesome-paginate/dist/style.css";
import BasePagination from "@/base-components/Table/BasePagination.vue";
import FilterUserDialog from "./FilterUserDialog.vue";
import UserRolesDialog from "./UserRolesDialog.vue";
import ConfirmationDialog from "@/base-components/Dialog/ConfirmationDialog.vue";
import EditUserDialog from "./EditUserDialog.vue";
import EditUserPasswordDialog from "./EditUserPasswordDialog.vue";
import AddUserDialog from "./AddUserDialog.vue";

const route = useRoute()
const router = useRouter()
const filterData = ref({
  name: null,
  email: null,
  status: null,
})
const tempFilterData =  {
  name: null,
  email: null,
  status: null,
}
const requestFilterData = {
  name: null,
  email: null,
  status: null,
}
const user = ref({})
const userList = ref([])
const dataLoadingFlag = ref(true)
const cols = ref([
  {field: "counter", title: "#"},
  {field: "identity", title: 'identity'},
  {field: "name", title: 'name'},
  {field: "email", title: "Email"},
  {field: "mobile", title: "Mobile"},
  {field: "status", title: "Status"},
  {field: "roles", title: "Roles"},
  {field: "time_created_view", title: "Time Create"},
  {field: "action", title: "Action"},
]);
const pageOptions = ref({
  count: 1,
  limit: 25,
  page: 1
})
const defaultPageOption = ref({
  count: 1,
  limit: 25,
  page: 1
})

const rolesListLoadingFlag = ref([])
const userDialogPreviewFlag = ref(false)
const { handle: handleApi, loading: userListLoading, error: userListError } = useApiState();
const filterUserDialogPreviewFlag = ref(false)
const roleList = ref([])

onMounted(async () => {
  await fetchUserList();
  await fetchRolesList();

});

function setUserDialogPreviewFlag(value) {
  userDialogPreviewFlag.value = value;
}

function setFilterUserDialogPreviewFlag(value) {
  filterUserDialogPreviewFlag.value = value;
}

function removeFilter() {
  Object.assign(filterData.value, tempFilterData);
  Object.assign(pageOptions.value, defaultPageOption.value);
  fetchUserList()
}

async function fetchUserList() {
  userList.value = [];
  setFilterUserDialogPreviewFlag(false);
  setUserDialogPreviewFlag(false);
  Object.assign(requestFilterData, filterData.value);
  requestFilterData.status = filterData.value.status ? filterData.value.status.value : [0, 1];

  try {
    const result = await handleApi(() =>
      userRepo.list({ ...pageOptions.value, ...requestFilterData })
    );
    if (result?.data?.list) {
      userList.value = result.data.list;
      pageOptions.value = result.data.paginator;
    }
  } catch {
    // Error logged and toasted by http interceptor; userListError holds normalized error for UI
  }
}

async function fetchRolesList() {
  try {
    rolesListLoadingFlag.value = true;
    const result = await userRepo.getRoles();
    if (result?.result && result?.data?.list) {
      roleList.value = result.data.list;
    }
  } catch (err) {
    console.error('Error fetching roles:', err);
  } finally {
    rolesListLoadingFlag.value = false;
  }
}

function showUserRolesDialog(user) {
  Object.assign(currentUser.value, user);
  setShowUserRolesDialogFlag(true)
}

function setShowUserRolesDialogFlag(value) {
  showUserRolesDialogFlag.value = value
}

function showEditUserDialog(user) {
  Object.assign(currentUser.value, user);
  if (roleList.value.length > 0) {
    const userRoles = currentUser.value.roles
    currentUser.value.roles = roleList.value.filter(item => {
      const roles = userRoles[item.section] || [];
      return roles.some(role => role.role === item.name);
    })
  } else {
    currentUser.value.roles = [];
  }
  setShowEditDialogFlag(true)
}

function setShowEditDialogFlag(value) {
  showEditUserDialogFlag.value = value
}

function cancelEditUser() {
  Object.assign(currentUser.value, defaultUser);
  setShowEditDialogFlag(false)
}

function showEditUserPasswordDialog(user) {
  Object.assign(currentUser.value, user);
  setShowEditUserPasswordDialogFlag(true)
}

function setShowEditUserPasswordDialogFlag(value) {
  showEditUserPasswordDialogFlag.value = value
}

function cancelEditUserPassword() {
  Object.assign(currentUser.value, defaultUser);
  setShowEditUserPasswordDialogFlag(false)
}

function confirmChangeUserStatus(user) {
  Object.assign(currentUser.value, user);
  setShowUserChangeStatusDialogFlag(true)
}

function setShowUserChangeStatusDialogFlag(value) {
  showUserChangeStatusDialogFlag.value = value
}

function changeUserStatus() {
  currentUser.value.status = 1 - currentUser.value.status
  changeStatusUserRequest(currentUser.value);
}

async function changeStatusUserRequest(user) {
  if (user == null) {
    cancelChangeUserStatus();
    return;
  }
  setShowUserChangeStatusDialogFlag(false);
  dataLoadingFlag.value = true;
  try {
    await userRepo.setStatus(user.id, user.status);
    await fetchUserList();
  } catch (err) {
    console.error('Error changing user status:', err);
  } finally {
    dataLoadingFlag.value = false;
  }
}
function cancelChangeUserStatus() {
  Object.assign(currentUser.value, defaultUser);
  setShowUserChangeStatusDialogFlag(false)
}

function confirmDeleteUser(user) {
  Object.assign(currentUser.value, user);
  setShowDeleteUserDialogFlag(true)
}

function setShowDeleteUserDialogFlag(value) {
  showDeleteUserDialogFlag.value = value
}

function deleteUser() {
  deleteUserRequest(currentUser.value);
}

async function deleteUserRequest(user) {
  if (user == null) {
    cancelDeleteUser();
    return;
  }
  setShowDeleteUserDialogFlag(false);
  dataLoadingFlag.value = true;
  try {
    await userRepo.deleteUser(user.id);
    await fetchUserList();
  } catch (err) {
    console.error('Error deleting user:', err);
  } finally {
    dataLoadingFlag.value = false;
  }
}

function cancelDeleteUser() {
  Object.assign(currentUser.value, defaultUser);
  setShowDeleteUserDialogFlag(false)
}



function showAddUserDialog(user) {
  setShowAddDialogFlag(true)
}

function setShowAddDialogFlag(value) {
  showAddUserDialogFlag.value = value
}

function cancelAddUser() {
  setShowAddDialogFlag(false)
}



const showEditUserPasswordDialogFlag = ref(false)
const showAddUserDialogFlag = ref(false)
const showEditUserDialogFlag = ref(false)
const showDeleteUserDialogFlag = ref(false)
const showUserChangeStatusDialogFlag = ref(false)
const showUserRolesDialogFlag = ref(false)
const currentUser = ref({})
const defaultUser = {
  "first_name": null,
  "last_name": null,
  "email": null,
  "mobile": null,
  "password": null,
  "roles": null,
}
const newUser = ref({
  "first_name": null,
  "last_name": null,
  "email": null,
  "mobile": null,
  "password": null,
  "roles": null,
})

</script>

<template>
  <section>

    <div v-if="showDeleteUserDialogFlag">
      <ConfirmationDialog
          :close="cancelDeleteUser"
          :show="showDeleteUserDialogFlag"
          :accept="deleteUser"
          :deny="cancelDeleteUser"
      >
        {{ $t('message.are-you-sure-change-status') }} {{ currentUser.name ?? '' }}
      </ConfirmationDialog>
    </div>

    <div v-if="showUserChangeStatusDialogFlag">
      <ConfirmationDialog
          :close="cancelChangeUserStatus"
          :show="showUserChangeStatusDialogFlag"
          :accept="changeUserStatus"
          :deny="cancelChangeUserStatus"
      >
        {{ $t('message.are-you-sure-change-status') }} {{ currentUser.name ?? '' }}
      </ConfirmationDialog>
    </div>

    <div v-if="showAddUserDialogFlag">
      <AddUserDialog
          @close="cancelAddUser"
          :roles-list="roleList"
          :show="showAddUserDialogFlag"
          @onSuccess="removeFilter"
      />
    </div>


    <div v-if="showEditUserDialogFlag">
      <EditUserDialog
          @close="cancelEditUser"
          :data="currentUser"
          :roles-list="roleList"
          :show="showEditUserDialogFlag"
          @onSuccess="fetchUserList"
      />
    </div>

    <div v-if="showEditUserPasswordDialogFlag">
      <EditUserPasswordDialog
          @close="cancelEditUserPassword"
          :data="currentUser"
          :show="showEditUserPasswordDialogFlag"
          @onSuccess="fetchUserList"
      />
    </div>

    <div v-if="showUserRolesDialogFlag">
      <UserRolesDialog
          @close="setShowUserRolesDialogFlag(false)"
          :current-user="currentUser"
          :show="showUserRolesDialogFlag"
      />
    </div>

    <div v-if="filterUserDialogPreviewFlag">
      <FilterUserDialog
          @close="setFilterUserDialogPreviewFlag(false)"
          @filter="fetchUserList"
          @removeFilter="removeFilter"
          :filterData="filterData"
          :show="filterUserDialogPreviewFlag"
      />
    </div>

    <div class="grid grid-cols-12 gap-6 mt-8">
      <div class="col-span-12 lg:col-span-12 2xl:col-span-12">

        <!-- BEGIN: Inbox Filter -->
        <div class="flex flex-col-reverse items-center intro-y sm:flex-row">
          <div class="relative w-full mt-3 mr-auto sm:w-auto sm:mt-0">

          </div>
          <div class="flex w-full sm:w-auto gap-2">

          </div>
        </div>
        <!-- END: Inbox Filter -->

        <!-- BEGIN: Inbox Content -->
        <div class="mt-5 intro-y box">
          <div v-if="userListError" class="p-4 mb-4 rounded bg-danger/10 border border-danger/30 text-danger text-sm">
            {{ userListError.message }}
          </div>
          <div
              class="flex p-5 border-b sm:flex-row text-slate-500 border-slate-200/60 text-end w-full justify-end items-end"
          >
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="fetchUserList">
              <Lucide icon="RefreshCw" class="w-6 h-6"/>
            </div>
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="setFilterUserDialogPreviewFlag(true)">
              <Lucide icon="Search" class="w-6 h-6"/>
            </div>
            <div class="w-5 h-5 ms-5 cursor-pointer" @click="showAddUserDialog">
              <Lucide icon="PlusCircle" class="w-6 h-6"/>
            </div>
          </div>
          <div class="mb-5 relative">
          </div>

          <div class="mb-5 relative">
          </div>

          <vue3-datatable
              :columns="cols"
              :rows="userList"
              :loading="userListLoading"
              :totalRows="pageOptions.count"
              :isServerMode="true"
              :pageSize="pageOptions.limit"
              :pagination="false"
              :sortable="false"
              class="advanced-table whitespace-nowrap px-4"
          >
            <!-- Empty header slot to remove the header -->
            <template #header>
              <!-- No content here will hide the header -->
            </template>
            <!-- Empty footer slot to remove the footer -->
            <template #footer>
              <!-- No content here will hide the footer -->
            </template>

            <template #counter="data,key">
              <strong class="text-info">{{
                  (userList.indexOf(data.value) + 1) + ((pageOptions.page - 1) * pageOptions.limit)
                }}</strong>
            </template>

            <template #status="data">
              <Button :variant="data.value.status?'outline-success':'outline-dark'" size="sm"
                      @click="confirmChangeUserStatus(data.value)"
                      class="inline-block w-16 mb-2 mr-1">
                {{ data.value.status ? $t('button.active') : $t('button.inactive') }}
              </Button>
            </template>


            <template #roles="data">
              <Button variant="outline-dark" size="sm"
                      @click="showUserRolesDialog(data.value)"
                      class="inline-block mb-2 mr-1">

                <Lucide icon="FolderOpen" class="w-4 h-4"/>
              </Button>
            </template>

            <template #action="data">
              <div
                  class="flex items-center gap-2 justify-center"
              >
                <Button variant="outline-primary" size="sm" @click="showEditUserDialog(data.value)">
                  <Lucide icon="Edit" class="w-4 h-4"/>
                </Button>
                <Button variant="outline-dark" size="sm" @click="showEditUserPasswordDialog(data.value)">
                  <Lucide icon="Lock" class="w-4 h-4"/>
                </Button>
                <Button variant="outline-danger" size="sm"
                        @click="confirmDeleteUser(data.value)"
                >
                  <Lucide icon="Trash2" class="w-4 h-4"/>
                </Button>
              </div>
            </template>


          </vue3-datatable>

          <div
              class="flex flex-col items-center p-5 text-center sm:flex-row sm:text-left text-slate-500"
          >
            <div>

              <BasePagination
                  v-if="pageOptions.count>pageOptions.limit"
                  :page-options="pageOptions"
                  @page-change="fetchUserList"
              />

            </div>
            <div class="mt-2 sm:ml-auto sm:mt-0">

            </div>
          </div>
        </div>
        <!-- END: Inbox Content -->
      </div>
    </div>
  </section>
</template>
