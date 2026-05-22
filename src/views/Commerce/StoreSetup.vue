<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'

const channels = [
  { name: 'Online Storefront', type: 'Owned Main', status: 'Connected' },
  { name: 'Point of Sale (POS)', type: 'Retail', status: 'Connected' },
  { name: 'Amazon Channel', type: 'Marketplace', status: 'Pending Auth' },
  { name: 'Facebook Shop', type: 'Social Commerce', status: 'Disconnected' },
]

const statusColor = (s: string) => s === 'Connected' ? 'success' : s.includes('Pending') ? 'warning' : 'error'
const channelIcon = (type: string) => type === 'Retail' ? 'store' : type === 'Marketplace' ? 'shopping-cart' : 'globe'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Sales Channels"
      :subtitle="`${channels.filter(c => c.status === 'Connected').length} channels connected`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Add Channel</v-btn>
      </template>
    </MpPageHeader>

    <v-row>
      <v-col cols="12" md="6" lg="3" v-for="channel in channels" :key="channel.name">
        <v-card variant="flat" border rounded="lg">
          <v-card-text class="text-center py-6">
            <v-avatar color="primary" variant="tonal" size="56" class="mb-4">
              <v-icon size="28">{{ channelIcon(channel.type) }}</v-icon>
            </v-avatar>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ channel.name }}</h3>
            <p class="text-medium-emphasis text-body-2 mb-4">{{ channel.type }}</p>
            <v-chip :color="statusColor(channel.status)" size="small" variant="tonal">
              {{ channel.status }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
