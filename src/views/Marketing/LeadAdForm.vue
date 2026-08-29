<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useSocialLeadsStore, LEAD_CONTACT_LISTS, FACEBOOK_PAGES } from '@/stores/useSocialLeads'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * New / Edit Meta lead ad. Rebuilt from UAT `/social_leads/new` and
 * `/social_leads/:id/edit` — one single-page form serving both, exactly as the
 * source does. See docs/rebuild/social-leads/.
 */
const store = useSocialLeadsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const editingId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => editingId.value !== null)
const record = computed(() => (editingId.value !== null ? store.getLeadAd(editingId.value) : undefined))

const listPath = computed(() => `/accounts/${accountId.value}/lead_ads`)

const form = ref({
  name: '',
  pageId: null as string | null,
  leadFormId: null as string | null,
  contactListIds: [] as string[],
})
const snapshot = ref('')
const saving = ref(false)
const submitted = ref(false)

function hydrate() {
  const source = record.value
  form.value = source
    ? {
        name: source.name,
        pageId: source.pageId,
        leadFormId: source.leadFormId,
        contactListIds: [...source.contactListIds],
      }
    : { name: '', pageId: null, leadFormId: null, contactListIds: [] }
  snapshot.value = JSON.stringify(form.value)
}
hydrate()
watch(record, hydrate)

// Re-pointing the Page invalidates the chosen form, which belongs to it.
watch(() => form.value.pageId, (next, prev) => {
  if (prev !== undefined && next !== prev) form.value.leadFormId = null
})

const pageOptions = computed(() =>
  FACEBOOK_PAGES.map(p => ({ value: p.id, title: p.name, connected: p.connected })),
)

const leadFormOptions = computed(() =>
  store.leadFormsForPage(form.value.pageId).map(f => ({
    value: f.id,
    title: f.name,
    // The source offers same-named forms with nothing to tell them apart.
    // Surfacing Meta's own creation date makes the choice decidable.
    subtitle: `Created ${new Date(f.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  })),
)

const listOptions = computed(() =>
  LEAD_CONTACT_LISTS.map(l => ({ value: l.id, title: `${l.name} (${l.count.toLocaleString()})` })),
)

// ── Validation ───────────────────────────────────────────────────────
// Messages appear only once a field has been touched or the form submitted —
// the source shows every "is required" line permanently, including against
// valid values on the edit form.
const touched = ref<Record<string, boolean>>({})
function touch(field: string) { touched.value[field] = true }
function show(field: string) { return submitted.value || touched.value[field] }

const nameError = computed(() =>
  show('name') && !form.value.name.trim() ? ['Give this lead ad a name so you can find it later.'] : [],
)
const pageError = computed(() =>
  show('pageId') && !form.value.pageId ? ['Choose the Facebook Page that runs the lead form.'] : [],
)
const leadFormError = computed(() =>
  show('leadFormId') && !form.value.leadFormId ? ['Choose which lead form on this Page to sync.'] : [],
)
const listsError = computed(() =>
  show('contactListIds') && !form.value.contactListIds.length
    ? ['Choose at least one contact list to receive the leads.']
    : [],
)

const valid = computed(() =>
  Boolean(form.value.name.trim() && form.value.pageId && form.value.leadFormId && form.value.contactListIds.length),
)

const dirty = computed(() => JSON.stringify(form.value) !== snapshot.value)

// ── Save / cancel ────────────────────────────────────────────────────
async function save() {
  submitted.value = true
  if (!valid.value || !form.value.pageId || !form.value.leadFormId) return
  saving.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  if (editingId.value !== null) {
    store.updateLeadAd(editingId.value, {
      name: form.value.name.trim(),
      pageId: form.value.pageId,
      leadFormId: form.value.leadFormId,
      contactListIds: [...form.value.contactListIds],
    })
    toast.success(`"${form.value.name.trim()}" updated`)
  } else {
    store.createLeadAd({
      name: form.value.name.trim(),
      pageId: form.value.pageId,
      leadFormId: form.value.leadFormId,
      contactListIds: [...form.value.contactListIds],
    })
    toast.success(`"${form.value.name.trim()}" created — switch it on to start syncing leads`)
  }
  snapshot.value = JSON.stringify(form.value)
  saving.value = false
  router.push(listPath.value)
}

const guard = ref(false)
const pendingLeave = ref<(() => void) | null>(null)

function cancel() {
  if (dirty.value) {
    pendingLeave.value = () => router.push(listPath.value)
    guard.value = true
  } else {
    router.push(listPath.value)
  }
}

// The source lets a filled form be destroyed by Cancel with no warning.
onBeforeRouteLeave((_to, _from, next) => {
  if (!dirty.value || saving.value) return next()
  pendingLeave.value = () => next()
  guard.value = true
  next(false)
})

function discard() {
  const leave = pendingLeave.value
  pendingLeave.value = null
  snapshot.value = JSON.stringify(form.value)
  leave?.()
}

const selectedPage = computed(() => FACEBOOK_PAGES.find(p => p.id === form.value.pageId))
</script>

<template>
  <div class="d-flex flex-column ga-5 la-form">
    <MpPageHeader
      :title="isEdit ? 'Edit lead ad' : 'New lead ad'"
      :subtitle="isEdit
        ? 'Update where this Meta lead form sends its leads'
        : 'Connect a Meta lead form to the contact lists that should receive its leads'"
      :back-to="listPath"
    />

    <!-- No connected Page means nothing on this form can be filled in. The source
         renders four dead dropdowns instead of saying so. -->
    <MpEmptyState
      v-if="!store.metaConnected"
      icon="plug"
      variant="launcher"
      emphasis="prominent"
      title="Connect Meta to create a lead ad"
      description="Lead ads sync leads from your Facebook Pages. Connect your Meta account under Apps to choose a Page and a lead form."
      action-label="Go to Apps"
      action-icon="arrow-right"
      @action="router.push(`/accounts/${accountId}/integrations`)"
    />

    <v-card v-else variant="flat" border rounded="lg" class="pa-6">
      <MpFormSection
        title="Lead ad name"
        description="How we'll refer to this lead ad inside Maropost."
        required
      >
        <MpFormGrid :cols="1">
          <v-text-field
            v-model="form.name"
            label="Lead ad name *"
            placeholder="Demo requests → sales follow-up"
            :maxlength="120"
            counter="120"
            :error-messages="nameError"
            @blur="touch('name')"
          />
        </MpFormGrid>
      </MpFormSection>

      <MpFormSection
        title="Facebook page"
        description="The Page that runs the lead form. Only Pages currently connected to the Maropost Meta app appear here."
        required
      >
        <MpFormGrid :cols="1">
          <v-autocomplete
            v-model="form.pageId"
            :items="pageOptions"
            label="Facebook page *"
            placeholder="Search your connected Pages"
            :error-messages="pageError"
            no-data-text="No connected Pages match that search."
            @blur="touch('pageId')"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :title="item.raw.title">
                <template #append>
                  <MpStatusChip status="Connected" type="general" size="sm" variant="tonal" />
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </MpFormGrid>
      </MpFormSection>

      <MpFormSection
        title="Lead form"
        description="The Meta instant form whose submissions should flow into Maropost."
        required
      >
        <MpFormGrid :cols="1">
          <v-autocomplete
            v-model="form.leadFormId"
            :items="leadFormOptions"
            label="Lead form *"
            :placeholder="form.pageId ? 'Search this Page\'s lead forms' : 'Choose a Facebook Page first'"
            :disabled="!form.pageId"
            :hint="form.pageId ? undefined : 'Lead forms belong to a Page — pick one above to see them.'"
            :persistent-hint="!form.pageId"
            :error-messages="leadFormError"
            :no-data-text="`${selectedPage?.name ?? 'This Page'} has no lead forms yet.`"
            @blur="touch('leadFormId')"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :title="item.raw.title" :subtitle="item.raw.subtitle" />
            </template>
          </v-autocomplete>
        </MpFormGrid>
      </MpFormSection>

      <MpFormSection
        title="Contact lists"
        description="Every lead this form captures is added to the lists you choose."
        required
      >
        <MpFormGrid :cols="1">
          <v-autocomplete
            v-model="form.contactListIds"
            :items="listOptions"
            label="Contact lists *"
            placeholder="Search your contact lists"
            multiple
            chips
            closable-chips
            clearable
            :error-messages="listsError"
            no-data-text="No contact list matches that search."
            @blur="touch('contactListIds')"
          />
        </MpFormGrid>
      </MpFormSection>

      <div class="d-flex justify-end ga-3 mt-2">
        <v-btn variant="text" class="text-none" :disabled="saving" @click="cancel">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          :loading="saving"
          :disabled="isEdit && !dirty"
          @click="save"
        >
          {{ isEdit ? 'Save changes' : 'Create lead ad' }}
        </v-btn>
      </div>
    </v-card>

    <MpConfirmDialog
      v-model="guard"
      title="Discard your changes?"
      message="This lead ad has unsaved changes. Leaving now discards them."
      confirm-label="Discard changes"
      danger
      @confirm="discard"
    />
  </div>
</template>

<style scoped>
.la-form {
  max-width: var(--mp-layout-contentMaxWidth);
}
</style>
