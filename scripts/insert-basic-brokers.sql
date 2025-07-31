-- Basic SQL to insert core public broker sites (without new columns)
-- Use this if you want to keep the existing table structure

INSERT INTO data_sources (name, url, api_endpoint, risk_level, description, data_types, is_active) VALUES

-- High-priority comprehensive brokers
(
  'Spokeo',
  'https://spokeo.com',
  '/api/scrape-broker',
  'high',
  'Comprehensive people search with detailed personal information',
  ARRAY['name', 'age', 'address', 'phone', 'email', 'relatives', 'social_media'],
  true
),
(
  'MyLife',
  'https://mylife.com',
  '/api/scrape-broker',
  'high',
  'Detailed personal profiles with reputation scores',
  ARRAY['name', 'age', 'address', 'phone', 'email', 'reputation', 'background'],
  true
),
(
  'FastPeopleSearch',
  'https://fastpeoplesearch.com',
  '/api/scrape-broker',
  'high',
  'Fast people search with detailed personal information',
  ARRAY['name', 'address', 'phone', 'age', 'relatives', 'email'],
  true
),
(
  'ThatsThem',
  'https://thatsthem.com',
  '/api/scrape-broker',
  'high',
  'Free people search with contact and background information',
  ARRAY['name', 'address', 'phone', 'email', 'age', 'relatives'],
  true
),
(
  'InstantCheckmate',
  'https://instantcheckmate.com',
  '/api/scrape-broker',
  'high',
  'Background check service with comprehensive reports',
  ARRAY['name', 'criminal_records', 'court_records', 'address_history', 'phone', 'email'],
  true
),

-- Medium-priority public record aggregators
(
  'WhitePages',
  'https://whitepages.com',
  '/api/scrape-broker',
  'medium',
  'Contact information and address history lookup',
  ARRAY['name', 'phone', 'address', 'address_history', 'relatives'],
  true
),
(
  'Radaris',
  'https://radaris.com',
  '/api/scrape-broker',
  'medium',
  'Public records aggregator with contact information',
  ARRAY['name', 'address', 'phone', 'age', 'relatives'],
  true
),
(
  'TruePeopleSearch',
  'https://truepeoplesearch.com',
  '/api/scrape-broker',
  'medium',
  'Free people search with basic public records',
  ARRAY['name', 'address', 'phone', 'relatives', 'age_range'],
  true
),
(
  'PeopleFinders',
  'https://peoplefinders.com',
  '/api/scrape-broker',
  'medium',
  'Public records and contact information search',
  ARRAY['name', 'address', 'phone', 'relatives', 'criminal_records'],
  true
),

-- Directory services
(
  'YellowPages',
  'https://yellowpages.com',
  '/api/scrape-broker',
  'low',
  'Business and residential directory service',
  ARRAY['name', 'phone', 'address', 'business_info'],
  true
)

ON CONFLICT (name) DO UPDATE SET
  url = EXCLUDED.url,
  api_endpoint = EXCLUDED.api_endpoint,
  risk_level = EXCLUDED.risk_level,
  description = EXCLUDED.description,
  data_types = EXCLUDED.data_types,
  is_active = EXCLUDED.is_active;

-- Verify the data was inserted
SELECT 
  name, 
  risk_level, 
  array_length(data_types, 1) as data_type_count,
  is_active 
FROM data_sources 
ORDER BY 
  CASE risk_level 
    WHEN 'high' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'low' THEN 3 
  END, 
  name;