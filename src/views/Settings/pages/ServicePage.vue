<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
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
      <div class="section-actions">
        <v-btn size="small" variant="flat" color="primary" prepend-icon="plus" class="text-none">Add Template</v-btn>
      </div>
      <div class="stack">
        <div v-for="t in replyTemplates" :key="t.id" class="template-card">
          <div class="template-card__copy">
            <div class="template-card__name">{{ t.name }}</div>
            <div class="template-card__preview">{{ t.preview }}</div>
          </div>
          <div class="template-card__actions">
            <v-btn icon="pencil" variant="text" size="small" aria-label="Edit template" />
            <v-btn icon="trash-2" variant="text" size="small" color="error" aria-label="Delete template" />
          </div>
        </div>
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
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: color-mix(in oklch, var(--surface-secondary) 34%, transparent);
}

.toggle-row__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.toggle-row__sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}

.section-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: color-mix(in oklch, var(--surface-secondary) 34%, transparent);
}

.template-card__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.template-card__preview {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-card__actions {
  display: inline-flex;
  gap: 4px;
}

@media (max-width: 640px) {
  .toggle-row,
  .template-card {
    align-items: flex-start;
  }

  .template-card {
    flex-direction: column;
  }

  .template-card__preview {
    max-width: none;
    white-space: normal;
  }

  .template-card__actions {
    align-self: flex-end;
  }
}
</style>
