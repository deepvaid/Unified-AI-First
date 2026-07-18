<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/useContent'
import { useSmsStore } from '@/stores/useSms'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'

const route = useRoute()
const router = useRouter()
const content = useContentStore()
const store = useSmsStore()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'TransactionalEmail', params: { accountId: accountId.value } }))

const editId = ref<number | null>(null)
const name = ref('')
const subject = ref('')
const fromName = ref('Maropost Store')
const fromEmail = ref('hello@maropoststore.com')
const replyTo = ref('support@maropoststore.com')
const language = ref('English (US)')
const contentId = ref<number | null>(null)
const showPreviewLink = ref(false)
const previewText = ref('')
const brand = ref('Maropost')
const tag = ref<string | null>(null)
const address = ref('100 King St, Sydney NSW 2000')
const saved = ref(false)

const LANGUAGES = ['English (US)', 'English (UK)', 'French', 'German', 'Spanish', 'Italian']
const BRAND_OPTIONS = ['Maropost', 'Storefront Co', 'Wholesale Division']
const TAG_OPTIONS = ['Transactional', 'Onboarding', 'Billing', 'Shipping']
const contentOptions = computed(() => content.items.map(i => ({ title: i.name, value: i.id })))

const canCreate = computed(() => name.value.trim() !== '' && subject.value.trim() !== '')

// ── Unsaved-changes guard ─────────────────────────────────────────────────────
function serializeForm() {
  return JSON.stringify([
    name.value, subject.value, previewText.value, fromName.value, fromEmail.value,
    replyTo.value, language.value, contentId.value, showPreviewLink.value,
    brand.value, tag.value, address.value,
  ])
}
const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave transactional email?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

function create() {
  if (!canCreate.value) return
  const input = {
    name: name.value.trim(),
    subject: subject.value.trim(),
    preheader: previewText.value,
    fromName: fromName.value,
    fromEmail: fromEmail.value,
    replyTo: replyTo.value,
    language: language.value,
    contentId: contentId.value,
    showPreviewLink: showPreviewLink.value,
    brand: brand.value,
    tag: tag.value ?? '',
    address: address.value,
  }
  if (editId.value != null) {
    store.updateTransactionalEmail(editId.value, input)
  } else {
    store.createTransactionalEmail(input)
  }
  savedSnapshot.value = serializeForm()
  saved.value = true
  allowNextLeave()
  setTimeout(() => router.push(backTo.value), 700)
}

onMounted(() => {
  const idParam = route.query.id
  if (!idParam) return
  const existing = store.getTransactionalEmail(Number(idParam))
  if (!existing) return
  editId.value = existing.id
  name.value = existing.name
  subject.value = existing.subject
  previewText.value = existing.preheader
  fromName.value = existing.fromName
  fromEmail.value = existing.fromEmail
  replyTo.value = existing.replyTo
  language.value = existing.language
  contentId.value = existing.contentId
  showPreviewLink.value = existing.showPreviewLink
  brand.value = existing.brand
  tag.value = existing.tag || null
  address.value = existing.address
  savedSnapshot.value = serializeForm()
})

const pageTitle = computed(() => (editId.value != null ? 'Edit Transactional Email' : 'New Transactional Email'))
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <div class="px-8 pt-6 pb-4 bg-surface page-head">
      <MpPageHeader :title="pageTitle" subtitle="Triggered emails like receipts, confirmations, and password resets" :back-to="backTo" />
    </div>

    <div class="flex-grow-1 overflow-y-auto px-8 py-6 bg-background">
      <div class="cte-grid mx-auto">
        <!-- Form -->
        <div class="d-flex flex-column gap-5">
          <v-card flat border rounded="lg" class="pa-6">
            <div class="d-flex align-center ga-2 mb-4">
              <v-icon size="18" class="text-medium-emphasis">info</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Details</span>
            </div>
            <v-text-field
              v-model="name"
              label="Transactional event name"
              placeholder="e.g. Order Confirmation"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              class="mb-4"
              :rules="[v => !!v || 'Name is required']"
            />
            <v-text-field
              v-model="subject"
              label="Subject line"
              placeholder="Your order is confirmed 🎉"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              class="mb-4"
              counter
            />
            <v-text-field
              v-model="previewText"
              label="Preview text"
              placeholder="Shown after the subject line in the inbox"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :counter="100"
              maxlength="100"
              hint="The snippet inboxes show right after the subject"
              persistent-hint
            />
          </v-card>

          <v-card flat border rounded="lg" class="pa-6">
            <div class="d-flex align-center ga-2 mb-4">
              <v-icon size="18" class="text-medium-emphasis">user</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Sender</span>
            </div>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model="fromName" label="From name" variant="outlined" density="comfortable" rounded="lg" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="fromEmail" label="From address" variant="outlined" density="comfortable" rounded="lg" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="replyTo" label="Reply-to address" variant="outlined" density="comfortable" rounded="lg" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="language" label="Language" :items="LANGUAGES" variant="outlined" density="comfortable" rounded="lg" hide-details />
              </v-col>
            </v-row>
          </v-card>

          <v-card flat border rounded="lg" class="pa-6">
            <div class="d-flex align-center ga-2 mb-4">
              <v-icon size="18" class="text-medium-emphasis">file-text</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Content</span>
            </div>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="contentId"
                  label="Content"
                  :items="contentOptions"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  placeholder="Choose a saved template"
                  hide-details
                  clearable
                />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-switch v-model="showPreviewLink" color="primary" density="compact" hide-details label="Show email preview link" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="brand" label="Brand" :items="BRAND_OPTIONS" variant="outlined" density="comfortable" rounded="lg" hide-details />
              </v-col>
              <v-col cols="12" md="6">
                <v-combobox v-model="tag" label="Campaign tag" :items="TAG_OPTIONS" variant="outlined" density="comfortable" rounded="lg" clearable hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="address" label="Address" variant="outlined" density="comfortable" rounded="lg" hide-details />
              </v-col>
            </v-row>
          </v-card>
        </div>

        <!-- Live inbox preview -->
        <aside class="cte-preview">
          <div class="cte-preview__sticky">
            <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Inbox preview</div>
            <div class="mail">
              <div class="mail__unread" />
              <div class="mail__avatar">{{ (fromName.trim()[0] || 'M').toUpperCase() }}</div>
              <div class="mail__body">
                <div class="mail__top">
                  <span class="mail__from text-truncate">{{ fromName.trim() || 'Sender name' }}</span>
                  <span class="mail__time">now</span>
                </div>
                <div class="mail__subject text-truncate">{{ subject.trim() || 'Subject line' }}</div>
                <div class="mail__preview text-truncate">{{ previewText.trim() || 'Preview text appears here after the subject.' }}</div>
              </div>
            </div>

            <div class="mailopen">
              <div class="mailopen__subject">{{ subject.trim() || 'Subject line' }}</div>
              <div class="mailopen__meta">{{ fromName.trim() || 'Sender name' }} &lt;{{ fromEmail.trim() || 'sender@store.com' }}&gt;</div>
              <div class="mailopen__body">
                <span style="width: 92%" /><span style="width: 80%" /><span style="width: 88%" /><span style="width: 60%" />
              </div>
            </div>

            <div class="cte-preview__note">
              <v-icon size="13">zap</v-icon>
              Triggers on: <strong>{{ name.trim() || 'your event' }}</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <div class="px-8 py-4 bg-surface page-foot d-flex justify-end ga-3">
      <v-btn variant="text" class="text-none" :to="backTo">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!canCreate" prepend-icon="check" @click="create">
        {{ editId != null ? 'Save changes' : 'Create transactional email' }}
      </v-btn>
    </div>

    <v-snackbar v-model="saved" color="success" timeout="700" location="bottom right">
      {{ editId != null ? 'Transactional email updated' : 'Transactional email created' }}
    </v-snackbar>
    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
  </div>
</template>

<style scoped>
.cte-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  max-width: 1040px;
  align-items: start;
}
@media (max-width: 900px) {
  .cte-grid { grid-template-columns: 1fr; }
  .cte-preview { display: none; }
}
.cte-preview__sticky { position: sticky; top: 0; }
.page-head { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.page-head :deep(.mp-page-header) { margin-bottom: 0; }
.page-foot { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

/* Inbox preview */
.mail {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 14px 14px 20px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 12px;
}
.mail__unread {
  position: absolute;
  left: 8px;
  top: 20px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
}
.mail__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
  font-size: 0.875rem;
}
.mail__body { min-width: 0; flex: 1 1 auto; }
.mail__top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.mail__from { font-weight: 700; font-size: 0.8125rem; }
.mail__time { font-size: 0.6875rem; color: rgba(var(--v-theme-on-surface), 0.5); flex-shrink: 0; }
.mail__subject { font-size: 0.8125rem; font-weight: 600; margin-top: 1px; }
.mail__preview { font-size: 0.75rem; color: rgba(var(--v-theme-on-surface), 0.55); margin-top: 1px; }

.mailopen {
  margin-top: 12px;
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 12px;
}
.mailopen__subject { font-size: 0.9375rem; font-weight: 700; line-height: 1.3; }
.mailopen__meta { font-size: 0.6875rem; color: rgba(var(--v-theme-on-surface), 0.55); margin-top: 4px; margin-bottom: 14px; }
.mailopen__body { display: flex; flex-direction: column; gap: 8px; }
.mailopen__body span {
  height: 8px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  display: block;
}
.cte-preview__note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.cte-preview__note :deep(.v-icon) { color: rgb(var(--v-theme-primary)); }
</style>
