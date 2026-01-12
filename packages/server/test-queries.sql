-- Test the corrected dashboard query
-- This should only count beers from users who are currently in the active event

-- First, let's see the current state
SELECT 'Current state:' as info;
SELECT u.username, COUNT(eb.id) as beer_count 
FROM users u 
LEFT JOIN event_users eu ON u.id = eu.user_id 
LEFT JOIN event e ON eu.event_id = e.id 
LEFT JOIN event_beers eb ON u.id = eb.userId AND eb.eventId = e.id 
WHERE e.isActive = 1 
GROUP BY u.id, u.username 
ORDER BY beer_count DESC;

-- Now let's see the corrected query (only active users)
SELECT 'Corrected query (only active users):' as info;
SELECT u.username, COUNT(eb.id) as beer_count 
FROM users u 
INNER JOIN event_users eu ON u.id = eu.user_id 
INNER JOIN event e ON eu.event_id = e.id 
LEFT JOIN event_beers eb ON u.id = eb.userId AND eb.eventId = e.id 
WHERE e.isActive = 1 
GROUP BY u.id, u.username 
ORDER BY beer_count DESC;

-- Check total beers from active users only
SELECT 'Total beers from active users only:' as info;
SELECT COUNT(*) as total_beers 
FROM event_beers eb 
INNER JOIN event_users eu ON eb.userId = eu.user_id 
INNER JOIN event e ON eu.event_id = e.id 
WHERE e.isActive = 1;

-- Check all beers in the event (including removed users)
SELECT 'All beers in event (including removed users):' as info;
SELECT COUNT(*) as total_beers 
FROM event_beers eb 
WHERE eb.eventId = '7fa4c8c4-5b74-4deb-af3e-ca0c0f1f3dc5';

-- Show the difference
SELECT 'Beers from removed users:' as info;
SELECT COUNT(*) as removed_user_beers 
FROM event_beers eb 
WHERE eb.eventId = '7fa4c8c4-5b74-4deb-af3e-ca0c0f1f3dc5' 
AND eb.userId NOT IN (
  SELECT eu.user_id 
  FROM event_users eu 
  WHERE eu.event_id = '7fa4c8c4-5b74-4deb-af3e-ca0c0f1f3dc5'
);
