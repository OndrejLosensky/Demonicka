-- ============================================
-- PostgreSQL Migration Verification Queries
-- ============================================
-- Run these queries in your PostgreSQL database to verify the migration
-- ============================================

-- 1. Check record counts for all tables
-- ============================================
SELECT 'User' as table_name, COUNT(*) as row_count FROM "User"
UNION ALL
SELECT 'Barrel', COUNT(*) FROM "Barrel"
UNION ALL
SELECT 'Event', COUNT(*) FROM "Event"
UNION ALL
SELECT 'Achievement', COUNT(*) FROM "Achievement"
UNION ALL
SELECT 'RefreshToken', COUNT(*) FROM "RefreshToken"
UNION ALL
SELECT 'DeviceToken', COUNT(*) FROM "DeviceToken"
UNION ALL
SELECT 'Beer', COUNT(*) FROM "Beer"
UNION ALL
SELECT 'EventBeer', COUNT(*) FROM "EventBeer"
UNION ALL
SELECT 'EventUsers', COUNT(*) FROM "EventUsers"
UNION ALL
SELECT 'EventBarrels', COUNT(*) FROM "EventBarrels"
UNION ALL
SELECT 'UserAchievement', COUNT(*) FROM "UserAchievement"
ORDER BY table_name;

-- 2. Sample Users (first 5)
-- ============================================
SELECT id, username, role, beerCount, "lastBeerTime", "createdAt"
FROM "User"
ORDER BY "createdAt"
LIMIT 5;

-- 3. Sample Events
-- ============================================
SELECT id, name, "startDate", "endDate", "isActive", "createdAt"
FROM "Event"
ORDER BY "createdAt";

-- 4. Sample Achievements
-- ============================================
SELECT id, name, type, category, "targetValue", points, "isActive"
FROM "Achievement"
ORDER BY category, "targetValue";

-- 5. Check User-Achievement relationships
-- ============================================
SELECT 
  u.username,
  a.name as achievement_name,
  ua.progress,
  ua."isCompleted",
  ua."completionCount"
FROM "UserAchievement" ua
JOIN "User" u ON ua."userId" = u.id
JOIN "Achievement" a ON ua."achievementId" = a.id
WHERE ua."isCompleted" = true
ORDER BY u.username, a.name
LIMIT 10;

-- 6. Check Event-User relationships
-- ============================================
SELECT 
  e.name as event_name,
  COUNT(eu."userId") as participant_count
FROM "Event" e
LEFT JOIN "EventUsers" eu ON e.id = eu."eventId"
GROUP BY e.id, e.name
ORDER BY e.name;

-- 7. Check Event-Beer relationships
-- ============================================
SELECT 
  e.name as event_name,
  COUNT(eb.id) as total_beers,
  COUNT(DISTINCT eb."userId") as unique_participants,
  SUM(CASE WHEN eb.spilled = true THEN 1 ELSE 0 END) as spilled_count
FROM "Event" e
LEFT JOIN "EventBeer" eb ON e.id = eb."eventId"
GROUP BY e.id, e.name
ORDER BY e.name;

-- 8. Check User Beer Counts
-- ============================================
SELECT 
  username,
  "beerCount" as total_beers,
  "lastBeerTime",
  role
FROM "User"
ORDER BY "beerCount" DESC
LIMIT 10;

-- 9. Verify Foreign Key Relationships
-- ============================================
-- Check if all EventBeer records have valid Event and User references
SELECT 
  'EventBeer with invalid eventId' as check_type,
  COUNT(*) as invalid_count
FROM "EventBeer" eb
LEFT JOIN "Event" e ON eb."eventId" = e.id
WHERE e.id IS NULL

UNION ALL

SELECT 
  'EventBeer with invalid userId',
  COUNT(*)
FROM "EventBeer" eb
LEFT JOIN "User" u ON eb."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'UserAchievement with invalid userId',
  COUNT(*)
FROM "UserAchievement" ua
LEFT JOIN "User" u ON ua."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'UserAchievement with invalid achievementId',
  COUNT(*)
FROM "UserAchievement" ua
LEFT JOIN "Achievement" a ON ua."achievementId" = a.id
WHERE a.id IS NULL;

-- 10. Check Data Types and Constraints
-- ============================================
-- Verify Achievement IDs are strings (not UUIDs)
SELECT id, name, type
FROM "Achievement"
LIMIT 5;

-- Verify EventBeer has spilled column
SELECT id, "eventId", "userId", spilled, "consumedAt"
FROM "EventBeer"
LIMIT 5;

-- 11. Check Timestamps
-- ============================================
SELECT 
  'Oldest User' as metric,
  MIN("createdAt") as value
FROM "User"

UNION ALL

SELECT 
  'Newest User',
  MAX("createdAt")
FROM "User"

UNION ALL

SELECT 
  'Oldest Beer',
  MIN("createdAt")
FROM "Beer"

UNION ALL

SELECT 
  'Newest Beer',
  MAX("createdAt")
FROM "Beer";

-- 12. Check Array Fields (allowedIPs)
-- ============================================
SELECT 
  username,
  "allowedIPs",
  array_length("allowedIPs", 1) as ip_count
FROM "User"
WHERE "allowedIPs" IS NOT NULL AND array_length("allowedIPs", 1) > 0
LIMIT 5;

-- 13. Summary Statistics
-- ============================================
SELECT 
  'Total Users' as metric,
  COUNT(*)::text as value
FROM "User"

UNION ALL

SELECT 
  'Total Beers',
  COUNT(*)::text
FROM "Beer"

UNION ALL

SELECT 
  'Total Event Beers',
  COUNT(*)::text
FROM "EventBeer"

UNION ALL

SELECT 
  'Total Achievements',
  COUNT(*)::text
FROM "Achievement"

UNION ALL

SELECT 
  'Completed User Achievements',
  COUNT(*)::text
FROM "UserAchievement"
WHERE "isCompleted" = true

UNION ALL

SELECT 
  'Active Events',
  COUNT(*)::text
FROM "Event"
WHERE "isActive" = true;
