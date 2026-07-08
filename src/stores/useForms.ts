import { defineStore } from 'pinia'
import { ref } from 'vue'

export type FormType = 'Modal' | 'Embedded'
export type FormStatus = 'Active' | 'Draft' | 'Paused'

export interface AcquisitionForm {
  id: number
  name: string
  type: FormType
  status: FormStatus
  views: number
  conversions: number
  rate: number
  updated: string
  // Mini-preview content
  headline: string
  buttonLabel: string
  collectName: boolean
  accent: 'primary' | 'success' | 'warning' | 'secondary' | 'info' | 'error'
}

export const useFormsStore = defineStore('forms', () => {
  const forms = ref<AcquisitionForm[]>([
    { id: 1, name: 'Main Website Pop-up', type: 'Modal', status: 'Active', views: 45000, conversions: 1200, rate: 2.7, updated: 'Mar 5, 2026', headline: 'Get 10% off your first order', buttonLabel: 'Claim my discount', collectName: false, accent: 'primary' },
    { id: 2, name: 'Blog Sidebar Form', type: 'Embedded', status: 'Active', views: 85000, conversions: 350, rate: 0.4, updated: 'Feb 28, 2026', headline: 'Subscribe to our newsletter', buttonLabel: 'Subscribe', collectName: false, accent: 'info' },
    { id: 3, name: 'Exit Intent 2026', type: 'Modal', status: 'Draft', views: 12000, conversions: 45, rate: 0.4, updated: 'Mar 1, 2026', headline: "Wait — don't leave empty-handed", buttonLabel: 'Reveal my offer', collectName: false, accent: 'warning' },
    { id: 4, name: 'Holiday VIP Sign-up', type: 'Modal', status: 'Draft', views: 0, conversions: 0, rate: 0, updated: 'Mar 7, 2026', headline: 'Join the VIP list', buttonLabel: 'Count me in', collectName: true, accent: 'secondary' },
    { id: 5, name: 'Footer Newsletter', type: 'Embedded', status: 'Paused', views: 32000, conversions: 880, rate: 2.8, updated: 'Jan 15, 2026', headline: 'Stay in the loop', buttonLabel: 'Sign up', collectName: false, accent: 'success' },
  ])

  function nextId() {
    return Math.max(0, ...forms.value.map(f => f.id)) + 1
  }

  function duplicate(id: number) {
    const f = forms.value.find(x => x.id === id)
    if (!f) return
    forms.value.unshift({ ...f, id: nextId(), name: `${f.name} (Copy)`, status: 'Draft', views: 0, conversions: 0, rate: 0, updated: 'Just now' })
  }

  function remove(ids: number[]) {
    forms.value = forms.value.filter(f => !ids.includes(f.id))
  }

  function setStatus(ids: number[], status: FormStatus) {
    for (const f of forms.value) if (ids.includes(f.id)) f.status = status
  }

  return { forms, duplicate, remove, setStatus }
})
