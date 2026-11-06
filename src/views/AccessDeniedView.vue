<script setup lang="ts">
import { useRouter } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useAccountsStore } from '@/stores/useAccounts'
import { ACCESS_DENIED_COPY } from '@/stores/useRbac'

// The app-wide access-denied page: the standardized insufficient-permission state from the
// RBAC spec (docs/rbac/unified-rbac-ux-spec.md), as a full page. Same copy and lock icon as
// the Audit log's in-page version, so the two can't drift.
const router = useRouter()
const accounts = useAccountsStore()
</script>

<template>
  <MpEmptyState
    emphasis="prominent"
    icon="lock"
    :title="ACCESS_DENIED_COPY.title"
    :description="ACCESS_DENIED_COPY.description"
    action-label="Go to dashboard"
    action-icon="layout-dashboard"
    :heading-level="1"
    @action="router.push(`/accounts/${accounts.activeId}/dashboard`)"
  />
</template>
