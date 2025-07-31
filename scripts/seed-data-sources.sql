-- SQL script to seed data broker sources
-- Run this in your Supabase SQL Editor

INSERT INTO data_sources (name, url, api_endpoint, risk_level, description, data_types, is_active) VALUES
  (
    'Searchbug People Search',
    'https://searchbug.com',
    '/api/data-broker/searchbug',
    'high',
    'Advanced person search with comprehensive contact information',
    ARRAY['name', 'age', 'address', 'phone', 'email', 'relatives', 'aliases', 'bankruptcy'],
    true
  ),
  (
    'Searchbug Background Check',
    'https://searchbug.com',
    '/api/data-broker/searchbug',
    'high',
    'Background check with criminal records and personal information',
    ARRAY['name', 'criminal_records', 'address', 'phone', 'court_records', 'evictions'],
    true
  ),
  (
    'Searchbug Criminal Records',
    'https://searchbug.com',
    '/api/data-broker/searchbug',
    'high',
    'Criminal records database search',
    ARRAY['name', 'criminal_records', 'offense', 'jurisdiction', 'disposition'],
    true
  ),
  (
    'Searchbug Property Records',
    'https://searchbug.com',
    '/api/data-broker/searchbug',
    'medium',
    'Property owner information and records',
    ARRAY['name', 'address', 'property_value', 'owner_info', 'phone'],
    true
  ),
  (
    'PeopleSmart',
    'https://peoplesmart.com',
    '/api/scrape-broker',
    'medium',
    'Public records and contact information via web scraping',
    ARRAY['name', 'address', 'phone', 'relatives', 'age'],
    true
  ),
  (
    'Instant Checkmate',
    'https://instantcheckmate.com',
    '/api/scrape-broker',
    'high',
    'Background check service with comprehensive reports via web scraping',
    ARRAY['name', 'criminal_records', 'court_records', 'address_history', 'phone', 'email'],
    true
  ),
  (
    'BeenVerified',
    'https://beenverified.com',
    '/api/scrape-broker',
    'medium',
    'Background checks and social media profiles via web scraping',
    ARRAY['name', 'email', 'social_media', 'criminal_records', 'education'],
    true
  ),
  (
    'Spokeo',
    'https://spokeo.com',
    '/api/scrape-broker',
    'high',
    'Comprehensive people search with detailed personal information via web scraping',
    ARRAY['name', 'age', 'address', 'phone', 'email', 'relatives', 'social_media'],
    true
  ),
  (
    'WhitePages',
    'https://whitepages.com',
    '/api/scrape-broker',
    'medium',
    'Contact information and address history lookup via web scraping',
    ARRAY['name', 'phone', 'address', 'address_history'],
    true
  ),
  (
    'TruePeopleSearch',
    'https://truepeoplesearch.com',
    '/api/scrape-broker',
    'low',
    'Basic public records and contact information via web scraping',
    ARRAY['name', 'address', 'phone', 'relatives'],
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Verify the data was inserted
SELECT 
  name, 
  risk_level, 
  array_length(data_types, 1) as data_type_count,
  is_active 
FROM data_sources 
ORDER BY risk_level DESC, name;