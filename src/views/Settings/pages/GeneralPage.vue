<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import { useUserProfile } from '@/stores/useUserProfile'
import { useToast } from '@/composables/useToast'

const toast = useToast()

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

function save() { toast.success('Profile saved') }
function discard() {}

function onFile(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  profileStore.setAvatar(URL.createObjectURL(file))
  target.value = ''
}
</script>

<template>
  <div class="settings-page mp-enter">
    <MpPageHeader :level="2" density="compact"
      eyebrow="Settings · Your preferences"
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
              size="small"
              density="compact"
              prepend-icon="upload"
              class="text-none"
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
      <MpFormGrid :cols="2">
        <v-text-field label="First Name" v-model="profile.firstName" />
        <v-text-field label="Last Name" v-model="profile.lastName" />
        <v-text-field label="Email" v-model="profile.email" />
        <v-text-field label="Phone" v-model="profile.phone" prepend-inner-icon="phone" />
        <v-select
          label="Timezone"
          v-model="profile.timezone"
          :items="['America/New_York','UTC','Europe/London','Asia/Tokyo']"
        />
        <v-select
          label="Preferred Language"
          v-model="profile.language"
          :items="['English (US)','French','Spanish','German']"
        />
      </MpFormGrid>
    </SettingsSection>

    <SettingsSection title="Change Password" description="Pick a strong password you don't use anywhere else.">
      <MpFormGrid :cols="2">
        <v-text-field label="Current Password" v-model="security.current" type="password" class="mp-form-grid__full" />
        <v-text-field label="New Password" v-model="security.next" type="password" />
        <v-text-field label="Confirm Password" v-model="security.confirm" type="password" />
      </MpFormGrid>
    </SettingsSection>

    <div class="settings-save-bar">
      <v-btn variant="text" class="text-none" @click="discard">Discard changes</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="save">Save changes</v-btn>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-image-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-14);
}

.profile-image-actions {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
}

.profile-image-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: var(--mp-fontWeight-bold);
  font-size: var(--mp-fontSize-18);
}

.profile-image-help {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
}
</style>
