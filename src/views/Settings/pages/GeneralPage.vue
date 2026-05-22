<script setup lang="ts">
import { ref } from 'vue'
import SettingsPageHeader from '@/components/settings/SettingsPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import { useUserProfile } from '@/stores/useUserProfile'

const profileStore = useUserProfile()
const fileInput = ref<HTMLInputElement | null>(null)

const profile = ref({
  firstName: 'Ross Andrew',
  lastName: 'Paquette',
  email: 'Ross@maropost.com',
  phone: '+1 (555) 000-0000',
  timezone: 'America/New_York',
  language: 'English (US)',
})

const security = ref({
  current: '',
  next: '',
  confirm: '',
})

const profileInitials = 'RP'

const saved = ref(false)
function save() { saved.value = true }
function discard() { saved.value = false }

function onFile(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  profileStore.setAvatar(URL.createObjectURL(file))
  target.value = ''
}
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="General"
      subtitle="Personal information and global preferences. These apply only to you."
    />

    <SettingsSection title="Profile Image">
      <div class="profile-image-row">
        <v-avatar size="52" color="primary">
          <v-img v-if="profileStore.hasAvatar" :src="profileStore.avatarUrl" alt="Profile photo" cover>
            <template #error>
              <div class="profile-image-fallback">{{ profileInitials }}</div>
            </template>
          </v-img>
          <div v-else class="profile-image-fallback">{{ profileInitials }}</div>
        </v-avatar>
        <div class="profile-image-actions">
          <div class="d-flex align-center gap-2">
            <v-btn
              variant="outlined"
              color="default"
              size="small"
              density="compact"
              prepend-icon="upload"
              class="text-none profile-image-upload-btn"
              @click="fileInput?.click()"
            >
              Upload photo
            </v-btn>
            <v-btn
              variant="text"
              size="small"
              density="compact"
              class="text-none text-medium-emphasis"
              :disabled="!profileStore.hasAvatar"
              @click="profileStore.clearAvatar()"
            >
              Remove
            </v-btn>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="d-none"
              @change="onFile"
            >
          </div>
          <div class="profile-image-help">JPG or PNG. Max 2MB.</div>
        </div>
      </div>
    </SettingsSection>

    <SettingsSection title="Personal Info">
      <div class="settings-grid">
        <div class="settings-field">
          <label class="settings-field__label">First Name</label>
          <v-text-field v-model="profile.firstName" variant="outlined" density="compact" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Last Name</label>
          <v-text-field v-model="profile.lastName" variant="outlined" density="compact" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Email</label>
          <v-text-field v-model="profile.email" variant="outlined" density="compact" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Phone</label>
          <v-text-field v-model="profile.phone" variant="outlined" density="compact" prepend-inner-icon="phone" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Timezone</label>
          <v-select
            v-model="profile.timezone"
            :items="['America/New_York','UTC','Europe/London','Asia/Tokyo']"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Preferred Language</label>
          <v-select
            v-model="profile.language"
            :items="['English (US)','French','Spanish','German']"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>
      </div>
    </SettingsSection>

    <SettingsSection title="Change Password" description="Pick a strong password you don't use anywhere else.">
      <div class="settings-grid settings-grid--thirds">
        <div class="settings-field">
          <label class="settings-field__label">Current Password</label>
          <v-text-field v-model="security.current" type="password" variant="outlined" density="compact" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">New Password</label>
          <v-text-field v-model="security.next" type="password" variant="outlined" density="compact" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Confirm Password</label>
          <v-text-field v-model="security.confirm" type="password" variant="outlined" density="compact" hide-details />
        </div>
      </div>
    </SettingsSection>

    <div class="settings-save-bar">
      <v-btn variant="text" class="text-none" @click="discard">Discard changes</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="save">Save changes</v-btn>
    </div>

    <v-snackbar v-model="saved" :timeout="2400" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon>Profile saved</div>
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.profile-image-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-image-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-image-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 700;
  font-size: 18px;
}

.profile-image-help {
  font-size: 11.5px;
  color: var(--muted);
}

.profile-image-upload-btn {
  border-color: var(--hairline) !important;
  color: var(--ink) !important;
}
</style>
