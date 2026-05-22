<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'

const userName = 'Ross Andrew Paquette'
const userEmail = 'Ross@maropost.com'
const userRole = 'Super Admin'
const userInitials = 'RP'
const userAvatarUrl = 'https://maropost.com/hubfs/Maropost%20website/leadership/ross.png'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="My Profile"
      subtitle="Manage your personal information and preferences"
    />

    <v-row>
      <v-col cols="12" md="4">
        <v-card variant="flat" border rounded="lg" class="text-center py-6">
          <v-avatar size="120" color="primary" class="mb-4">
            <v-img :src="userAvatarUrl" :alt="userName" cover>
              <template #error>
                <span class="text-h3 text-white">{{ userInitials }}</span>
              </template>
            </v-img>
          </v-avatar>
          <div class="text-h5 font-weight-bold mb-1">{{ userName }}</div>
          <div class="text-medium-emphasis mb-4">{{ userRole }}</div>
          <v-btn variant="flat" class="text-none" color="surface">Change Avatar</v-btn>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card variant="flat" border rounded="lg">
          <v-card-text class="pa-5">
            <div class="text-subtitle-1 font-weight-bold mb-4">Personal Information</div>
            <v-text-field label="Full Name" variant="outlined" :model-value="userName" density="comfortable" class="mb-3" />
            <v-text-field label="Email Address" variant="outlined" :model-value="userEmail" density="comfortable" class="mb-3" />
            <v-text-field label="Phone Number" variant="outlined" density="comfortable" />
          </v-card-text>
          <v-card-actions class="px-5 pb-5 pt-0">
            <v-btn color="primary" variant="flat" class="text-none">Update Profile</v-btn>
            <v-spacer />
            <v-btn variant="text" class="text-none">Change Password</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
