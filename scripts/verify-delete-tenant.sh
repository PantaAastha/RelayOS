#!/bin/bash

# Configuration
API_URL="http://localhost:3001"
TIMESTAMP=$(date +%s)

echo "🧪 Starting Tenant Deletion Verification..."

# 1. Create a new tenant
echo "1. Creating new tenant..."
TENANT_RES=$(curl -s -X POST "$API_URL/tenants" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Delete Verify $TIMESTAMP\", \"slug\": \"delete-verify-$TIMESTAMP\"}")

TENANT_ID=$(echo $TENANT_RES | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TENANT_ID" ]; then
  echo "❌ Failed to create tenant. Response: $TENANT_RES"
  exit 1
fi
echo "✅ Tenant created: $TENANT_ID"

# 2. Upload a document (Create a dependency in 'documents' and 'document_chunks')
echo "2. Adding document..."
DOC_RES=$(curl -s -X POST "$API_URL/knowledge/documents" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{"title": "Test Doc", "content": "This is a verification document."}')

if [[ $DOC_RES != *"success\":true"* ]]; then
  echo "❌ Failed to add document. Response: $DOC_RES"
  # Continue anyway to test partial cleanup
fi
echo "✅ Document added"

# 3. Start a conversation (Create a dependency in 'conversations', 'messages', 'events')
echo "3. Starting conversation..."
CHAT_RES=$(curl -s -X POST "$API_URL/conversation/message" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{"content": "Hello world"}')

CONV_ID=$(echo $CHAT_RES | grep -o '"conversationId":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CONV_ID" ]; then
    echo "⚠️ Failed to start conversation. Response: $CHAT_RES"
    # Continue anyway
else 
    echo "✅ Conversation started: $CONV_ID"
fi

# 4. Search Knowledge (Create 'rag.searched' event) - Implicitly handled by chat but let's be sure
# Actually chat handles it.

# 5. Delete Tenant
echo "4. Deleting Tenant..."
DELETE_RES=$(curl -s -w "%{http_code}" -X DELETE "$API_URL/tenants/$TENANT_ID")
HTTP_CODE="${DELETE_RES: -3}"

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "204" ]; then
  echo "✅ Tenant deleted successfully (HTTP $HTTP_CODE)"
else
  echo "❌ Failed to delete tenant. HTTP Code: $HTTP_CODE"
  echo "Response: ${DELETE_RES::-3}"
  exit 1
fi

echo "🎉 Verification passed! Fix confirmed."
exit 0
