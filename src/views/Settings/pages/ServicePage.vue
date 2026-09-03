<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpListRow from '@/components/MpListRow.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const serviceSettings = ref({
  supportEmail: 'support@scootervillage.com',
  autoAssign: true,
  slaHours: 24,
  ticketPrefix: 'TKT-',
  defaultPriority: 'Normal',
  portalName: 'Scooter Village Help Center',
})

const replyTemplates = ref([
  { id: 1, name: 'Thank you for reaching out', preview: 'Hi {{first_name}}, Thank you for contacting us...' },
  { id: 2, name: 'Order tracking update',      preview: 'Hi {{first_name}}, Your order {{order_id}} is...' },
])

function save() { toast.success('Service settings saved') }
</script>

<template>
  <div class="settings-page">
    <MpPageHeader :level="2" density="compact"
      title="Service"
      subtitle="Helpdesk, SLA defaults, and reply templates for your support team."
    />

    <SettingsSection title="Support Channel">
      <MpFormGrid :cols="2">
        <v-text-field label="Support Email Address" v-model="serviceSettings.supportEmail" class="mp-form-grid__full" prepend-inner-icon="mail" />
        <v-text-field label="Ticket ID Prefix" v-model="serviceSettings.ticketPrefix" placeholder="TKT-" />
        <v-text-field label="Default SLA (hours)" v-model.number="serviceSettings.slaHours" type="number" />
        <v-select
          label="Default Priority"
          v-model="serviceSettings.defaultPriority"
          :items="['Low','Normal','High','Urgent']"
        />
        <v-text-field label="Support Portal Name" v-model="serviceSettings.portalName" />

        <div class="toggle-row mp-form-grid__full">
          <div>
            <div class="toggle-row__title">Auto-Assign Tickets</div>
            <div class="toggle-row__sub">Automatically assign new tickets to available agents.</div>
          </div>
          <!-- `hide-details` is deliberate here: the switch sits in a list row that
               carries its own title and description, so a details slot would only
               add empty height. -->
          <v-switch
            v-model="serviceSettings.autoAssign"
            hide-details
            inset
            aria-label="Toggle automatic ticket assignment"
          />
        </div>
      </MpFormGrid>
    </SettingsSection>

    <SettingsSection title="Reply Templates" description="Reusable snippets for fast, consistent responses.">
      <template #actions>
        <v-btn variant="outlined" prepend-icon="plus" class="text-none">Add Template</v-btn>
      </template>
      <div class="template-list">
        <MpListRow v-for="t in replyTemplates" :key="t.id" variant="divided">
          <span class="template-row__name">{{ t.name }}</span>
          <span class="template-row__preview">{{ t.preview }}</span>
          <template #trailing>
            <div class="template-row__actions">
              <v-tooltip text="Edit template" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn v-bind="tipProps" icon="pencil" variant="text" size="small" aria-label="Edit template" />
                </template>
              </v-tooltip>
              <v-tooltip text="Delete template" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn v-bind="tipProps" icon="trash-2" variant="text" size="small" color="error" aria-label="Delete template" />
                </template>
              </v-tooltip>
            </div>
          </template>
        </MpListRow>
      </div>
    </SettingsSection>

    <div class="settings-save-bar">
      <v-btn color="primary" variant="flat" class="text-none" @click="save">Save changes</v-btn>
    </div>
  </div>
</template>

<style scoped lang="scss">
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-16);
}

.toggle-row__title,
.template-row__name {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.toggle-row__sub,
.template-row__preview {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  margin-top: var(--mp-space-2);
}

.template-row__preview {
  max-width: var(--mp-component-state-measure);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-row__actions {
  display: inline-flex;
  gap: var(--mp-space-4);
}

@media (max-width: $mp-layout-breakpointCompact) {
  .toggle-row {
    align-items: flex-start;
  }

  .template-row__preview {
    max-width: none;
    white-space: normal;
  }
}
</style>
