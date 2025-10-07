# Sub-Idea Visibility Controls Manual Testing Guide

This guide provides step-by-step instructions to manually test the updated visibility controls for sub-ideas in the `getIdeaTree` query.

## Test Setup

### Prerequisites
- Convex development server running (`npx convex dev`)
- Access to Convex dashboard
- Test users and data created

### Test Data Setup

First, create test data using the Convex dashboard or CLI:

1. **Create Test Users:**
   ```bash
   # Use Convex dashboard to create users, or use existing users
   npx convex data users
   ```

2. **Create Test Ideas:**
   ```bash
   # Create public root idea
   npx convex run ideas:createIdea '{"title":"Public Root Test","description":"Test public root idea","category":"test","visibility":"public"}'

   # Create private root idea
   npx convex run ideas:createIdea '{"title":"Private Root Test","description":"Test private root idea","category":"test","visibility":"private"}'

   # Create public sub-idea under public root
   npx convex run ideas:addSubIdea '{"parentId":"[PUBLIC_ROOT_ID]","title":"Public Sub Test","description":"Test public sub-idea","category":"test","visibility":"public"}'

   # Create private sub-idea under private root
   npx convex run ideas:addSubIdea '{"parentId":"[PRIVATE_ROOT_ID]","title":"Private Sub Test","description":"Test private sub-idea","category":"test","visibility":"private"}'

   # Create mixed scenario: private sub-idea under public root
   npx convex run ideas:addSubIdea '{"parentId":"[PUBLIC_ROOT_ID]","title":"Private Sub Under Public","description":"Test private sub under public parent","category":"test","visibility":"private"}'
   ```

3. **Create Contribution Requests:**
   ```bash
   # Create and accept contribution request for private root idea
   npx convex run contributionRequests:createContributionRequest '{"ideaId":"[PRIVATE_ROOT_ID]","message":"Test contribution request"}'
   npx convex run ideas:acceptContribution '{"requestId":"[REQUEST_ID]"}'
   ```

## Test Scenarios

### Scenario 1: Public Parent Ideas

**Expected Behavior:** Sub-ideas under public parents should be visible to all users (anonymous and authenticated).

**Test Commands:**
```bash
# Test anonymous user (no auth context)
npx convex run ideas:getIdeaTree '{"rootIdeaId":"[PUBLIC_ROOT_ID]"}'

# Test authenticated non-contributor user
# (Set auth context or use dashboard)
npx convex run ideas:getIdeaTree '{"rootIdeaId":"[PUBLIC_ROOT_ID]"}'

# Test authenticated contributor user
npx convex run ideas:getIdeaTree '{"rootIdeaId":"[PUBLIC_ROOT_ID]"}'
```

**Expected Results:**
- All sub-ideas should be returned with full tree structure
- Children array should contain all sub-ideas
- No filtering based on user permissions

### Scenario 2: Private Parent Ideas

**Expected Behavior:**
- Anonymous users: No visibility (null return)
- Non-contributors: No visibility (null return or filtered tree)
- Authors: Full visibility
- Accepted contributors: Full visibility

**Test Commands:**
```bash
# Test anonymous user
npx convex run ideas:getIdeaTree '{"rootIdeaId":"[PRIVATE_ROOT_ID]"}'
# Expected: null or empty tree

# Test authenticated non-contributor
npx convex run ideas:getIdeaTree '{"rootIdeaId":"[PRIVATE_ROOT_ID]"}'
# Expected: null or empty tree

# Test author
npx convex run ideas:getIdeaTree '{"rootIdeaId":"[PRIVATE_ROOT_ID]"}'
# Expected: full tree with all sub-ideas

# Test accepted contributor
npx convex run ideas:getIdeaTree '{"rootIdeaId":"[PRIVATE_ROOT_ID]"}'
# Expected: full tree with all sub-ideas
```

### Scenario 3: Mixed Visibility Cases

**Expected Behavior:** Private sub-ideas under public parents should follow private visibility rules (not public rules).

**Test Commands:**
```bash
# Test anonymous user on mixed scenario
npx convex run ideas:getIdeaTree '{"rootIdeaId":"[PUBLIC_ROOT_ID_WITH_PRIVATE_SUB]"}'
# Expected: Tree with public parent, but private sub-ideas filtered out

# Test non-contributor on mixed scenario
npx convex run ideas:getIdeaTree '{"rootIdeaId":"[PUBLIC_ROOT_ID_WITH_PRIVATE_SUB]"}'
# Expected: Tree with public parent, but private sub-ideas filtered out

# Test author of private sub-idea
npx convex run ideas:getIdeaTree '{"rootIdeaId":"[PUBLIC_ROOT_ID_WITH_PRIVATE_SUB]"}'
# Expected: Full tree including private sub-ideas (author can see own ideas)
```

## Test Result Documentation

For each test scenario, document:

1. **Test Case ID**
2. **Description**
3. **Input Parameters**
4. **Expected Result**
5. **Actual Result**
6. **Pass/Fail**
7. **Notes/Issues**

Example:

| Test Case | Description | Input | Expected | Actual | Result | Notes |
|-----------|-------------|-------|----------|--------|--------|-------|
| VIS-001 | Anonymous user views public parent tree | rootIdeaId: public_id | Full tree visible | Full tree visible | ✅ PASS | - |
| VIS-002 | Anonymous user views private parent tree | rootIdeaId: private_id | null/empty tree | null returned | ✅ PASS | - |

## Common Issues to Check

1. **Authentication Context:** Ensure proper user context is set for authenticated tests
2. **Root Parent Logic:** Verify `findRootIdea` function correctly identifies root parents
3. **Contribution Request Status:** Ensure accepted requests are properly validated
4. **Deleted Ideas:** Confirm deleted ideas are properly filtered out
5. **Tree Structure:** Verify recursive building maintains correct hierarchy

## Manual Testing Steps

1. Execute each test scenario using Convex CLI or dashboard
2. Compare actual results with expected behavior
3. Document any discrepancies or unexpected behavior
4. Verify edge cases (nested sub-ideas, mixed visibility trees)
5. Test performance with larger trees (if applicable)

## Cleanup

After testing, clean up test data:

```bash
# Delete test ideas (soft delete)
npx convex run ideas:deleteIdea '{"ideaId":"[TEST_IDEA_ID]"}'

# Note: This performs soft delete, preserving data for analysis if needed