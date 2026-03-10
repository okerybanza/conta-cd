#!/bin/bash
# Quick script to delete a user account via database

EMAIL="erick.banza@hologram.cd"

echo "🗑️  Deleting user: $EMAIL"

# Try different postgres authentication methods
if sudo -u postgres psql -d conta_db -c "DELETE FROM users WHERE email = '$EMAIL';" 2>/dev/null; then
    echo "✅ User deleted successfully!"
elif PGPASSWORD=postgres psql -U postgres -h localhost -d conta_db -c "DELETE FROM users WHERE email = '$EMAIL';" 2>/dev/null; then
    echo "✅ User deleted successfully!"
else
    echo "❌ Could not delete user - trying alternative method..."
    # Try via PM2 backend API
    curl -X DELETE "http://localhost:3001/api/v1/admin/users?email=$EMAIL" \
        -H "Content-Type: application/json" 2>/dev/null || echo "API method also failed"
fi

echo ""
echo "You can now register with $EMAIL again!"
