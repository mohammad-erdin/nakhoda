# Milestone 3.1: FE-BE Integration & Bug Fixes

**Objective**: Link frontend and backend seamlessly, fix critical bugs, and ensure all API endpoints work correctly.

**Status**: In Progress

---

## Tasks

### 1. Fix Store Data Access Patterns ✅
- **Dashboard**: Fixed `containers.containers.filter` → now handles both direct array and paginated response
- **Dashboard**: Fixed `jobs.jobs.filter` → now handles both direct array and paginated response  
- **Volumes**: Fixed response parsing in getVolumes()
- **Images**: Fixed response parsing in getImages()
- **Verified**: All stores now handle `{ items: [] }` and `[]` responses

### 2. Fix Theme/Settings Functionality 
- Settings page theme toggle structure exists
- UI store has setTheme() method
- May need CSS variable application on theme change

### 3. Debug API Response Structure ✅ (Partial)
- Backend containers returns: `{ items, page, limit, total, totalPages }`
- Backend rudders returns: direct array `[]`
- Backend jobs likely returns paginated response
- Frontend stores now handle both patterns

### 4. Fix Component Type Issues ✅
- Dashboard: Removed inline type imports, added proper imports
- Fixed filter chain syntax errors

### 5. Test Complete Flows
- [ ] Login → Dashboard loads with data
- [ ] Navigate between all pages
- [ ] Verify sidebar collapse/expand
- [ ] Check all stats display correctly
- [ ] Verify WebSocket connections

### 6. API Endpoint Validation
```
POST   /api/auth/login          ✓ (working)
GET    /api/rudders             ✓ (returns direct array)
GET    /api/containers          ✓ (returns paginated)
GET    /api/jobs                ? (need to test)
GET    /api/images              ? (need to test)
GET    /api/volumes             ? (need to test)
GET    /api/settings            ? (need to test)
```

---

## Root Causes Identified

1. **Store State Structure Mismatch**: Stores may return wrapped data instead of direct state
2. **Missing API Endpoints**: Backend might not have implemented all GET routes yet
3. **Type Mismatches**: Frontend types don't match backend response structure
4. **Component Props**: Some components expect props that aren't being passed

---

## Files to Fix

- [ ] `/wheel-fe/src/pages/Dashboard.vue` - Filter syntax
- [ ] `/wheel-fe/src/pages/VolumeList.vue` - Volume iteration
- [ ] `/wheel-fe/src/pages/Settings.vue` - Theme toggle
- [ ] `/wheel-fe/src/stores/*.ts` - Verify state structure
- [ ] `/wheel-be/src/routes/*.ts` - Verify all endpoints exist

---

## Success Criteria

✅ All error messages gone from browser console
✅ Dashboard displays real data (even if 0 values)
✅ All page navigation works without errors
✅ Theme toggle persists on page reload
✅ Sidebar collapse/expand smooth
✅ WebSocket connection shows in Network tab

