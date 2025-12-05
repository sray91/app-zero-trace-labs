# APIFY Skip Trace Integration

## Overview

This project has been updated to use the APIFY Skip Trace API instead of the previous web scraping system. APIFY provides professional-grade skip tracing and people search capabilities through their actor platform.

## Setup Instructions

### 1. Get Your APIFY API Token

1. Go to [APIFY Console](https://console.apify.com/account/integrations)
2. Sign up or log in to your account
3. Navigate to Account > Integrations
4. Copy your API token

### 2. Configure Environment Variables

Create a `.env.local` file in your project root with the following:

```bash
# APIFY Configuration
APIFY_API_TOKEN=your_actual_apify_api_token_here

# Replace 'your_actual_apify_api_token_here' with your real APIFY API token
```

### 3. Verify Integration

The integration includes:

- **API Route**: `/api/apify-skip-trace` - Handles APIFY API calls
- **Service Module**: `lib/api-services/apify-skip-trace.js` - Data transformation and validation
- **Updated Hook**: `lib/hooks/useDataBroker.js` - Now uses APIFY instead of web scraping

## How It Works

### Search Flow

1. User enters search parameters (name, phone, email, address)
2. Application calls `/api/apify-skip-trace` endpoint
3. API route validates parameters and calls APIFY actor `vmf6h5lxPAkB1W2gT`
4. APIFY returns comprehensive skip trace results
5. Results are transformed to our standard format
6. Data is displayed in the existing UI components

### Data Types Found

APIFY Skip Trace can find:

- **Personal Information**: Name, Age, Address, Phone, Email
- **Historical Data**: Previous addresses, phone numbers, email addresses
- **Relationships**: Relatives, Associates
- **Professional**: Employment, Education, Professional licenses
- **Public Records**: Criminal records, Court records, Property records
- **Social Media**: Profiles and accounts
- **Financial**: Bankruptcy records, Business records

### API Input Format

The APIFY actor expects:

```javascript
{
  "max_results": 5,
  "name": ["Full Name"],
  "street_citystatezip": ["123 Main St, City, State 12345"],
  "phone_number": ["(555) 123-4567"],
  "email": ["email@example.com"]
}
```

### API Response Format

The transformed response includes:

```javascript
{
  "success": true,
  "source": "APIFY Skip Trace",
  "data_found": ["Name", "Address", "Phone", "Email", "..."],
  "description": "APIFY Skip Trace found 3 record(s) with 8 data categories",
  "details": {
    "total_records": 3,
    "records": [/* detailed records */]
  },
  "confidence": "high",
  "actor_run_id": "run_abc123",
  "raw_results": [/* original APIFY response */]
}
```

## Testing

### Basic Test

1. Start the development server: `npm run dev`
2. Navigate to your application
3. Enter test search parameters:
   - **Name**: "John Smith"
   - **Phone**: "(555) 123-4567"
   - **Email**: "john@example.com"
   - **Address**: "123 Main St, Anytown, CA 90210"
4. Verify the search completes and returns results

### API Test

You can test the API directly:

```bash
curl -X POST http://localhost:3000/api/apify-skip-trace \
  -H "Content-Type: application/json" \
  -d '{
    "searchParams": {
      "fullName": "John Smith",
      "phone": "(555) 123-4567",
      "email": "john@example.com",
      "address": "123 Main St, Anytown, CA 90210"
    },
    "maxResults": 5
  }'
```

## Migration Notes

### What Changed

1. **Replaced Web Scraping**: The previous system scraped multiple data broker websites individually
2. **Centralized API**: Now uses APIFY's aggregated skip trace service
3. **Better Data Quality**: APIFY provides professional-grade, structured data
4. **Faster Searches**: Single API call instead of multiple scraping operations
5. **Higher Reliability**: No more CORS issues or website blocking

### Backward Compatibility

- All existing UI components continue to work
- Search result format remains the same
- User authentication and history saving unchanged
- All existing features (email campaigns, reports, etc.) still functional

### Cost Considerations

- APIFY Skip Trace typically costs per search
- Check your APIFY pricing plan for exact costs
- Previous system was "free" but unreliable and potentially violated ToS

## Troubleshooting

### Common Issues

1. **"APIFY API token not configured"**
   - Ensure `APIFY_API_TOKEN` is set in your `.env.local` file
   - Verify the token is correct from APIFY console

2. **"APIFY Skip Trace search failed"**
   - Check your APIFY account credits
   - Verify the actor ID `vmf6h5lxPAkB1W2gT` is correct
   - Check network connectivity

3. **"No records found"**
   - Try different search parameters
   - Ensure at least name + one other field is provided
   - Some names may genuinely have no public records

### Debug Mode

Enable detailed logging by checking browser console and server logs. The integration includes comprehensive logging at each step.

## Performance Optimization

- Searches typically complete in 10-30 seconds
- Results are cached in user's search history
- Use `maxResults` parameter to control data volume and cost
- Consider batching multiple searches for bulk operations

## Support

For APIFY-specific issues:
- [APIFY Documentation](https://docs.apify.com/)
- [APIFY Support](https://apify.com/support)

For integration issues:
- Check browser console for client-side errors
- Check server logs for API errors
- Verify environment variables are set correctly