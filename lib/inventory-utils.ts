/**
 * Pure inventory matching utilities — safe for server and client use.
 * Extracted from components/dashboard/InventorySelector.tsx to avoid
 * importing 'use client' components in Server Actions.
 */

export interface InventoryItemBase {
    id: string
    name: string
    aliases?: string[]
}

export function matchesInventoryItem(manualName: string, item: InventoryItemBase): boolean {
    const norm = manualName.toLowerCase().trim()
    if (norm.length < 2) return false
    const terms = [item.id, item.name, ...(item.aliases || [])].map(t => t.toLowerCase())
    return terms.some(t => norm.includes(t) || t.includes(norm))
}
