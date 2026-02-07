#!/bin/bash
# Test Query Processing Feature
# This script tests the new query processing functionality

set -e

API_URL="${API_URL:-http://localhost:3001}"
TENANT_ID="${TENANT_ID:-test-tenant}"

echo "=== Testing Query Processing ==="
echo "API URL: $API_URL"
echo "Tenant ID: $TENANT_ID"
echo ""

# Test 1: Normal query (should be processed)
echo "Test 1: Normal support query (should be processed)"
RESPONSE=$(curl -s -X POST "$API_URL/conversation/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "message": "how do I cancle my API key"
  }')
echo "Response: $RESPONSE"
echo ""

# Test 2: Greeting (should skip processing)
echo "Test 2: Greeting (should skip processing)"
RESPONSE=$(curl -s -X POST "$API_URL/conversation/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "message": "hello!"
  }')
echo "Response: $RESPONSE"
echo ""

# Test 3: Troubleshooting query
echo "Test 3: Troubleshooting query"
RESPONSE=$(curl -s -X POST "$API_URL/conversation/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "message": "webhook not firing after update"
  }')
echo "Response: $RESPONSE"
echo ""

# Test 4: Billing query
echo "Test 4: Billing query"
RESPONSE=$(curl -s -X POST "$API_URL/conversation/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "message": "how much does the pro plan cost"
  }')
echo "Response: $RESPONSE"
echo ""

echo "=== Query Processing Tests Complete ==="
echo ""
echo "To verify query processing is working, check the 'events' table in Supabase for:"
echo "  - event_type = 'rag.searched'"
echo "  - payload should now contain 'rewrittenQuery', 'queryType', and 'queryProcessing' fields"
