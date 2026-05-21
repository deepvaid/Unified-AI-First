<script setup lang="ts">
import { ref } from 'vue'
import SettingsPageHeader from '@/components/settings/SettingsPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'

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

const profileAvatarUrl = 'https://maropost.com/hubfs/Maropost%20website/leadership/ross.png'
const profileInitials = 'RP'

const saved = ref(false)
function save() { saved.value = true }
function discard() { saved.value = false }
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="General"
      subtitle="Personal information and global preferences. These apply only to you."
    />

    <SettingsSection title="Profile Image">
      <div class="profile-image-row">
        <v-avatar size="64" color="primary">
          <v-img :src="profileAvatarUrl" alt="Profile photo" cover>
            <template #error>
              <div class="profile-image-fallback">{{ profileInitials }}</div>
            </template>
          </v-img>
        </v-avatar>
        <div>
          <v-btn variant="flat" color="primary" size="small" prepend-icon="camera" class="text-none mb-1">
            Change photo
          </v-btn>
          <div class="profile-image-help">JPG or PNG. Max 2MB.</div>
        </div>
      </div>
    </SettingsSection>

    <SettingsSection title="Personal Info">
      <div class="settings-grid">
        <div class="settings-field">
          <label class="settings-field__label">First Name</label>
          <v-text-field v-model="profile.firstName" variant="outlined" density="comfortable" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Last Name</label>
          <v-text-field v-model="profile.lastName" variant="outlined" density="comfortable" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Email</label>
          <v-text-field v-model="profile.email" variant="outlined" density="comfortable" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Phone</label>
          <v-text-field v-model="profile.phone" variant="outlined" density="comfortable" prepend-inner-icon="phone" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Timezone</label>
          <v-select
            v-model="profile.timezone"
            :items="['America/New_York','UTC','Europe/London','Asia/Tokyo']"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Preferred Language</label>
          <v-select
            v-model="profile.language"
            :items="['English (US)','French','Spanish','German']"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </div>
      </div>
    </SettingsSection>

    <SettingsSection title="Change Password" description="Pick a strong password you don't use anywhere else.">
      <div class="settings-grid settings-grid--thirds">
        <div class="settings-field">
          <label class="settings-field__label">Current Password</label>
          <v-text-field v-model="security.current" type="password" variant="outlined" density="comfortable" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">New Password</label>
          <v-text-field v-model="security.next" type="password" variant="outlined" density="comfortable" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Confirm Password</label>
          <v-text-field v-model="security.confirm" type="password" variant="outlined" density="comfortable" hide-details />
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
.settings-page {
  max-width: 880px;
  padding: 24px 32px 96px 0;
}

.profile-image-row {
  display: flex;
  align-items: center;
  gap: 18px;
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
  font-size: 22px;
}

.profile-image-help {
  font-size: 12px;
  color: var(--muted);
}

.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px 20px;
}

.settings-grid--thirds {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.settings-field__label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.settings-save-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 0 0;
  margin-top: 24px;
  background: linear-gradient(180deg, transparent 0, var(--surface-1) 24px);
}

@media (max-width: 720px) {
  .settings-grid,
  .settings-grid--thirds {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
