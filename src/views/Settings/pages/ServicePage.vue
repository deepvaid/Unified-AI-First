<script setup lang="ts">
import { ref } from 'vue'
import SettingsPageHeader from '@/components/settings/SettingsPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'

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

const saved = ref(false)
function save() { saved.value = true }
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="Service"
      subtitle="Helpdesk, SLA defaults, and reply templates for your support team."
    />

    <SettingsSection title="Support Channel">
      <div class="settings-grid">
        <div class="settings-field settings-field--full">
          <label class="settings-field__label">Support Email Address</label>
          <v-text-field v-model="serviceSettings.supportEmail" variant="outlined" density="compact" prepend-inner-icon="mail" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Ticket ID Prefix</label>
          <v-text-field v-model="serviceSettings.ticketPrefix" variant="outlined" density="compact" placeholder="TKT-" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Default SLA (hours)</label>
          <v-text-field v-model.number="serviceSettings.slaHours" type="number" variant="outlined" density="compact" hide-details />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Default Priority</label>
          <v-select
            v-model="serviceSettings.defaultPriority"
            :items="['Low','Normal','High','Urgent']"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>
        <div class="settings-field">
          <label class="settings-field__label">Support Portal Name</label>
          <v-text-field v-model="serviceSettings.portalName" variant="outlined" density="compact" hide-details />
        </div>
      </div>

      <div class="toggle-row">
        <div>
          <div class="toggle-row__title">Auto-Assign Tickets</div>
          <div class="toggle-row__sub">Automatically assign new tickets to available agents.</div>
        </div>
        <v-switch
          v-model="serviceSettings.autoAssign"
          color="primary"
          hide-details
          density="compact"
          inset
          aria-label="Toggle automatic ticket assignment"
        />
      </div>
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

    <v-snackbar v-model="saved" :timeout="2400" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon>Service settings saved</div>
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.settings-grid {
  margin-bottom: 20px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: color-mix(in oklch, var(--surface-2) 34%, transparent);
}

.toggle-row__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
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
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: color-mix(in oklch, var(--surface-2) 34%, transparent);
}

.template-card__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
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
