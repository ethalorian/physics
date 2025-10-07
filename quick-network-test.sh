#!/bin/bash
echo "🔍 Quick Network Test for Supabase"
echo ""
echo "Testing connection to Supabase..."
echo ""

# Test with curl
if curl -s -I https://lknifmjxelphrkwddnpw.supabase.co/rest/v1/ 2>&1 | grep -q "Cisco Umbrella"; then
    echo "❌ BLOCKED by Cisco Umbrella (School Network)"
    echo "   You are on a network that blocks Supabase."
    echo ""
    echo "✅ Solution: Connect to a different network (home WiFi, mobile hotspot)"
    exit 1
elif curl -s -I https://lknifmjxelphrkwddnpw.supabase.co/rest/v1/ 2>&1 | grep -q "200\|401\|403\|404"; then
    echo "✅ Connection successful! Network allows Supabase."
    echo "   Your database should work from this network."
    exit 0
else
    echo "⚠️  Connection failed for unknown reason"
    echo "   Check your internet connection"
    exit 1
fi
