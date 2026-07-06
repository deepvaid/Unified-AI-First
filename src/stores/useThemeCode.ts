import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { themeCodeFiles, type ThemeCodeFile } from './themeCodeData'

/** Deep copy of the seed — the store owns an editable working set. */
function cloneFiles(files: ThemeCodeFile[]): ThemeCodeFile[] {
  return files.map((f) => ({ ...f }))
}

// Editable mock theme-code state. `files` is the live working copy; `savedContent`
// is the committed baseline per path. A file is dirty when its live content
// differs from its baseline. Deterministic, synchronous — no backend.
export const useThemeCodeStore = defineStore('themeCode', () => {
  const files = ref<ThemeCodeFile[]>(cloneFiles(themeCodeFiles))
  const savedContent = ref<Record<string, string>>(
    Object.fromEntries(themeCodeFiles.map((f) => [f.path, f.content])),
  )

  function getFile(path: string): ThemeCodeFile | undefined {
    return files.value.find((f) => f.path === path)
  }

  function isDirty(path: string): boolean {
    const file = getFile(path)
    if (!file) return false
    return file.content !== savedContent.value[path]
  }

  const anyDirty = computed(() => files.value.some((f) => f.content !== savedContent.value[f.path]))

  const dirtyPaths = computed(() =>
    files.value.filter((f) => f.content !== savedContent.value[f.path]).map((f) => f.path),
  )

  /** Update a file's live content (marks it dirty if it now differs from baseline). */
  function updateFile(path: string, content: string) {
    const file = getFile(path)
    if (file) file.content = content
  }

  /** Commit one file's live content to its baseline (clears its dirty flag). */
  function saveFile(path: string) {
    const file = getFile(path)
    if (file) savedContent.value[path] = file.content
  }

  /** Commit every file's live content to baseline (clears all dirty flags). */
  function saveAll() {
    for (const file of files.value) savedContent.value[file.path] = file.content
  }

  return { files, savedContent, getFile, isDirty, anyDirty, dirtyPaths, updateFile, saveFile, saveAll }
})
