<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import {
  useTicketsStore,
  SUPPORT_INBOXES,
  TICKET_AGENTS,
  TICKET_CHANNELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TAGS,
  TICKET_TYPES,
  type TicketChannel,
  type TicketPriority,
  type TicketStatus,
} from '@/stores/useTickets'
import { useToast } from '@/composables/useToast'

const store = useTicketsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const accountId = computed(() => route.params.accountId as string)

const form = reactive({
  inbox: '',
  contact: '',
  type: '',
  channel: null as TicketChannel | null,
  status: 'New' as TicketStatus,
  priority: 'Low' as TicketPriority,
  assignee: '',
  tags: [] as string[],
  subject: '',
  description: '',
})
const attachments = ref<string[]>([])
let attachSeq = 1
function attachFile() {
  attachments.value.push(`attachment-${attachSeq++}.pdf`)
}

const contactOptions = computed(() =>
  [...new Set(store.tickets.map(t => `${t.customer} - ${t.customerEmail}`))],
)

// Required: who it's for, where it lives, what it says.
const canCreate = computed(() =>
  !!form.inbox && !!form.contact && !!form.subject.trim() && !!form.description.trim(),
)

function cancel() {
  router.push({ name: 'Tickets', params: { accountId: accountId.value } })
}

function create() {
  if (!canCreate.value) return
  const [customer = '', customerEmail = ''] = form.contact.split(' - ')
  const id = store.createTicket({
    inbox: form.inbox,
    customer,
    customerEmail,
    type: form.type,
    channel: form.channel ?? '',
    status: form.status,
    priority: form.priority,
    assignee: form.assignee,
    tags: form.tags,
    subject: form.subject.trim(),
    description: form.description.trim(),
  })
  toast.success(`Ticket #${id} created`)
  router.push({ name: 'Tickets', params: { accountId: accountId.value }, query: { selected: String(id) } })
}

function addNewContact() {
  router.push({ name: 'CreateContact', params: { accountId: accountId.value } })
}
</script>

<template>
  <div class="pa-6">
    <MpPageHeader
      :backTo="{ name: 'Tickets', params: { accountId } }"
      eyebrow="All Tickets"
      title="New Ticket"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="user-plus" @click="addNewContact">
          Add new contact
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="mt-4 pa-6" style="max-width: 960px;">
      <MpFormGrid :cols="2">
        <v-select v-model="form.inbox" :items="SUPPORT_INBOXES" label="Inbox *"></v-select>
        <v-select v-model="form.contact" :items="contactOptions" label="Contacts *"></v-select>
        <v-select v-model="form.type" :items="TICKET_TYPES" label="Type" clearable></v-select>
        <v-select v-model="form.channel" :items="TICKET_CHANNELS" label="Channel" clearable></v-select>
        <v-select v-model="form.status" :items="TICKET_STATUSES" label="Status"></v-select>
        <v-select v-model="form.priority" :items="TICKET_PRIORITIES" label="Priority"></v-select>
        <v-select v-model="form.assignee" :items="TICKET_AGENTS" label="Agent" clearable></v-select>
        <v-select v-model="form.tags" :items="TICKET_TAGS" label="Tags" multiple chips closable-chips></v-select>
        <v-text-field v-model="form.subject" label="Subject *" class="mp-form-grid__full"></v-text-field>
        <v-textarea
          v-model="form.description"
          label="Description *"
          rows="5"
          hint="Plain text — rich formatting isn't part of this prototype"
          class="mp-form-grid__full"
        ></v-textarea>
        <div class="mp-form-grid__full">
          <v-btn variant="outlined" class="text-none" prepend-icon="paperclip" @click="attachFile">
            Attach file
          </v-btn>
          <div v-if="attachments.length" class="d-flex flex-wrap ga-2 mt-2">
            <v-chip v-for="(file, i) in attachments" :key="file" size="small" closable
              prepend-icon="paperclip" @click:close="attachments.splice(i, 1)">{{ file }}</v-chip>
          </div>
        </div>
      </MpFormGrid>

      <v-divider class="my-6" />

      <div class="d-flex align-center ga-2">
        <v-btn variant="outlined" class="text-none" @click="cancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canCreate" @click="create">Create</v-btn>
      </div>
    </v-card>
  </div>
</template>
