-- Migration 039: Repair Chat Logs to match new Analytics Schema
-- Populates tenant_id and message_count from existing property data

-- 1. Populate tenant_id and message_count for existing chats
UPDATE guest_chats
SET 
    tenant_id = p.tenant_id,
    message_count = array_length(messages, 1)
FROM properties p
WHERE guest_chats.property_id = p.id
  AND (guest_chats.tenant_id IS NULL OR guest_chats.message_count = 0);

-- 2. Fallback language for existing chats
UPDATE guest_chats
SET language = 'es'
WHERE language IS NULL;

-- 3. Update existing message_count to avoid 0s if array_length is null
UPDATE guest_chats
SET message_count = 0
WHERE message_count IS NULL;
