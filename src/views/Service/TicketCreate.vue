<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpTagChip from '@/components/MpTagChip.vue'
import {
  useTicketsStore,
  TICKET_CHANNELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketChannel,
  type TicketPriority,
  type TicketStatus,
} from '@/stores/useTickets'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import { useCommerceStore } from '@/stores/useCommerce'
import { formatOrderDate, money, productsLabel } from '@/service/orderSummary'
import { useToast } from '@/composables/useToast'

const store = useTicketsStore()
const settings = useServiceSettingsStore()
const commerce = useCommerceStore()
const inboxOptions = computed(() => settings.inboxes.map(inbox => ({ title: inbox.name, value: inbox.id })))
const route = useRoute()
const router = useRouter()
const toast = useToast()
const accountId = computed(() => route.params.accountId as string)

const form = reactive({
  inboxId: '',
  contact: '',
  orderId: null as number | null,
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

// Spam senders are never offered as contacts.
const contactOptions = computed(() =>
  [...new Set(store.tickets.filter(t => t.folder !== 'spam').map(t => `${t.customer} - ${t.customerEmail}`))],
)

// The order the ticket is about: one of the chosen contact's Commerce orders.
// Optional, and only offered once there is a contact to look orders up for.
const contactEmail = computed(() => form.contact.split(' - ')[1] ?? '')
const contactOrders = computed(() => (contactEmail.value ? commerce.ordersForCustomer(contactEmail.value) : []))
const orderOptions = computed(() => contactOrders.value.map(order => ({
  value: order.id,
  title: `${order.orderNumber} · ${formatOrderDate(order.date)} · ${money(order.total)}`,
  props: { subtitle: `${order.status} · ${productsLabel(order)}` },
})))
const orderHint = computed(() => {
  if (!form.contact) return 'Choose a contact first'
  return contactOrders.value.length ? 'Optional. The order this ticket is about.' : 'No orders for this contact'
})
watch(() => form.contact, () => { form.orderId = null })

// Required: who it's for, where it lives, what it says.
const canCreate = computed(() =>
  !!form.inboxId && !!form.contact && !!form.subject.trim() && !!form.description.trim(),
)

function cancel() {
  router.push({ name: 'Tickets', params: { accountId: accountId.value } })
}

function create() {
  if (!canCreate.value) return
  const [customer = '', customerEmail = ''] = form.contact.split(' - ')
  const id = store.createTicket({
    inboxId: form.inboxId,
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
  const order = contactOrders.value.find(o => o.id === form.orderId)
  if (order) store.linkOrder(id, order)
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
        <v-select v-model="form.inboxId" :items="inboxOptions" label="Inbox *"></v-select>
        <v-select v-model="form.contact" :items="contactOptions" label="Contacts *"></v-select>
        <!-- Keyed by the contact: Vuetify's autocomplete keeps its typed text when
             the model is cleared from outside, so a new contact gets a fresh field. -->
        <v-autocomplete
          :key="form.contact"
          v-model="form.orderId"
          :items="orderOptions"
          label="Order"
          clearable
          :disabled="!contactOrders.length"
          :hint="orderHint"
          persistent-hint
        ></v-autocomplete>
        <v-select v-model="form.type" :items="settings.typeNames" label="Type" clearable></v-select>
        <v-select v-model="form.channel" :items="TICKET_CHANNELS" label="Channel" clearable></v-select>
        <v-select v-model="form.status" :items="TICKET_STATUSES" label="Status"></v-select>
        <v-select v-model="form.priority" :items="TICKET_PRIORITIES" label="Priority"></v-select>
        <v-select v-model="form.assignee" :items="settings.agentNames" label="Agent" clearable></v-select>
        <v-select v-model="form.tags" :items="settings.tagNames" label="Tags" multiple chips>
          <template #chip="{ item }">
            <span class="d-inline-flex" @mousedown.stop @click.stop>
              <MpTagChip :name="item.title" :color="settings.tagColor(item.title)" size="md" removable
                @remove="form.tags = form.tags.filter(tag => tag !== item.title)" />
            </span>
          </template>
        </v-select>
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
