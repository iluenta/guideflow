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
    
    // 1. Check for exact matches in id, name or aliases
    const terms = [item.id, item.name, ...(item.aliases || [])].map(t => t.toLowerCase())
    if (terms.includes(norm)) return true

    // 2. Check for whole-word matches to avoid "Horno" matching "Fuentes de horno"
    // We only want to match if the manual name is a significant part of the item or vice versa
    return terms.some(t => {
        // Use regex for whole word match
        const escapedT = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedT}\\b`, 'i');
        
        // If the item name is "Horno" and manual is "Horno Balay", it matches.
        // If the item name is "Fuentes de Horno" and manual is "Horno", it SHOULD NOT match 
        // because "Fuentes" is the primary noun.
        
        if (regex.test(norm)) {
            // If it's a multi-word item (like "Fuentes de horno"), the manual name 
            // must contain more than just one of the words to be a match, 
            // OR the manual name must be an exact alias.
            const tWords = t.split(' ').filter(w => w.length > 2);
            if (tWords.length > 1) {
                // If the item is "Fuentes de horno", and norm is "Horno", 
                // this regex test(norm) is true, but we should probably reject it
                // unless norm has other words from t.
                return norm.includes(t); // Require full inclusion for multi-word terms
            }
            return true;
        }
        return false;
    })
}
