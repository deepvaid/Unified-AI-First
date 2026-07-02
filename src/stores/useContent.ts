import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ContentItem {
  id: number
  name: string
  type: 'Drag & Drop' | 'HTML Builder'
  lastUpdated: string
  folderId: string | null
}

export const useContentStore = defineStore('content', () => {
  const items = ref<ContentItem[]>([
    { id: 1, name: 'Newsletter Template 2026', type: 'HTML Builder', lastUpdated: '2 hours ago', folderId: 'cnt-templates' },
    { id: 2, name: 'Welcome Email V2', type: 'Drag & Drop', lastUpdated: 'Yesterday', folderId: 'cnt-automation' },
    { id: 3, name: 'Holiday Promo Master', type: 'Drag & Drop', lastUpdated: '3 days ago', folderId: 'cnt-holiday' },
    { id: 4, name: 'Order Confirmation — Storefront', type: 'Drag & Drop', lastUpdated: '4 days ago', folderId: 'cnt-templates' },
    { id: 5, name: 'Abandoned Cart Reminder', type: 'Drag & Drop', lastUpdated: 'Last week', folderId: 'cnt-automation' },
    { id: 6, name: 'Gift Guide — Holiday 2026', type: 'HTML Builder', lastUpdated: 'Last week', folderId: 'cnt-holiday' },
    { id: 7, name: 'Flash Sale Announcement', type: 'Drag & Drop', lastUpdated: '2 weeks ago', folderId: 'cnt-campaigns' },
    { id: 8, name: 'Product Launch Teaser', type: 'Drag & Drop', lastUpdated: '3 weeks ago', folderId: 'cnt-campaigns' },
    { id: 9, name: 'Blank Canvas Starter', type: 'HTML Builder', lastUpdated: 'Last month', folderId: null },
  ])

  function moveToFolder(id: number, folderId: string | null) {
    const item = items.value.find(i => i.id === id)
    if (item) item.folderId = folderId
  }

  function cloneContent(id: number) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    items.value.unshift({
      ...item,
      id: Math.max(...items.value.map(i => i.id)) + 1,
      name: `${item.name} (Copy)`,
      lastUpdated: 'Just now',
    })
  }

  /** Nulls folderId on items whose folder was deleted. */
  function reassignFolder(folderId: string) {
    for (const item of items.value) {
      if (item.folderId === folderId) item.folderId = null
    }
  }

  return { items, moveToFolder, cloneContent, reassignFolder }
})
