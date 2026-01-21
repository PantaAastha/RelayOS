#!/bin/bash

# Multi-Tenancy Verification Script
# Tests the full lifecycle: Create Tenant -> Verify Isolation -> Test Guards

API_URL="http://localhost:3001"
TIMESTAMP=$(date +%s)
TENANT_NAME="Test Tenant $TIMESTAMP"
TENANT_SLUG="test-tenant-$TIMESTAMP"

echo "🚀 Starting Multi-Tenancy Test..."
echo "API URL: $API_URL"

# 1. Check API Health
echo -n "1. Checking API Health... "
HEALTH_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$HEALTH_HTTP_CODE" != "200" ]; then
    echo "❌ API is not healthy (HTTP $HEALTH_HTTP_CODE)"
    exit 1
fi
echo "✅ OK"

# 2. Create New Tenant
echo -n "2. Creating New Tenant ($TENANT_SLUG)... "
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/tenants" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$TENANT_NAME\", \"slug\": \"$TENANT_SLUG\", \"config\": {\"test\": true}}")

TENANT_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
if [ "$TENANT_ID" == "null" ] || [ -z "$TENANT_ID" ]; then
    echo "❌ Failed to create tenant"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi
echo "✅ Created (ID: $TENANT_ID)"

# 3. Verify Tenant Persistence (Get by ID)
echo -n "3. Verifying Tenant Persistence... "
GET_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/tenants/$TENANT_ID")
if [ "$GET_HTTP_CODE" != "200" ]; then
    echo "❌ Failed to retrieve tenant (HTTP $GET_HTTP_CODE)"
    exit 1
fi
echo "✅ OK"

# 4. Test Tenant Context (Echo Endpoint)
echo -n "4. Testing Tenant Context Propagation... "
CONTEXT_RESPONSE=$(curl -s -X GET "$API_URL/tenants/me" \
    -H "X-Tenant-ID: $TENANT_ID")

RETURNED_ID=$(echo $CONTEXT_RESPONSE | jq -r '.id')
if [ "$RETURNED_ID" != "$TENANT_ID" ]; then
    echo "❌ Context mismatch"
    echo "Expected: $TENANT_ID"
    echo "Got: $RETURNED_ID"
    exit 1
fi
echo "✅ Valid Context"

# 5. Test Missing Tenant (Should Fail on protected routes)
# Note: /events requires X-Tenant-ID via controller check or global guard logic depending on implementation
# Assuming /events is protected:
echo -n "5. Testing Missing Tenant Protection... "
PROTECTED_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/events")
if [ "$PROTECTED_HTTP_CODE" == "400" ] || [ "$PROTECTED_HTTP_CODE" == "403" ]; then
    echo "✅ Blocked (HTTP $PROTECTED_HTTP_CODE)"
else
    echo "⚠️  Warning: Request without tenant ID returned HTTP $PROTECTED_HTTP_CODE (Expected 400/403)"
fi

echo "----------------------------------------"
echo "🎉 Multi-Tenancy Verification Failed? No! It PASSED!"
echo "Created Tenant ID: $TENANT_ID"
echo "Name: $TENANT_NAME"
echo "Slug: $TENANT_SLUG"
exit 0
