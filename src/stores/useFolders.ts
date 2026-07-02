import { defineStore } from 'pinia'
import { ref } from 'vue'

export type FolderScope = 'campaigns' | 'contents' | 'images'

export interface Folder {
  id: string
  name: string
  parentId: string | null
  scope: FolderScope
}

let seq = 100
function nextId(scope: FolderScope) {
  return `${scope}-${seq++}`
}

export const useFoldersStore = defineStore('folders', () => {
  const folders = ref<Folder[]>([
    // Campaigns
    { id: 'cmp-promotions', name: 'Promotions', parentId: null, scope: 'campaigns' },
    { id: 'cmp-seasonal', name: 'Seasonal', parentId: null, scope: 'campaigns' },
    { id: 'cmp-black-friday', name: 'Black Friday', parentId: 'cmp-seasonal', scope: 'campaigns' },
    { id: 'cmp-announcements', name: 'Announcements', parentId: null, scope: 'campaigns' },
    { id: 'cmp-automated', name: 'Automated', parentId: null, scope: 'campaigns' },
    { id: 'cmp-newsletter', name: 'Newsletter', parentId: null, scope: 'campaigns' },
    { id: 'cmp-transactional', name: 'Transactional', parentId: null, scope: 'campaigns' },
    // Contents
    { id: 'cnt-templates', name: 'Templates', parentId: null, scope: 'contents' },
    { id: 'cnt-campaigns', name: 'Campaigns', parentId: null, scope: 'contents' },
    { id: 'cnt-holiday', name: 'Holiday 2026', parentId: 'cnt-campaigns', scope: 'contents' },
    { id: 'cnt-automation', name: 'Automation', parentId: null, scope: 'contents' },
    // Images
    { id: 'img-banners', name: 'Banners', parentId: null, scope: 'images' },
    { id: 'img-products', name: 'Products', parentId: null, scope: 'images' },
    { id: 'img-lifestyle', name: 'Lifestyle Shots', parentId: 'img-products', scope: 'images' },
    { id: 'img-logos', name: 'Logos', parentId: null, scope: 'images' },
  ])

  /** Flattened list for a scope: each top-level folder followed by its children. */
  function foldersByScope(scope: FolderScope): Folder[] {
    const scoped = folders.value.filter(f => f.scope === scope)
    const result: Folder[] = []
    for (const parent of scoped.filter(f => !f.parentId)) {
      result.push(parent)
      result.push(...scoped.filter(f => f.parentId === parent.id))
    }
    return result
  }

  function childrenOf(id: string): Folder[] {
    return folders.value.filter(f => f.parentId === id)
  }

  function getFolder(id: string | null): Folder | undefined {
    return id ? folders.value.find(f => f.id === id) : undefined
  }

  function createFolder(scope: FolderScope, name: string, parentId: string | null = null): Folder {
    // Only one level of nesting: a parent must itself be top-level
    const parent = getFolder(parentId)
    const folder: Folder = {
      id: nextId(scope),
      name,
      parentId: parent && !parent.parentId ? parent.id : null,
      scope,
    }
    folders.value.push(folder)
    return folder
  }

  function renameFolder(id: string, name: string) {
    const folder = getFolder(id)
    if (folder) folder.name = name
  }

  /** Deletes a folder; its children are promoted to top level. */
  function deleteFolder(id: string) {
    for (const child of childrenOf(id)) child.parentId = null
    folders.value = folders.value.filter(f => f.id !== id)
  }

  return { folders, foldersByScope, childrenOf, getFolder, createFolder, renameFolder, deleteFolder }
})
