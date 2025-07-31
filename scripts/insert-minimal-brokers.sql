-- Minimal SQL to insert core brokers - uses only essential columns
-- This should work with any data_sources table structure

INSERT INTO data_sources (name, url, risk_level, description, is_active) VALUES

-- Essential high-priority brokers
('Spokeo', 'https://spokeo.com', 'high', 'Comprehensive people search with detailed personal information', true),
('MyLife', 'https://mylife.com', 'high', 'Detailed personal profiles with reputation scores', true),
('FastPeopleSearch', 'https://fastpeoplesearch.com', 'high', 'Fast people search with detailed personal information', true),
('ThatsThem', 'https://thatsthem.com', 'high', 'Free people search with contact and background information', true),
('WhitePages', 'https://whitepages.com', 'medium', 'Contact information and address history lookup', true),
('Radaris', 'https://radaris.com', 'medium', 'Public records aggregator with contact information', true),
('TruePeopleSearch', 'https://truepeoplesearch.com', 'medium', 'Free people search with basic public records', true)

ON CONFLICT (name) DO UPDATE SET
  url = EXCLUDED.url,
  risk_level = EXCLUDED.risk_level,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Verify the data was inserted
SELECT name, risk_level, is_active FROM data_sources ORDER BY name;