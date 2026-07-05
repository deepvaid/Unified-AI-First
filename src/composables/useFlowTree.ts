// Pure helpers for journey flow graphs: flat FlowNode[] ⇄ render tree
// (segments with branch columns), edge-aware graph edits, and validation.
// Shared by JourneyBuilder, JourneyFlowColumn, and JourneyMiniPreview.

import type { CatalogItem, FlowNode } from '@/stores/journeyFlowData'
import { catalogByKind } from '@/stores/journeyFlowData'

export interface FlowBranch {
  label: string
  startId: string
  /** True when the branch has no steps of its own (dead-ends or joins immediately). */
  empty: boolean
  segments: FlowSegment[]
}

export interface FlowSegment {
  node: FlowNode
  /** Present on filter nodes: one entry per outgoing branch. */
  branches?: FlowBranch[]
  /** Present on filter nodes: the node id where branches rejoin, if they do. */
  joinId?: string
}

export interface FlowIssue {
  level: 'error' | 'warning'
  nodeId?: string
  message: string
}

const isFilter = (n: FlowNode) => n.category === 'filter'

function nodeById(nodes: FlowNode[], id: string): FlowNode | undefined {
  return nodes.find(n => n.id === id)
}

function branchCountOf(node: FlowNode): number {
  return node.branchLabels?.length ?? catalogByKind[node.kind]?.branchCount ?? 2
}

/** All node ids reachable from startId (inclusive), following every edge. */
function descendantIds(nodes: FlowNode[], startId: string): Set<string> {
  const seen = new Set<string>()
  const queue = [startId]
  while (queue.length) {
    const id = queue.shift()!
    if (!id || seen.has(id)) continue
    const n = nodeById(nodes, id)
    if (!n) continue
    seen.add(id)
    queue.push(...n.children.filter(c => c !== ''))
  }
  return seen
}

/** First node (in BFS order from the first branch) that every branch reaches. */
export function findJoin(nodes: FlowNode[], filterNode: FlowNode): string | undefined {
  const starts = filterNode.children.filter(c => c !== '')
  if (starts.length < 2) return undefined
  const otherSets = starts.slice(1).map(s => descendantIds(nodes, s))
  const seen = new Set<string>()
  const queue = [starts[0]]
  while (queue.length) {
    const id = queue.shift()!
    if (!id || seen.has(id)) continue
    seen.add(id)
    if (otherSets.every(set => set.has(id))) return id
    const n = nodeById(nodes, id)
    if (n) queue.push(...n.children.filter(c => c !== ''))
  }
  return undefined
}

/** Converts the flat node list into linear segments with nested branch columns. */
export function buildSegments(nodes: FlowNode[], startId?: string, stopId?: string): FlowSegment[] {
  const segments: FlowSegment[] = []
  let currentId = startId ?? nodes[0]?.id
  let guard = 0
  while (currentId && currentId !== stopId && guard++ < 500) {
    const node = nodeById(nodes, currentId)
    if (!node) break
    if (isFilter(node)) {
      const joinId = findJoin(nodes, node)
      const count = branchCountOf(node)
      const labels = node.branchLabels ?? catalogByKind[node.kind]?.branchLabels ?? []
      const branches: FlowBranch[] = Array.from({ length: count }, (_, i) => {
        const childId = node.children[i] ?? ''
        const empty = childId === '' || childId === joinId
        return {
          label: labels[i] ?? `BRANCH ${i + 1}`,
          startId: childId,
          empty,
          segments: empty ? [] : buildSegments(nodes, childId, joinId),
        }
      })
      segments.push({ node, branches, joinId })
      currentId = joinId ?? ''
    } else {
      segments.push({ node })
      currentId = node.children[0] ?? ''
    }
  }
  return segments
}

// ── Graph edits (mutate the passed array in place) ───────────────────────────

let idSeq = 0
function freshId(): string {
  return `n${Date.now().toString(36)}-${++idSeq}`
}

export function createNodeFromCatalog(item: CatalogItem): FlowNode {
  return {
    id: freshId(),
    kind: item.kind,
    category: item.category,
    title: item.title,
    subtitle: item.subtitle,
    icon: item.icon,
    branchLabels: item.branchLabels ? [...item.branchLabels] : undefined,
    children: [],
    config: {},
    configured: item.fields.length === 0,
  }
}

/**
 * Inserts a new node on the edge leaving `afterId` (for filter parents,
 * the edge of branch `childIndex`). Returns the new node.
 */
export function addNodeAfter(nodes: FlowNode[], afterId: string, item: CatalogItem, childIndex = 0): FlowNode {
  const parent = nodeById(nodes, afterId)
  const newNode = createNodeFromCatalog(item)
  const formerChild = parent
    ? (isFilter(parent) ? parent.children[childIndex] ?? '' : parent.children[0] ?? '')
    : ''

  if (item.branchCount) {
    // New filter: every branch converges on the former child (or dead-ends).
    newNode.children = Array.from({ length: item.branchCount }, () => formerChild)
  } else {
    newNode.children = formerChild ? [formerChild] : []
  }

  if (parent) {
    if (isFilter(parent)) {
      const count = branchCountOf(parent)
      while (parent.children.length < count) parent.children.push('')
      parent.children[childIndex] = newNode.id
    } else {
      parent.children = [newNode.id]
    }
  }
  nodes.push(newNode)
  return newNode
}

/**
 * Removes a node. Linear nodes splice out; filter nodes remove their whole
 * branch subtrees down to the join (if any) and reconnect parents to it.
 * Returns the ids of every removed node.
 */
export function removeNode(nodes: FlowNode[], id: string): string[] {
  const target = nodeById(nodes, id)
  if (!target) return []

  let removedIds: string[] = [id]
  let replacement = ''

  if (isFilter(target)) {
    const joinId = findJoin(nodes, target)
    const doomed = new Set<string>([id])
    for (const childId of target.children) {
      if (!childId || childId === joinId) continue
      const queue = [childId]
      while (queue.length) {
        const cur = queue.shift()!
        if (!cur || cur === joinId || doomed.has(cur)) continue
        doomed.add(cur)
        const n = nodeById(nodes, cur)
        if (n) queue.push(...n.children.filter(c => c !== ''))
      }
    }
    removedIds = [...doomed]
    replacement = joinId ?? ''
  } else {
    replacement = target.children[0] ?? ''
  }

  const doomedSet = new Set(removedIds)
  for (const n of nodes) {
    if (doomedSet.has(n.id)) continue
    if (!n.children.includes(id)) continue
    if (isFilter(n)) {
      n.children = n.children.map(c => (c === id ? replacement : c))
    } else {
      n.children = replacement ? [replacement] : []
    }
  }
  const keep = nodes.filter(n => !doomedSet.has(n.id))
  nodes.splice(0, nodes.length, ...keep)
  return removedIds
}

// ── Validation ───────────────────────────────────────────────────────────────

export function flowValidation(nodes: FlowNode[]): FlowIssue[] {
  const issues: FlowIssue[] = []
  const first = nodes[0]

  if (!first || first.category !== 'trigger') {
    issues.push({ level: 'error', message: 'The journey must start with a trigger step.' })
  }
  if (!nodes.some(n => n.category === 'action')) {
    issues.push({ level: 'error', message: 'Add at least one action step (e.g. Send Email).' })
  }
  for (const n of nodes) {
    if (!n.configured) {
      issues.push({ level: 'error', nodeId: n.id, message: `"${n.title}" isn't configured yet.` })
    }
  }
  for (const n of nodes.filter(isFilter)) {
    const joinId = findJoin(nodes, n)
    const emptyCount = Array.from({ length: branchCountOf(n) }, (_, i) => n.children[i] ?? '')
      .filter(c => c === '' || c === joinId).length
    if (emptyCount === branchCountOf(n)) {
      issues.push({ level: 'error', nodeId: n.id, message: `"${n.title}" has no steps in any branch.` })
    } else if (emptyCount > 0) {
      issues.push({ level: 'warning', nodeId: n.id, message: `"${n.title}" has an empty branch.` })
    }
  }
  if (nodes.length > 0 && !nodes.some(n => n.category === 'end' || n.kind === 'end-journey')) {
    issues.push({ level: 'warning', message: 'No explicit End step — contacts exit after their last step.' })
  }
  return issues
}
