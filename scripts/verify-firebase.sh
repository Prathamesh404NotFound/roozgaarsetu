#!/bin/bash

# Verify Firebase configuration before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying Firebase configuration..."

# Check if firebase.json exists
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ Error: firebase.json not found${NC}"
    exit 1
fi

# Check if hosting.public is set to "dist"
PUBLIC_DIR=$(grep -A 3 '"hosting"' firebase.json | grep '"public"' | cut -d'"' -f4)
if [ "$PUBLIC_DIR" != "dist" ]; then
    echo -e "${RED}❌ Error: firebase.json hosting.public is set to '$PUBLIC_DIR', expected 'dist'${NC}"
    exit 1
fi

# Check if .firebaserc exists
if [ ! -f ".firebaserc" ]; then
    echo -e "${RED}❌ Error: .firebaserc not found${NC}"
    exit 1
fi

# Check if projects.default matches "roozgaarsetu"
DEFAULT_PROJECT=$(grep '"default"' .firebaserc | cut -d'"' -f4)
if [ "$DEFAULT_PROJECT" != "roozgaarsetu" ]; then
    echo -e "${RED}❌ Error: .firebaserc projects.default is set to '$DEFAULT_PROJECT', expected 'roozgaarsetu'${NC}"
    exit 1
fi

# Check if Firebase CLI is authenticated
if ! firebase projects:list > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Firebase CLI is not authenticated. Run 'firebase login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Firebase configuration verified successfully${NC}"
echo -e "${GREEN}   - firebase.json exists with hosting.public = 'dist'${NC}"
echo -e "${GREEN}   - .firebaserc exists with projects.default = 'roozgaarsetu'${NC}"
echo -e "${GREEN}   - Firebase CLI is authenticated${NC}"
