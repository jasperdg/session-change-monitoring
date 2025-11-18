#!/bin/bash

# ============================================
# Search for Rate Limiting in Vercel Logs
# ============================================

echo "🔍 Searching for Rate Limiting Events..."
echo ""

DEPLOYMENT_URL="${1:-seda-fast-test-99z1q6my2-jasperdgs-projects.vercel.app}"

echo "📊 Method 1: Search for explicit rate limit warnings"
echo "=================================================="
vercel logs "$DEPLOYMENT_URL" --json 2>/dev/null | \
  jq -r 'select(.message | contains("Rate limited")) | 
  "[\(.timestamp)] \(.message) - \(.error // "no details")"' | \
  head -20

echo ""
echo "📊 Method 2: Count total rate limit events"
echo "=================================================="
RATE_LIMIT_COUNT=$(vercel logs "$DEPLOYMENT_URL" --json 2>/dev/null | \
  jq -r 'select(.message | contains("Rate limited"))' | wc -l)
echo "Total rate limit events found: $RATE_LIMIT_COUNT"

echo ""
echo "📊 Method 3: Get rateLimitCount from cron summaries"
echo "=================================================="
vercel logs "$DEPLOYMENT_URL" --json 2>/dev/null | \
  jq -r 'select(.rateLimitCount) | 
  "[\(.timestamp)] Success: \(.successCount) | Errors: \(.errorCount) | Rate Limited: \(.rateLimitCount) | Success Rate: \(.successRate)"' | \
  head -10

echo ""
echo "📊 Method 4: Find if ANY rate limiting has occurred"
echo "=================================================="
HAS_RATE_LIMITS=$(vercel logs "$DEPLOYMENT_URL" --json 2>/dev/null | \
  jq -r 'select(.rateLimitCount and (.rateLimitCount | tonumber) > 0)' | wc -l)

if [ "$HAS_RATE_LIMITS" -gt "0" ]; then
  echo "⚠️ FOUND rate limiting events in $HAS_RATE_LIMITS cron runs"
  echo ""
  echo "Recent rate limited cron runs:"
  vercel logs "$DEPLOYMENT_URL" --json 2>/dev/null | \
    jq -r 'select(.rateLimitCount and (.rateLimitCount | tonumber) > 0) | 
    "  ⚠️ [\(.timestamp)] \(.rateLimitCount) rate limits out of \(.successCount + .errorCount) attempts (\(.successRate) success)"' | \
    head -5
else
  echo "✅ NO rate limiting detected"
fi

echo ""
echo "📊 Method 5: Get detailed error list from summaries"
echo "=================================================="
vercel logs "$DEPLOYMENT_URL" --json 2>/dev/null | \
  jq -r 'select(.errors and (.errors | length > 0)) | 
  .errors[] | select(.type == "rate_limit") | 
  "[\(.timestamp)] \(.error)"' | \
  head -10

echo ""
echo "💡 Tips:"
echo "  - If you see 'Rate limited', SEDA API is throttling you"
echo "  - Check 'Retry after' value (usually in seconds)"
echo "  - If rateLimitCount > 25% of attempts, consider reducing frequency"
echo ""

