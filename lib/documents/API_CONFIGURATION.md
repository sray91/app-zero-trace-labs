# API Configuration Guide

This guide explains how to configure real API endpoints for your data broker search application.

## Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

### Required Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### General API Configuration
```bash
NEXT_PUBLIC_API_KEY=your_main_api_key_for_data_brokers
```

### Data Broker API Endpoints
```bash
# Spokeo API
NEXT_PUBLIC_SPOKEO_API_ENDPOINT=https://api.spokeo.com/v1/search
SPOKEO_API_KEY=your_spokeo_api_key

# WhitePages API
NEXT_PUBLIC_WHITEPAGES_API_ENDPOINT=https://api.whitepages.com/v2/person
WHITEPAGES_API_KEY=your_whitepages_api_key

# BeenVerified API
NEXT_PUBLIC_BEENVERIFIED_API_ENDPOINT=https://api.beenverified.com/v1/people
BEENVERIFIED_API_KEY=your_beenverified_api_key

# TruePeopleSearch API
NEXT_PUBLIC_TRUEPEOPLESEARCH_API_ENDPOINT=https://api.truepeoplesearch.com/v1/search
TRUEPEOPLESEARCH_API_KEY=your_truepeoplesearch_api_key

# Intelius API
NEXT_PUBLIC_INTELIUS_API_ENDPOINT=https://api.intelius.com/v1/person
INTELIUS_API_KEY=your_intelius_api_key
```

## Database Setup

1. **Initialize Data Sources**: Call the `initializeDataSources()` function from your component to seed the database:

```javascript
import { useDataBroker } from '@/lib/hooks/useDataBroker'

function AdminPanel() {
  const { initializeDataSources } = useDataBroker()
  
  const handleInitialize = async () => {
    const result = await initializeDataSources()
    console.log(result.message)
  }
  
  return (
    <button onClick={handleInitialize}>
      Initialize Data Sources
    </button>
  )
}
```

2. **Create Database Tables**: Make sure you have created the required tables in your Supabase database:

```sql
-- Search History Table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  results JSONB,
  user_id UUID REFERENCES auth.users(id)
);

-- Data Sources Table
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  api_endpoint TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  description TEXT,
  data_types TEXT[],
  is_active BOOLEAN DEFAULT true
);

-- Removal Requests Table
CREATE TABLE IF NOT EXISTS removal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  data_source_id UUID REFERENCES data_sources(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT CHECK (status IN ('pending', 'submitted', 'completed', 'failed')) DEFAULT 'pending',
  notes TEXT
);
```

## API Integration Notes

### Request Format
The application sends requests to each API endpoint with this structure:
```json
{
  "query": {
    "full_name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  }
}
```

### Response Transformation
Each API has its own response transformer function:
- `transformSpokeoResponse()`
- `transformWhitePagesResponse()`
- `transformBeenVerifiedResponse()`
- `transformTruePeopleSearchResponse()`
- `transformInteliusResponse()`

Customize these functions based on the actual API response formats.

### Error Handling
- Failed API calls are logged as warnings and don't break the search
- The application continues searching other sources if one fails
- Users see a "No data found" message if all APIs fail or return no results

### Rate Limiting
Consider implementing rate limiting based on your API providers' requirements:
- Add delays between requests
- Implement queue systems for high-volume usage
- Handle rate limit responses gracefully

## Testing
1. Start with one API endpoint to test the integration
2. Verify the response transformation works correctly
3. Test error handling by using invalid endpoints
4. Check that search history is saved properly

## Alternative APIs
You can add other people search APIs by:
1. Adding the endpoint to your data sources in Supabase
2. Creating a transformer function for the response format
3. Adding the case to the `transformApiResponse()` switch statement