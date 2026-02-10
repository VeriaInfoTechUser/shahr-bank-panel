import { defineStore } from "pinia";
import { ref } from "vue";
import {
  eraseCookie,
  getCookie,
  getCurrentUser,
  setCookie,
  setCurrentUser
} from "../utils/cookie.ts";
import { authRepo } from "@/core/repositories/authRepo";
import { userRepo } from "@/core/repositories/userRepo";
import { notificationRepo } from "@/core/repositories/notificationRepo";

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(getCurrentUser());
  const loginError = ref();
  const showLog = ref(false);
  const updateError = ref();
  const processing = ref(false);
  const updateProcessing = ref(false);
  const resetPasswordSuccess = ref();
  const notificationCount = ref({ count: null, unread: null });

  function generateTokenPayload(expiryDurationInSeconds = 3600) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiryDurationInSeconds;
    return { iat, exp };
  }

  function setUser(payload) {
    const { exp: expiration } = payload.token_payload ?? generateTokenPayload();
    setCookie('utn', payload.access_token, expiration);
    setCurrentUser(payload);
    currentUser.value = payload;
    loginError.value = null;
  }

  function setLogout() {
    currentUser.value = null;
    loginError.value = null;
    eraseCookie('utn');
    eraseCookie('uName');
    eraseCookie('uEmail');
    setCurrentUser(null);
  }

  async function signOut() {
    try {
      await authRepo.logout(true);
    } catch {
      //
    }
    setLogout();
  }

  function setNotificationCount(payload) {
    notificationCount.value = payload;
  }

  async function requestNotificationCount() {
    try {
      const result = await notificationRepo.getCount();
      if (result?.data) {
        setNotificationCount(result.data);
      }
    } catch {
      //
    }
  }

  function setUpdateProcessing(payload) {
    updateProcessing.value = payload;
    updateError.value = null;
  }

  async function tryUpdateProfile(payload) {
    setUpdateProcessing(true);
    await updateProfileData(payload);
  }

  async function updateProfileData(payload) {
    clearUpdateError();
    setUpdateProcessing(true);
    try {
      const result = await userRepo.updateProfile(payload);
      if (result?.result) {
        await updateProfileState();
      } else {
        setUpdateProcessing(false);
      }
    } catch {
      setUpdateProcessing(false);
    }
  }

  async function updateProfileState() {
    try {
      const result = await userRepo.getProfile();
      if (result?.result && result?.data) {
        Object.keys(result.data).forEach(key => {
          currentUser.value[key] = result.data[key];
        });
        setCurrentUser(currentUser.value);
      } else {
        setUpdateError("Error");
      }
    } catch {
      setUpdateError("Error");
    }
    setUpdateProcessing(false);
  }

  function clearUpdateError() {
    updateError.value = null;
  }

  function setUpdateError(payload) {
    updateError.value = payload;
    currentUser.value = null;
    processing.value = false;
  }

  async function tryUpdatePassword(payload) {
    setUpdateProcessing(true);
    await updatePasswordData(payload);
  }

  async function updatePasswordData(payload) {
    clearUpdateError();
    setUpdateProcessing(true);
    try {
      const result = await userRepo.updatePassword(payload);
      if (result?.result) {
        await updateProfileState();
      } else {
        setUpdateProcessing(false);
      }
    } catch {
      setUpdateProcessing(false);
    }
  }

  async function trySetPassword(payload) {
    setUpdateProcessing(true);
    await setPasswordData(payload);
  }

  async function setPasswordData(payload) {
    clearUpdateError();
    setUpdateProcessing(true);
    try {
      const result = await userRepo.addPassword(payload);
      if (result?.result) {
        await updateProfileState();
      } else {
        setUpdateProcessing(false);
      }
    } catch {
      setUpdateProcessing(false);
    }
  }

  function setShowLog(payload) {
    showLog.value = payload;
  }

  return {
    signOut,
    currentUser,
    loginError,
    setUser,
    requestNotificationCount,
    setShowLog,
    showLog,
    processing,
    resetPasswordSuccess,
    notificationCount,
    tryUpdateProfile,
    tryUpdatePassword,
    updateProfileState,
    trySetPassword,
    updateError,
    updateProcessing,
  };
});
