<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpTagChip from '@/components/MpTagChip.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import { useTicketsStore } from '@/stores/useTickets'
import { isDuplicateName, TAG_COLORS, TAG_COLOR_LABELS, type TagColor, type TicketTag } from '@/service/model'

const toast = useToast()
const settings = useServiceSettingsStore()
const tickets = useTicketsStore()

const ticketCount = (name: string) => tickets.visibleTickets.filter(t => t.tags.includes(name)).length
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const rows = computed(() =>
  settings.tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    tickets: ticketCount(tag.name),
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  })),
)

const search = ref('')
const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row => row.name.toLowerCase().includes(q) || TAG_COLOR_LABELS[row.color].toLowerCase().includes(q))
})

const headers = [
  { title: 'Tag', key: 'name' },
  { title: 'Tickets', key: 'tickets', align: 'end' as const },
  { title: 'Created', key: 'createdAt', hideBelow: 'md' as const },
  { title: 'Updated', key: 'updatedAt', hideBelow: 'sm' as const },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, headerProps: { class: 'mp-th-sr' } },
]
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(headers, hiddenColumns)

// ── Create / edit dialog (UAT edits tags in a dialog, not a drawer) ─────────
interface TagForm {
  name: string
  color: TagColor
}
const blankForm = (): TagForm => ({ name: '', color: TAG_COLORS[0] })
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref<TagForm>(blankForm())
const pristine = ref('')

const isDirty = computed(() => JSON.stringify(form.value) !== pristine.value)
const nameDuplicate = computed(() => isDuplicateName(settings.tags, form.value.name, editingId.value ?? undefined))
const nameError = computed(() => (nameDuplicate.value ? 'A tag with this name already exists.' : ''))
const canSave = computed(() => !!form.value.name.trim() && !nameDuplicate.value)

function openDialog(next: TagForm, id: string | null) {
  editingId.value = id
  form.value = next
  pristine.value = JSON.stringify(next)
  dialogOpen.value = true
}

function openCreate() {
  openDialog(blankForm(), null)
}

function openEdit(id: string) {
  const tag = settings.tags.find(t => t.id === id)
  if (tag) openDialog({ name: tag.name, color: tag.color }, tag.id)
}

function save() {
  if (!canSave.value) return
  const payload = { name: form.value.name.trim(), color: form.value.color }
  if (editingId.value) {
    settings.updateTag(editingId.value, payload)
    toast.success(`“${payload.name}” saved`)
  } else {
    settings.createTag(payload)
    toast.success(`“${payload.name}” created`)
  }
  dialogOpen.value = false
}

const confirmDiscard = ref(false)
function requestClose() {
  if (isDirty.value) confirmDiscard.value = true
  else dialogOpen.value = false
}

// ── Colour swatches: one radio group, roving tabindex, arrows move the choice ─
// The --tag-<hue>-* aliases (mp-theme-aliases.css) already flip with the theme.
function swatchStyle(color: TagColor) {
  return {
    '--swatch-fill': `var(--tag-${color}-container)`,
    '--swatch-ink': `var(--tag-${color}-on-container)`,
  }
}

const swatchEls: (HTMLButtonElement | null)[] = []
const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

function onSwatchKeydown(event: KeyboardEvent, index: number) {
  const n = TAG_COLORS.length
  let next: number
  if (event.key in STEP) next = (index + (STEP[event.key] ?? 0) + n) % n
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = n - 1
  else return
  event.preventDefault()
  form.value.color = TAG_COLORS[next] ?? form.value.color
  swatchEls[next]?.focus()
}

// ── Delete ──────────────────────────────────────────────────────────────────
const deleteTarget = ref<TicketTag | null>(null)
const confirmDelete = computed({
  get: () => deleteTarget.value !== null,
  set: open => { if (!open) deleteTarget.value = null },
})

const deleteConsequences = computed(() => {
  const count = deleteTarget.value ? ticketCount(deleteTarget.value.name) : 0
  return count ? [`Removed from ${plural(count, 'ticket')} and from any saved views that filter on it`] : []
})

function performDelete() {
  const tag = deleteTarget.value
  if (!tag) return
  settings.deleteTag(tag.id)
  toast.success(`“${tag.name}” deleted`)
  deleteTarget.value = null
}
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <MpPageHeader
      :level="2"
      density="compact"
      title="Tags"
      subtitle="Colour-coded labels agents add to tickets. The colour shows beside the ticket subject."
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">
          New tag
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        search-placeholder="Search tags"
        :headers="headers"
        :total-count="filteredRows.length"
      />

      <v-data-table
        :headers="visibleHeaders"
        :items="filteredRows"
        item-value="id"
        density="comfortable"
        :items-per-page="10"
        hover
        aria-label="Tags"
      >
        <template #item.name="{ item }">
          <button type="button" class="tag-edit" :aria-label="item.name" @click="openEdit(item.id)">
            <MpTagChip :name="item.name" :color="item.color" size="sm" />
          </button>
        </template>

        <template #item.tickets="{ item }">
          <span class="num">{{ item.tickets }}</span>
        </template>

        <template #item.createdAt="{ item }">
          <span class="text-no-wrap">{{ shortDate(item.createdAt) }}</span>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-no-wrap">{{ shortDate(item.updatedAt) }}</span>
        </template>

        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Tag actions" :itemLabel="item.name">
              <MpMenuItem title="Edit" icon="pencil" @click="openEdit(item.id)" />
              <v-divider class="my-1" />
              <MpMenuItem
                title="Delete"
                icon="trash-2"
                danger
                @click="deleteTarget = settings.tags.find(t => t.id === item.id) ?? null"
              />
            </MpRowActionsMenu>
          </div>
        </template>

        <template #no-data>
          <MpEmptyState
            v-if="search.trim()"
            icon="search"
            :heading-level="3"
            :title="`No tags match “${search.trim()}”`"
            description="Try a different tag name."
            action-label="Clear search"
            @action="search = ''"
          />
          <MpEmptyState
            v-else
            icon="tag"
            :heading-level="3"
            title="No tags yet"
            description="Create tags like VIP or Refund so agents can spot and group tickets at a glance."
            action-label="New tag"
            action-icon="plus"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpDialog
      v-model="dialogOpen"
      :title="editingId ? 'Edit tag' : 'New tag'"
      subtitle="Tags help agents find and group tickets."
      size="sm"
      guarded
      @close="requestClose"
    >
      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Name *"
          placeholder="e.g. VIP"
          :error-messages="nameError"
        />

        <MpFormField v-slot="{ labelId }" label="Colour">
          <div class="tag-swatches" role="radiogroup" :aria-labelledby="labelId">
            <button
              v-for="(color, i) in TAG_COLORS"
              :key="color"
              :ref="el => { swatchEls[i] = el as HTMLButtonElement | null }"
              type="button"
              role="radio"
              class="tag-swatch"
              :class="{ 'tag-swatch--on': color === form.color }"
              :style="swatchStyle(color)"
              :aria-checked="color === form.color"
              :aria-label="TAG_COLOR_LABELS[color]"
              :tabindex="color === form.color ? 0 : -1"
              @click="form.color = color"
              @keydown="onSwatchKeydown($event, i)"
            >
              <v-icon v-if="color === form.color" size="small">check</v-icon>
            </button>
          </div>
        </MpFormField>

        <MpFormField label="Preview">
          <div class="d-flex">
            <MpTagChip :name="form.name.trim() || 'Tag name'" :color="form.color" />
          </div>
        </MpFormField>
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestClose">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">
          {{ editingId ? 'Save' : 'Create tag' }}
        </v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="confirmDiscard"
      title="Discard changes?"
      message="This tag has unsaved changes. Closing now will discard them."
      confirm-label="Discard"
      danger
      @confirm="dialogOpen = false"
    />

    <MpConfirmDialog
      v-model="confirmDelete"
      danger
      :title="`Delete ${deleteTarget?.name ?? 'tag'}?`"
      :message="`Agents can no longer add ${deleteTarget?.name ?? 'this tag'} to tickets. This cannot be undone.`"
      :consequences="deleteConsequences"
      confirm-label="Delete tag"
      @confirm="performDelete"
    />
  </div>
</template>

<style scoped>
/* The chip is the name; the button around it takes the global focus ring. */
.tag-edit {
  display: inline-flex;
  max-width: 100%;
  padding: 0;
  border-radius: var(--mp-component-chip-radius);
  cursor: pointer;
}

.tag-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-12);
}

/* Each swatch is a tag in miniature: the soft fill, ringed and checked in its own ink. */
.tag-swatch {
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--swatch-ink);
  border-radius: var(--mp-radius-full);
  background: var(--swatch-fill);
  color: var(--swatch-ink);
  cursor: pointer;
}
.tag-swatch--on {
  box-shadow: 0 0 0 var(--mp-space-2) var(--surface-primary), 0 0 0 var(--mp-space-4) var(--text-primary);
}
.tag-swatch:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: var(--mp-space-6);
}
</style>
