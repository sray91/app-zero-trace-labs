-- SQL to insert comprehensive public broker sites into data_sources table
-- This includes the expanded list of major data broker and people-search sites

-- First, add missing columns if they don't exist
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS scan_priority INTEGER DEFAULT 2;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS opt_out_url TEXT;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Now insert the data
INSERT INTO data_sources (name, url, api_endpoint, risk_level, description, data_types, opt_out_url, contact_email, scan_priority, is_active) VALUES

-- Tier 1: High-risk comprehensive brokers (Priority 1)
(
  'MyLife',
  'https://mylife.com',
  '/api/scrape-broker',
  'high',
  'Detailed personal profiles with reputation scores and background information',
  ARRAY['name', 'age', 'address', 'phone', 'email', 'reputation', 'background', 'social_media', 'relatives'],
  'https://www.mylife.com/opt-out/',
  'privacy@mylife.com',
  1,
  true
),
(
  'PeopleFindersFree',
  'https://peoplefindersfree.com',
  '/api/scrape-broker',
  'high',
  'Free people search with comprehensive contact information',
  ARRAY['name', 'address', 'phone', 'relatives', 'criminal_records', 'court_records'],
  'https://www.peoplefindersfree.com/opt-out',
  'privacy@peoplefindersfree.com',
  1,
  true
),
(
  'InstantCheckmate',
  'https://instantcheckmate.com',
  '/api/scrape-broker',
  'high',
  'Background check service with comprehensive reports',
  ARRAY['name', 'criminal_records', 'court_records', 'address_history', 'phone', 'email', 'aliases'],
  'https://www.instantcheckmate.com/opt-out/',
  'privacy@instantcheckmate.com',
  1,
  true
),
(
  'Pipl',
  'https://pipl.com',
  '/api/scrape-broker',
  'high',
  'Professional people search engine with deep web data',
  ARRAY['name', 'email', 'phone', 'social_media', 'professional_info', 'education'],
  'https://pipl.com/personal-information-removal-request',
  'privacy@pipl.com',
  1,
  true
),
(
  'FastPeopleSearch',
  'https://fastpeoplesearch.com',
  '/api/scrape-broker',
  'high',
  'Fast people search with detailed personal information',
  ARRAY['name', 'address', 'phone', 'age', 'relatives', 'email', 'social_media'],
  'https://www.fastpeoplesearch.com/removal',
  'privacy@fastpeoplesearch.com',
  1,
  true
),
(
  'ThatsThem',
  'https://thatsthem.com',
  '/api/scrape-broker',
  'high',
  'Free people search with contact and background information',
  ARRAY['name', 'address', 'phone', 'email', 'age', 'relatives', 'neighbors'],
  'https://thatsthem.com/optout',
  'privacy@thatsthem.com',
  1,
  true
),
(
  'CheckPeople',
  'https://checkpeople.com',
  '/api/scrape-broker',
  'high',
  'People search and background check service',
  ARRAY['name', 'address', 'phone', 'email', 'criminal_records', 'court_records', 'social_media'],
  'https://www.checkpeople.com/opt-out',
  'privacy@checkpeople.com',
  1,
  true
),
(
  'Intelius',
  'https://intelius.com',
  '/api/scrape-broker',
  'high',
  'Comprehensive background checks and people search',
  ARRAY['name', 'address', 'phone', 'email', 'criminal_records', 'court_records', 'property_records'],
  'https://www.intelius.com/opt-out',
  'privacy@intelius.com',
  1,
  true
),

-- Tier 2: Medium-risk public record aggregators (Priority 2)
(
  'Radaris',
  'https://radaris.com',
  '/api/scrape-broker',
  'medium',
  'Public records aggregator with contact information',
  ARRAY['name', 'address', 'phone', 'age', 'relatives', 'education', 'employment'],
  'https://radaris.com/page/how-to-remove',
  'privacy@radaris.com',
  2,
  true
),
(
  'PeopleFinders',
  'https://peoplefinders.com',
  '/api/scrape-broker',
  'medium',
  'Public records and contact information search',
  ARRAY['name', 'address', 'phone', 'relatives', 'criminal_records', 'property_records'],
  'https://www.peoplefinders.com/opt-out',
  'privacy@peoplefinders.com',
  2,
  true
),
(
  'USSearch',
  'https://ussearch.com',
  '/api/scrape-broker',
  'medium',
  'People search and background check service',
  ARRAY['name', 'address', 'phone', 'age', 'relatives', 'criminal_records'],
  'https://www.ussearch.com/consumer/ala/landing.do?did=590',
  'privacy@ussearch.com',
  2,
  true
),
(
  'PublicRecordsNow',
  'https://publicrecordsnow.com',
  '/api/scrape-broker',
  'medium',
  'Public records search and people finder',
  ARRAY['name', 'address', 'phone', 'criminal_records', 'court_records', 'property_records'],
  'https://publicrecordsnow.com/static/view/optout/',
  'privacy@publicrecordsnow.com',
  2,
  true
),
(
  'Addresses',
  'https://addresses.com',
  '/api/scrape-broker',
  'medium',
  'Address and contact information database',
  ARRAY['name', 'address', 'phone', 'email', 'relatives', 'neighbors'],
  'https://www.addresses.com/optout.php',
  'privacy@addresses.com',
  2,
  true
),
(
  'VoterRecords',
  'https://voterrecords.com',
  '/api/scrape-broker',
  'medium',
  'Voter registration and public records search',
  ARRAY['name', 'address', 'age', 'political_affiliation', 'voting_history'],
  'https://voterrecords.com/faq',
  'privacy@voterrecords.com',
  2,
  true
),
(
  'WhitePages',
  'https://whitepages.com',
  '/api/scrape-broker',
  'medium',
  'Contact information and address history lookup',
  ARRAY['name', 'phone', 'address', 'address_history', 'relatives'],
  'https://www.whitepages.com/suppression_requests',
  'privacy@whitepages.com',
  2,
  true
),
(
  'TruePeopleSearch',
  'https://truepeoplesearch.com',
  '/api/scrape-broker',
  'medium',
  'Free people search with basic public records',
  ARRAY['name', 'address', 'phone', 'relatives', 'age_range'],
  'https://www.truepeoplesearch.com/removal',
  'privacy@truepeoplesearch.com',
  2,
  true
),
(
  'FamilyTreeNow',
  'https://familytreenow.com',
  '/api/scrape-broker',
  'medium',
  'Genealogy and family history records',
  ARRAY['name', 'relatives', 'birth_info', 'family_tree', 'historical_records'],
  'https://www.familytreenow.com/optout',
  'privacy@familytreenow.com',
  2,
  true
),

-- Tier 3: Standard directory services (Priority 3)
(
  'AnyWho',
  'https://anywho.com',
  '/api/scrape-broker',
  'low',
  'Online phone book and people directory',
  ARRAY['name', 'address', 'phone'],
  'https://www.anywho.com/optout',
  'privacy@anywho.com',
  3,
  true
),
(
  'YellowPages',
  'https://yellowpages.com',
  '/api/scrape-broker',
  'low',
  'Business and residential directory service',
  ARRAY['name', 'phone', 'address', 'business_info'],
  'https://corporate.thryv.com/privacy/',
  'privacy@yellowpages.com',
  3,
  true
)

ON CONFLICT (name) DO UPDATE SET
  url = EXCLUDED.url,
  api_endpoint = EXCLUDED.api_endpoint,
  risk_level = EXCLUDED.risk_level,
  description = EXCLUDED.description,
  data_types = EXCLUDED.data_types,
  opt_out_url = EXCLUDED.opt_out_url,
  contact_email = EXCLUDED.contact_email,
  scan_priority = EXCLUDED.scan_priority,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Update existing records to have default scan_priority if they don't
UPDATE data_sources SET scan_priority = 2 WHERE scan_priority IS NULL;

-- Verify the data was inserted
SELECT 
  name, 
  risk_level, 
  scan_priority,
  array_length(data_types, 1) as data_type_count,
  is_active 
FROM data_sources 
WHERE name IN (
  'MyLife', 'PeopleFindersFree', 'InstantCheckmate', 'Pipl', 'FastPeopleSearch', 
  'ThatsThem', 'CheckPeople', 'Intelius', 'Radaris', 'PeopleFinders', 
  'USSearch', 'PublicRecordsNow', 'Addresses', 'VoterRecords', 'WhitePages', 
  'TruePeopleSearch', 'FamilyTreeNow', 'AnyWho', 'YellowPages'
)
ORDER BY scan_priority ASC, risk_level DESC, name ASC;