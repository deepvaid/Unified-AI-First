import { defineStore } from 'pinia'
import { ref } from 'vue'

export type FolderScope =
  | 'campaigns'
  | 'contents'
  | 'images'
  | 'forms'
  | 'landing_pages'
  | 'content_templates'
  | 'content_feeds'
  | 'image_groups'

/** Owner-only, or visible to everyone on the account. Only the owner can change this. */
export type FolderPrivacy = 'private' | 'shared'

export interface Folder {
  id: string
  name: string
  parentId: string | null
  scope: FolderScope
  /** Display name of whoever created it. Governs which row actions are available. */
  owner: string
  privacy: FolderPrivacy
}

/** The signed-in user, for the ownership checks the source models. */
export const CURRENT_USER = 'Deepak Vaidya'

/** The source caps folder names at 36 characters. */
export const FOLDER_NAME_MAX = 36

let seq = 100
function nextId(scope: FolderScope) {
  return `${scope}-${seq++}`
}

/** Seeds a folder owned by someone else, so the shared-folder permission states are reachable. */
function shared(
  id: string,
  name: string,
  scope: FolderScope,
  owner: string,
  parentId: string | null = null,
): Folder {
  return { id, name, parentId, scope, owner, privacy: 'shared' }
}

/** Seeds a folder owned by the signed-in user. */
function mine(
  id: string,
  name: string,
  scope: FolderScope,
  parentId: string | null = null,
  privacy: FolderPrivacy = 'shared',
): Folder {
  return { id, name, parentId, scope, owner: CURRENT_USER, privacy }
}

export const useFoldersStore = defineStore('folders', () => {
  const folders = ref<Folder[]>([
    // Campaigns
    mine('cmp-promotions', 'Promotions', 'campaigns'),
    mine('cmp-seasonal', 'Seasonal', 'campaigns'),
    mine('cmp-black-friday', 'Black Friday', 'campaigns', 'cmp-seasonal'),
    mine('cmp-announcements', 'Announcements', 'campaigns'),
    mine('cmp-automated', 'Automated', 'campaigns'),
    mine('cmp-newsletter', 'Newsletter', 'campaigns'),
    mine('cmp-transactional', 'Transactional', 'campaigns'),
    // Contents
    mine('cnt-templates', 'Templates', 'contents'),
    mine('cnt-campaigns', 'Campaigns', 'contents'),
    mine('cnt-holiday', 'Holiday 2026', 'contents', 'cnt-campaigns'),
    mine('cnt-automation', 'Automation', 'contents'),
    shared('cnt-brendan', 'Brendan', 'contents', 'Brendan Fox'),
    shared('cnt-harpreet', 'Harpreet_QA', 'contents', 'Harpreet Singh'),
    shared('cnt-sonakshi', 'Sonakshi', 'contents', 'Sonakshi Rao'),
    // Images
    mine('img-banners', 'Banners', 'images'),
    mine('img-products', 'Products', 'images'),
    mine('img-lifestyle', 'Lifestyle Shots', 'images', 'img-products'),
    mine('img-logos', 'Logos', 'images'),
    // Acquisition forms
    mine('frm-welcome', 'Welcome & Onboarding', 'forms'),
    mine('frm-promotions', 'Promotions', 'forms'),
    mine('frm-archive', 'Archived Experiments', 'forms', null, 'private'),
    shared('frm-harpreet', 'Harpreet_QA', 'forms', 'Harpreet Singh'),
    shared('frm-manny', 'Manny', 'forms', 'Manny Ortega'),
    // Landing pages
    mine('lp-campaigns', 'Campaign Pages', 'landing_pages'),
    mine('lp-evergreen', 'Evergreen', 'landing_pages'),
    shared('lp-harpreet', 'Harpreet_QA Landing pages', 'landing_pages', 'Harpreet Singh'),
    shared('lp-manny', 'Manny', 'landing_pages', 'Manny Ortega'),
    // Content feeds
    mine('cfd-commerce', 'Commerce Feeds', 'content_feeds'),
    mine('cfd-editorial', 'Editorial', 'content_feeds'),
    // Optimise-on-Open image groups
    mine('iog-seasonal', 'Seasonal Swaps', 'image_groups'),
    shared('iog-harpreet', 'Harpreet_QA', 'image_groups', 'Harpreet Singh'),
    // Saved content templates (the gallery's own folder scope)
    mine('ctpl-brand', 'Brand Templates', 'content_templates'),
    mine('ctpl-seasonal', 'Seasonal Templates', 'content_templates'),
    shared('ctpl-yash', 'yash', 'content_templates', 'Yash Patel'),
  ])

  /** A folder you don't own can be renamed, but only its owner may delete it. */
  function canDelete(folder: Folder | undefined): boolean {
    return !!folder && folder.owner === CURRENT_USER
  }

  /** Only the folder owner can set permissions for other users. */
  function canSetPrivacy(folder: Folder | undefined): boolean {
    return !!folder && folder.owner === CURRENT_USER
  }

  function setPrivacy(id: string, privacy: FolderPrivacy) {
    const folder = folders.value.find(f => f.id === id)
    if (folder && canSetPrivacy(folder)) folder.privacy = privacy
  }

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
      name: name.slice(0, FOLDER_NAME_MAX),
      parentId: parent && !parent.parentId ? parent.id : null,
      scope,
      owner: CURRENT_USER,
      privacy: 'shared',
    }
    folders.value.push(folder)
    return folder
  }

  function renameFolder(id: string, name: string) {
    const folder = getFolder(id)
    if (folder) folder.name = name.slice(0, FOLDER_NAME_MAX)
  }

  /** Deletes a folder; its children are promoted to top level. */
  function deleteFolder(id: string) {
    if (!canDelete(getFolder(id))) return
    for (const child of childrenOf(id)) child.parentId = null
    folders.value = folders.value.filter(f => f.id !== id)
  }

  return {
    folders,
    foldersByScope,
    childrenOf,
    getFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    canDelete,
    canSetPrivacy,
    setPrivacy,
  }
})
