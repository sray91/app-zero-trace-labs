# Real Data Broker API Setup Guide

This guide will help you configure real data broker APIs instead of mock data. Follow these steps to get actual search results.

## 🚀 Quick Start

### 1. Copy Environment Template
```bash
cp .env.example .env.local
```

### 2. Set Up Supabase (Required)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your Project URL and anon key from Settings > API
3. Add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Database Seeding
```bash
# Go to your Supabase SQL Editor and run:
# Copy-paste the contents of scripts/seed-data-sources.sql
```

### 4. Set Up Primary Data Broker API

**Recommended: Searchbug (Most Comprehensive)**
1. Sign up at [searchbug.com/api/](https://searchbug.com/api/)
2. Add a prepaid balance ($10 minimum for testing)
3. Get your API key and add to `.env.local`:
```env
SEARCHBUG_API_KEY=your-searchbug-api-key
```

## 🔍 Available Real APIs

### Tier 1: Comprehensive APIs (Recommended)

#### Searchbug
- **Best for**: Comprehensive people search, background checks
- **Cost**: $0.30-$0.77 per hit (volume discounts)
- **Coverage**: Name, address, phone, relatives, criminal records
- **Setup**: [searchbug.com/api/](https://searchbug.com/api/)
- **Environment Variable**: `SEARCHBUG_API_KEY`

### Tier 2: Specialized APIs

#### PeopleDataLabs
- **Best for**: Professional/business contact data
- **Cost**: $0.001-$0.05 per record
- **Coverage**: Professional info, social media, company data
- **Setup**: [peopledatalabs.com](https://peopledatalabs.com/)
- **Environment Variable**: `PEOPLE_DATA_LABS_API_KEY`

#### Hunter.io
- **Best for**: Email finding and verification
- **Cost**: Free tier available, then $49/month
- **Coverage**: Professional email addresses
- **Setup**: [hunter.io](https://hunter.io/)
- **Environment Variable**: `HUNTER_IO_API_KEY`

### Tier 3: Web Scraping (Included)

The system also includes intelligent web scraping for major data brokers:
- Spokeo
- WhitePages  
- BeenVerified
- InstantCheckmate
- TruePeopleSearch
- PeopleSmart

These use realistic search patterns and return actual data structure without mock responses.

## 💰 Cost Management

### Testing Budget
- Start with $10-20 in Searchbug credits for testing
- Monitor usage in your dashboard
- Implement rate limiting for production

### Production Considerations
```env
# Add to .env.local
RATE_LIMIT_PER_MINUTE=60
DEBUG_MODE=false
```

### Cost Per Search Estimate
- **Searchbug**: ~$0.50 per person (4 API calls)
- **Web Scraping**: ~$0.05 per person (server costs)
- **Mixed approach**: ~$0.25 per person

## 🛡️ Security & Compliance

### API Key Security
```bash
# Never commit .env.local to git
echo ".env.local" >> .gitignore

# Use environment variables in production
# Never hardcode API keys in source code
```

### Rate Limiting
The system includes built-in rate limiting to prevent API abuse:
- Default: 60 requests per minute per user
- Configurable via `RATE_LIMIT_PER_MINUTE`

### Legal Compliance
- All API providers require compliance with their terms of service
- Searchbug is FCRA compliant for background checks
- Implement proper data retention policies
- Include privacy policy for your users

## 🔧 Testing Your Setup

### 1. Verify Environment Variables
```bash
npm run dev
# Check console for "Missing API key" warnings
```

### 2. Test a Search
1. Enter a common name like "John Smith"
2. Check the browser network tab for API calls
3. Verify no mock data warnings in console

### 3. Monitor API Usage
- Check Searchbug dashboard for usage
- Monitor server logs for errors
- Test rate limiting with multiple searches

## 🚨 Troubleshooting

### No Results Showing
1. Check `.env.local` file exists and has correct keys
2. Verify Supabase data sources are seeded
3. Check browser console for API errors
4. Restart dev server after env changes

### API Errors
1. Verify API keys are correct (no extra spaces)
2. Check API provider dashboards for account status
3. Ensure sufficient credit balance
4. Check rate limits aren't exceeded

### Database Issues
1. Run the SQL seeding script in Supabase
2. Check RLS policies allow public read access
3. Verify table structure matches expected schema

## 📞 Support

### API Provider Support
- **Searchbug**: support@searchbug.com, 800-990-2939
- **PeopleDataLabs**: support@peopledatalabs.com
- **Hunter.io**: help@hunter.io

### Common Issues
- **"No data sources found"**: Run the SQL seeding script
- **"API key invalid"**: Check API key format and account status
- **"Rate limit exceeded"**: Wait or upgrade API plan
- **"Insufficient funds"**: Add credit to API provider account

## 🎯 Production Deployment

### Environment Variables (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-key
SEARCHBUG_API_KEY=your-production-searchbug-key
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_PER_MINUTE=30
```

### Recommended Production Setup
1. Use Vercel/Netlify for hosting
2. Configure environment variables in platform dashboard
3. Set up monitoring and alerting
4. Implement usage analytics
5. Add billing integration for user limits

## 📊 Analytics & Monitoring

Track these metrics in production:
- API call success/failure rates
- Cost per search
- User search patterns
- Data broker response times
- Rate limit violations

This ensures optimal performance and cost management for your data broker search application.