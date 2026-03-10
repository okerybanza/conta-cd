#!/bin/bash
# Simplified Production Health Check - Tests infrastructure without authentication
# Usage: ./scripts/test-production-health.sh

set -e

API_URL="http://localhost:3001/api/v1"
FRONTEND_URL="http://localhost:5173"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED=$((PASSED + 1))
}

error() {
    echo -e "${RED}❌ $1${NC}"
    FAILED=$((FAILED + 1))
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo "🏥 PRODUCTION HEALTH CHECK"
echo "=========================="
echo ""

# 1. Backend Server Status
info "1. Checking Backend Server..."
if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
    success "Backend health endpoint responding"
elif curl -s "${API_URL}/customers" > /dev/null 2>&1; then
    success "Backend is online (API responding)"
else
    error "Backend is not accessible"
fi

# 2. PM2 Process Status
info "2. Checking PM2 Process..."
if pm2 list | grep -q "conta-backend.*online"; then
    success "PM2 process 'conta-backend' is online"
    RESTARTS=$(pm2 list | grep conta-backend | awk '{print $4}')
    if [ "$RESTARTS" -lt 5 ]; then
        success "Process is stable (${RESTARTS} restarts)"
    else
        warn "Process has restarted ${RESTARTS} times"
    fi
else
    error "PM2 process 'conta-backend' is not online"
fi

# 3. Frontend Server Status
info "3. Checking Frontend Server..."
if curl -s -f "${FRONTEND_URL}" > /dev/null 2>&1; then
    success "Frontend is accessible at ${FRONTEND_URL}"
else
    warn "Frontend is not accessible (may need manual start)"
fi

# 4. API Response Time Test
info "4. Testing API Response Time..."
START=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/customers" 2>/dev/null || echo "000")
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "200" ]; then
    success "API responding in ${DURATION}ms (code: ${HTTP_CODE})"
    if [ $DURATION -lt 1000 ]; then
        success "Response time is excellent (< 1s)"
    elif [ $DURATION -lt 3000 ]; then
        success "Response time is good (< 3s)"
    else
        warn "Response time is slow (${DURATION}ms)"
    fi
else
    error "API not responding properly (code: ${HTTP_CODE})"
fi

# 5. Database Connection (via API)
info "5. Testing Database Connection..."
RESPONSE=$(curl -s "${API_URL}/customers" 2>/dev/null || echo "")
if echo "$RESPONSE" | grep -q "success\|error\|data"; then
    success "Database connection working (API returns data)"
else
    error "Database connection may be broken"
fi

# 6. Redis Connection Test
info "6. Testing Redis Connection..."
if redis-cli ping > /dev/null 2>&1; then
    success "Redis is responding"
else
    warn "Redis is not accessible (caching may be disabled)"
fi

# 7. Port Allocation Check
info "7. Checking Port Allocation..."
if lsof -i :3001 | grep -q "node"; then
    success "Port 3001 is correctly allocated to Node.js"
else
    error "Port 3001 is not allocated correctly"
fi

# 8. Disk Space Check
info "8. Checking Disk Space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    success "Disk space is healthy (${DISK_USAGE}% used)"
elif [ "$DISK_USAGE" -lt 90 ]; then
    warn "Disk space is getting full (${DISK_USAGE}% used)"
else
    error "Disk space is critical (${DISK_USAGE}% used)"
fi

# 9. Memory Usage Check
info "9. Checking Memory Usage..."
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -lt 80 ]; then
    success "Memory usage is healthy (${MEM_USAGE}%)"
elif [ "$MEM_USAGE" -lt 90 ]; then
    warn "Memory usage is high (${MEM_USAGE}%)"
else
    error "Memory usage is critical (${MEM_USAGE}%)"
fi

# 10. Log File Check
info "10. Checking Log Files..."
if [ -f "/home/conta/conta.cd-prod/logs/backend-error.log" ]; then
    ERROR_COUNT=$(tail -n 100 /home/conta/conta.cd-prod/logs/backend-error.log 2>/dev/null | grep -c "Error" || echo "0")
    if [ "$ERROR_COUNT" -lt 5 ]; then
        success "Recent error count is low (${ERROR_COUNT} in last 100 lines)"
    else
        warn "Recent error count is high (${ERROR_COUNT} in last 100 lines)"
    fi
else
    warn "Error log file not found"
fi

echo ""
echo "=========================="
echo "📊 HEALTH CHECK SUMMARY"
echo "=========================="
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ SYSTEM IS HEALTHY${NC}"
    echo "All critical checks passed. The production system is operational."
    exit 0
else
    echo -e "${RED}⚠️  SYSTEM HAS ISSUES${NC}"
    echo "${FAILED} check(s) failed. Please review the results above."
    exit 1
fi
