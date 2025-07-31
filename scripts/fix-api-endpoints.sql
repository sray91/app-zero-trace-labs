-- Quick fix for API endpoints to use internal routes instead of external URLs
-- Run this in your Supabase SQL Editor

-- Update Searchbug endpoints to use internal API route
UPDATE data_sources 
SET api_endpoint = '/api/data-broker/searchbug' 
WHERE name LIKE 'Searchbug%';

-- Update scraping-based brokers to use scrape-broker endpoint
UPDATE data_sources 
SET api_endpoint = '/api/scrape-broker' 
WHERE name IN (
  'Spokeo', 
  'WhitePages', 
  'BeenVerified', 
  'TruePeopleSearch', 
  'Intelius', 
  'MyLife', 
  'PeopleFinders', 
  'InstantCheckmate', 
  'Instant Checkmate',
  'PeopleSmart'
);

-- Remove any external HTTP API endpoints that would cause CORS issues
UPDATE data_sources 
SET api_endpoint = '/api/scrape-broker' 
WHERE api_endpoint LIKE 'https://%' OR api_endpoint LIKE 'http://%';

-- Verify the changes
SELECT name, api_endpoint, is_active 
FROM data_sources 
ORDER BY risk_level DESC, name;