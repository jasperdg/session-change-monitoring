#!/bin/bash

# Script to delete all Vercel deployments except the most recent one

echo "🔍 Fetching all deployments..."

# Get all deployments in JSON format
DEPLOYMENTS=$(vercel list --yes 2>/dev/null | tail -n +2)

if [ -z "$DEPLOYMENTS" ]; then
    echo "❌ No deployments found or error fetching deployments"
    exit 1
fi

# Parse deployments and get URLs (skip the header line)
DEPLOYMENT_URLS=$(echo "$DEPLOYMENTS" | awk '{print $2}' | grep -v "URL")

# Count total deployments
TOTAL=$(echo "$DEPLOYMENT_URLS" | wc -l | xargs)
echo "📊 Found $TOTAL deployment(s)"

if [ "$TOTAL" -le 1 ]; then
    echo "✅ Only one deployment exists, nothing to delete"
    exit 0
fi

# Keep the first one (most recent), delete the rest
TO_DELETE=$((TOTAL - 1))
echo "🗑️  Will delete $TO_DELETE deployment(s), keeping the most recent one"

# Skip the first line (most recent) and delete the rest
echo "$DEPLOYMENT_URLS" | tail -n +2 | while read -r url; do
    if [ ! -z "$url" ]; then
        echo "Deleting: $url"
        vercel remove "$url" --yes --scope jasperdgs-projects 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "  ✅ Deleted: $url"
        else
            echo "  ⚠️  Failed to delete: $url"
        fi
    fi
done

echo "✅ Cleanup complete!"

