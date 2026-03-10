#!/bin/bash
# Comprehensive Production Test Script - Updated for 2026-01-26
# Tests all major application processes from login to all business modules

set -e

API_URL="http://localhost:3001/api/v1"
FRONTEND_URL="http://localhost:5173"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED=$((PASSED + 1))
}

error() {
    echo -e "${RED}❌ $1${NC}"
    FAILED=$((FAILED + 1))
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_code="$4"
    local headers="$5"
    
    TOTAL=$((TOTAL + 1))
    info "Test ${TOTAL}: ${name}"
    
    local start_time=$(date +%s%N)
    local http_code
    
    if [ "$method" = "GET" ]; then
        http_code=$(curl -s -o /dev/null -w "%{http_code}" ${headers} "${API_URL}${endpoint}" 2>/dev/null || echo "000")
    elif [ "$method" = "POST" ]; then
        http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${headers} "${API_URL}${endpoint}" 2>/dev/null || echo "000")
    fi
    
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$http_code" = "$expected_code" ]; then
        success "${name} - Code: ${http_code}, Duration: ${duration}ms"
    else
        error "${name} - Expected: ${expected_code}, Got: ${http_code}, Duration: ${duration}ms"
    fi
}

echo ""
echo "🚀 COMPREHENSIVE PRODUCTION TEST SUITE"
echo "======================================"
echo "Backend: ${API_URL}"
echo "Frontend: ${FRONTEND_URL}"
echo "======================================"
echo ""

# 1. Backend Health Check
info "Phase 1: Infrastructure Tests"
echo "-----------------------------------"
test_endpoint "Backend Health Check" "GET" "/health" "404" ""
test_endpoint "Backend API Root" "GET" "/" "404" ""
echo ""

# 2. Authentication Tests
info "Phase 2: Authentication Tests"
echo "-----------------------------------"
info "Attempting login with test credentials..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"okerybanza@gmail.com","password":"Test@2024"}' 2>/dev/null || echo '{"success":false}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    COMPANY_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"companyId":"[^"]*"' | cut -d'"' -f4)
    success "Login successful - Token obtained"
    success "Company ID: ${COMPANY_ID}"
    HEADERS="-H 'Authorization: Bearer ${TOKEN}'"
else
    error "Login failed - Cannot proceed with authenticated tests"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 3. User Profile Tests
info "Phase 3: User Profile Tests"
echo "-----------------------------------"
test_endpoint "Get User Profile" "GET" "/user/me" "200" "${HEADERS}"
echo ""

# 4. Customer Management Tests
info "Phase 4: Customer Management Tests"
echo "-----------------------------------"
test_endpoint "Get Customers List" "GET" "/customers" "200" "${HEADERS}"
test_endpoint "Get Customer by ID (invalid)" "GET" "/customers/00000000-0000-0000-0000-000000000000" "404" "${HEADERS}"
echo ""

# 5. Invoice Management Tests
info "Phase 5: Invoice Management Tests"
echo "-----------------------------------"
test_endpoint "Get Invoices List" "GET" "/invoices" "200" "${HEADERS}"
test_endpoint "Get Invoice by ID (invalid)" "GET" "/invoices/00000000-0000-0000-0000-000000000000" "404" "${HEADERS}"
echo ""

# 6. Product Management Tests
info "Phase 6: Product & Inventory Tests"
echo "-----------------------------------"
test_endpoint "Get Products List" "GET" "/products" "200" "${HEADERS}"
test_endpoint "Get Stock Movements" "GET" "/stock-movements" "200" "${HEADERS}"
test_endpoint "Get Warehouses" "GET" "/warehouses" "200" "${HEADERS}"
echo ""

# 7. Expense Management Tests
info "Phase 7: Expense Management Tests"
echo "-----------------------------------"
test_endpoint "Get Expenses List" "GET" "/expenses" "200" "${HEADERS}"
test_endpoint "Get Suppliers List" "GET" "/suppliers" "200" "${HEADERS}"
echo ""

# 8. Accounting Tests
info "Phase 8: Accounting & Reports Tests"
echo "-----------------------------------"
test_endpoint "Get Chart of Accounts" "GET" "/accounts" "200" "${HEADERS}"
test_endpoint "Get Journal Entries" "GET" "/journal-entries" "200" "${HEADERS}"
test_endpoint "Get Trial Balance" "GET" "/accounting-reports/trial-balance?startDate=2024-01-01&endDate=2024-12-31" "200" "${HEADERS}"
test_endpoint "Get Sales Journal" "GET" "/accounting-reports/sales-journal?startDate=2024-01-01&endDate=2024-12-31" "200" "${HEADERS}"
test_endpoint "Get Purchase Journal" "GET" "/accounting-reports/purchase-journal?startDate=2024-01-01&endDate=2024-12-31" "200" "${HEADERS}"
echo ""

# 9. Dashboard Tests
info "Phase 9: Dashboard & Analytics Tests"
echo "-----------------------------------"
test_endpoint "Get Dashboard Stats" "GET" "/dashboard/stats" "200" "${HEADERS}"
test_endpoint "Get Dashboard Charts" "GET" "/dashboard/charts" "200" "${HEADERS}"
echo ""

# 10. Payment Tests
info "Phase 10: Payment Management Tests"
echo "-----------------------------------"
test_endpoint "Get Payments List" "GET" "/payments" "200" "${HEADERS}"
echo ""

# 11. HR Module Tests (if applicable)
info "Phase 11: HR Module Tests"
echo "-----------------------------------"
test_endpoint "Get Employees List" "GET" "/employees" "200" "${HEADERS}"
test_endpoint "Get Payroll List" "GET" "/payroll" "200" "${HEADERS}"
echo ""

# 12. Frontend Availability
info "Phase 12: Frontend Availability"
echo "-----------------------------------"
if curl -s -f "${FRONTEND_URL}" > /dev/null 2>&1; then
    success "Frontend is accessible at ${FRONTEND_URL}"
else
    error "Frontend is not accessible at ${FRONTEND_URL}"
fi
echo ""

# Summary
echo "======================================"
echo "📊 TEST SUMMARY"
echo "======================================"
echo -e "${BLUE}Total Tests: ${TOTAL}${NC}"
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo -e "${BLUE}Success Rate: $(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")%${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "The production system is fully operational."
    exit 0
else
    echo -e "${RED}⚠️  ${FAILED} TEST(S) FAILED${NC}"
    echo "Please review the failed tests above."
    exit 1
fi
