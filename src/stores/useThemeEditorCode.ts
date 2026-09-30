import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { buildLumosFiles, languageFor, type ThemeEditorFile } from './themeEditorLumosFiles'

// Editable theme-code state for the theme editor re-skin (docs/rebuild/theme-editor-reskin).
// `files` is the live working copy; `savedContent` the committed baseline per path — a file is
// dirty when the two differ. Deterministic and synchronous: no backend, one working set for
// the Lumos theme seed regardless of which theme id opened the editor.
export const useThemeEditorCodeStore = defineStore('themeEditorCode', () => {
  const files = ref<ThemeEditorFile[]>(buildLumosFiles())
  const savedContent = ref<Record<string, string>>(
    Object.fromEntries(files.value.map((file) => [file.path, file.content])),
  )

  function getFile(path: string): ThemeEditorFile | undefined {
    return files.value.find((file) => file.path === path)
  }

  function isDirty(path: string): boolean {
    const file = getFile(path)
    return !!file && file.content !== savedContent.value[path]
  }

  const dirtyPaths = computed(() =>
    files.value.filter((file) => file.content !== savedContent.value[file.path]).map((file) => file.path),
  )
  const anyDirty = computed(() => dirtyPaths.value.length > 0)

  function updateFile(path: string, content: string) {
    const file = getFile(path)
    if (file) file.content = content
  }

  function saveFile(path: string) {
    const file = getFile(path)
    if (file) savedContent.value[path] = file.content
  }

  function saveAll() {
    for (const file of files.value) savedContent.value[file.path] = file.content
  }

  /** Creates an empty file at `path` (baseline = empty, so it is not dirty). Returns false when the path is taken. */
  function createFile(path: string): boolean {
    if (getFile(path)) return false
    files.value.push({ path, language: languageFor(path), content: '' })
    savedContent.value[path] = ''
    return true
  }

  function renameFile(path: string, nextPath: string): boolean {
    const file = getFile(path)
    if (!file || getFile(nextPath)) return false
    const baseline = savedContent.value[path]
    delete savedContent.value[path]
    savedContent.value[nextPath] = baseline ?? file.content
    file.path = nextPath
    file.language = languageFor(nextPath)
    return true
  }

  function deleteFile(path: string) {
    const index = files.value.findIndex((file) => file.path === path)
    if (index === -1) return
    files.value.splice(index, 1)
    delete savedContent.value[path]
  }

  return {
    files,
    savedContent,
    getFile,
    isDirty,
    dirtyPaths,
    anyDirty,
    updateFile,
    saveFile,
    saveAll,
    createFile,
    renameFile,
    deleteFile,
  }
})
