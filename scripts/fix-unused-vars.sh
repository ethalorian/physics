#!/bin/bash

# Fix unused variables in API routes

# Fix unused 'request' parameters in GET routes that don't use them
echo "Fixing unused request parameters in API routes..."

# enrollment/status/route.ts - already fixed

# Fix unused catch variables
echo "Fixing unused catch variables..."
sed -i '' 's/} catch (error:.*any) {/} catch {/g' src/app/api/**/*.ts 2>/dev/null
sed -i '' 's/} catch (err:.*any) {/} catch {/g' src/app/api/**/*.ts 2>/dev/null
sed -i '' 's/} catch (e) {/} catch {/g' src/app/api/**/*.ts 2>/dev/null

# Fix unused imports
echo "Fixing unused imports..."

# Fix specific unused imports
files=(
  "src/app/simulations/astronaut-thrust/page.tsx"
  "src/app/simulations/car-race/page.tsx"
  "src/app/simulations/carts-third-law/page.tsx"
  "src/app/simulations/vacuum-chamber/page.tsx"
  "src/app/simulations/maze-vectors/page.tsx"
  "src/app/simulations/race-track/page.tsx"
  "src/app/simulations/sumo-forces/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Cleaning unused imports in $file..."
    # Remove unused lucide-react imports
    sed -i '' '/^[[:space:]]*Pause[[:space:]]*,$/d' "$file" 2>/dev/null
    sed -i '' '/^[[:space:]]*Flag[[:space:]]*,$/d' "$file" 2>/dev/null
    sed -i '' '/^[[:space:]]*Zap[[:space:]]*,$/d' "$file" 2>/dev/null
    sed -i '' '/^[[:space:]]*Scale[[:space:]]*,$/d' "$file" 2>/dev/null
    sed -i '' '/^[[:space:]]*ArrowDown[[:space:]]*,$/d' "$file" 2>/dev/null
    sed -i '' '/^[[:space:]]*ArrowUp[[:space:]]*,$/d' "$file" 2>/dev/null
    sed -i '' '/^[[:space:]]*ArrowLeftRight[[:space:]]*,$/d' "$file" 2>/dev/null
  fi
done

echo "Cleanup complete. Run 'npm run lint' to check remaining issues."

