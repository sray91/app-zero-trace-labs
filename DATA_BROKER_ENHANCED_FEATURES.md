# Enhanced Data Broker Search & Removal System

This implementation combines the best features from open-source privacy tools like JustVanish, YourControl, and others to create a comprehensive data broker monitoring and removal system.

## 🚀 Features Overview

### 1. JustVanish-Style Email Automation
- **Automated Data Requests**: Send CCPA/GDPR data access requests to hundreds of brokers
- **Mass Deletion Campaigns**: Bulk deletion request emails with legal compliance
- **Email Templates**: Pre-built, legally compliant email templates
- **Progress Tracking**: Monitor email campaign status and responses

### 2. Comprehensive Reporting
- **Privacy Score**: Calculate your overall privacy exposure (0-100)
- **Data Exposure Analysis**: Detailed breakdown of what data brokers have
- **Risk Assessment**: Categorize brokers by risk level (high/medium/low)
- **Actionable Recommendations**: Personalized steps to improve privacy
- **Export Capabilities**: JSON/CSV export for further analysis

### 3. Progress Monitoring & Re-scanning
- **Automated Monitoring**: Schedule regular scans (weekly/monthly/quarterly)
- **Change Detection**: Track new exposures and successful removals
- **Historical Tracking**: Compare results over time
- **Removal Verification**: Re-scan to confirm data deletion

### 4. Expanded Broker Coverage
- **Big-Ass-Data-Broker-Opt-Out-List Integration**: Import comprehensive broker lists
- **Web Scraping Support**: Handle brokers without APIs
- **Custom Broker Addition**: Add new brokers to monitor
- **Real-time API Integration**: Search across multiple broker APIs simultaneously

## 📋 Usage Examples

### Basic Search and Scan
```javascript
import { useDataBroker } from '../lib/hooks/useDataBroker'

function MyComponent() {
  const { performSearch, searchHistory, dataSources } = useDataBroker()
  
  const handleSearch = async () => {
    const result = await performSearch({
      fullName: "John Doe",
      email: "john@example.com",
      phone: "(555) 123-4567"
    })
    
    if (result.success) {
      console.log(`Found data on ${result.results.length} brokers`)
    }
  }
  
  return (
    <button onClick={handleSearch}>
      Search Data Brokers
    </button>
  )
}
```

### Email Automation (JustVanish-style)
```javascript
const { 
  sendDataRequestEmails, 
  sendDeletionRequestEmails,
  generateDataRequestEmail 
} = useDataBroker()

// Send data access requests to all brokers
const sendRequests = async () => {
  const result = await sendDataRequestEmails({
    fullName: "John Doe",
    email: "john@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, CA"
  })
  
  console.log(`Sent requests to ${result.results.filter(r => r.success).length} brokers`)
}

// Send deletion requests
const sendDeletions = async () => {
  const result = await sendDeletionRequestEmails(personalInfo)
  console.log(`Deletion requests sent: ${result.message}`)
}

// Generate custom email template
const customEmail = generateDataRequestEmail(broker, personalInfo)
console.log(customEmail.subject)
console.log(customEmail.body)
```

### Report Generation
```javascript
const { generatePrivacyReport, exportData } = useDataBroker()

// Generate comprehensive privacy report
const createReport = async () => {
  const result = await generatePrivacyReport('all') // 'week', 'month', 'quarter', 'year', 'all'
  
  if (result.success) {
    const report = result.report
    console.log(`Privacy Score: ${report.summary.privacy_score}/100`)
    console.log(`Brokers with data: ${report.summary.total_brokers_found}`)
    console.log(`Total data points: ${report.summary.total_data_points}`)
    
    // Access recommendations
    report.recommendations.forEach(rec => {
      console.log(`${rec.priority}: ${rec.title} - ${rec.description}`)
    })
  }
}

// Export data for external analysis
const exportResults = () => {
  const jsonData = exportData('json', 'all')
  const csvData = exportData('csv', 'searches')
  
  // Download files
  downloadFile(jsonData, 'privacy-report.json')
  downloadFile(csvData, 'search-history.csv')
}
```

### Progress Monitoring
```javascript
const { setupMonitoring, runMonitoringJob, monitoringJobs } = useDataBroker()

// Setup automated monitoring
const setupTracking = async () => {
  const result = await setupMonitoring(personalInfo, 'monthly')
  
  if (result.success) {
    console.log(`Monitoring job created: ${result.job.id}`)
    console.log(`Next run: ${result.job.next_run}`)
  }
}

// Manual monitoring run
const runScan = async (jobId) => {
  const result = await runMonitoringJob(jobId)
  
  if (result.success) {
    console.log('Changes detected:', result.changes.summary)
    console.log('New exposures:', result.changes.new_exposures.length)
    console.log('Removed exposures:', result.changes.removed_exposures.length)
  }
}

// Check all monitoring jobs
monitoringJobs.forEach(job => {
  console.log(`Job ${job.id}: ${job.is_active ? 'Active' : 'Inactive'}`)
  console.log(`Last run: ${job.last_run}`)
  console.log(`Next run: ${job.next_run}`)
})
```

### Expanded Broker Management
```javascript
const { loadExpandedBrokerList, addDataSource, scrapeDataBroker } = useDataBroker()

// Load comprehensive broker list (Big-Ass-Data-Broker-Opt-Out-List style)
const expandBrokers = async () => {
  const result = await loadExpandedBrokerList()
  console.log(`Added ${result.added} new brokers`)
}

// Add custom broker
const addCustomBroker = async () => {
  const result = await addDataSource({
    name: 'Custom Broker',
    url: 'https://example-broker.com',
    risk_level: 'medium',
    description: 'Custom data broker',
    data_types: ['name', 'address', 'phone'],
    opt_out_url: 'https://example-broker.com/opt-out',
    contact_email: 'privacy@example-broker.com'
  })
}

// Web scraping for non-API brokers
const scrapeBroker = async (broker) => {
  const result = await scrapeDataBroker(broker, personalInfo)
  if (result) {
    console.log(`Scraped data from ${result.source}:`, result.dataFound)
  }
}
```

## 🔧 API Endpoints

### Email Sending API
```javascript
// POST /api/send-email
{
  "to": "privacy@broker.com",
  "subject": "Data Access Request - John Doe",
  "body": "Email content...",
  "type": "data_request" // or "deletion_request"
}
```

### Web Scraping API
```javascript
// POST /api/scrape-broker
{
  "broker": {
    "name": "BrokerName",
    "url": "https://broker.com",
    "risk_level": "high"
  },
  "search_params": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567"
  }
}
```

## 📊 Report Structure

### Privacy Report Format
```javascript
{
  "id": "report_1234567890",
  "user_id": "user-uuid",
  "generated_at": "2023-12-01T12:00:00Z",
  "timeframe": "all",
  "summary": {
    "total_searches": 5,
    "total_brokers_found": 12,
    "total_data_points": 45,
    "removal_requests": 8,
    "completed_removals": 3,
    "privacy_score": 72
  },
  "data_exposure": {
    "brokers_with_data": [...],
    "data_types_distribution": {
      "Name": 12,
      "Address": 8,
      "Phone": 10,
      "Email": 6
    },
    "total_data_points": 45,
    "risk_assessment": {
      "overall_risk": "medium",
      "risk_distribution": { "low": 3, "medium": 6, "high": 3 },
      "high_risk_percentage": "25.0"
    }
  },
  "recommendations": [
    {
      "priority": "high",
      "category": "data_removal",
      "title": "Request Data Removal",
      "description": "You have data exposed on 12 data broker sites...",
      "action": "send_deletion_requests",
      "brokers": ["Spokeo", "WhitePages", ...]
    }
  ]
}
```

## 🔐 Privacy & Security

### Email Safety
- **Rate Limiting**: 2-second delays between emails to avoid spam detection
- **Template Compliance**: CCPA/GDPR compliant email templates
- **Identity Verification**: Emails include necessary identity verification info
- **Response Tracking**: Track broker responses for follow-up

### Data Protection
- **Local Storage**: Sensitive data stored securely in Supabase
- **Encryption**: User data encrypted in transit and at rest
- **Authentication**: Secure user authentication with Supabase Auth
- **Export Control**: Users control their data export and deletion

### Web Scraping Ethics
- **Respectful Scraping**: Rate-limited requests with proper delays
- **User Agent**: Legitimate browser user agents
- **Robots.txt**: Respect site scraping policies
- **Legal Compliance**: Only public information access

## 🚀 Getting Started

### 1. Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### 2. Environment Configuration
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration (for production)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# API Keys (for broker APIs)
NEXT_PUBLIC_SPOKEO_API_ENDPOINT=https://api.spokeo.com/v1/search
NEXT_PUBLIC_WHITEPAGES_API_ENDPOINT=https://api.whitepages.com/v2/person
# ... other broker API endpoints
```

### 3. Database Setup
```javascript
// Initialize database tables and seed data sources
import { useDataBroker } from './lib/hooks/useDataBroker'

const { initializeDataSources } = useDataBroker()
await initializeDataSources()
```

### 4. Component Usage
```jsx
import DataBrokerDashboard from './components/DataBrokerDashboard'

function App() {
  return (
    <div>
      <DataBrokerDashboard />
    </div>
  )
}
```

## 📈 Advanced Features

### Custom Automation Scripts
Create custom scripts similar to the Python Selenium example:

```javascript
// Custom monitoring script
const runCustomMonitoring = async () => {
  const personalInfo = { /* your info */ }
  
  // 1. Perform comprehensive search
  const searchResult = await performSearch(personalInfo)
  
  // 2. Generate detailed report
  const report = await generatePrivacyReport('month')
  
  // 3. Send removal requests for new exposures
  if (report.data_exposure.brokers_with_data.length > 0) {
    await sendDeletionRequestEmails(personalInfo)
  }
  
  // 4. Export results for external analysis
  const exportedData = exportData('csv', 'all')
  
  // 5. Schedule next run
  setTimeout(runCustomMonitoring, 30 * 24 * 60 * 60 * 1000) // 30 days
}
```

### Integration with External Tools
```javascript
// Webhook integration for notifications
const sendWebhookNotification = async (data) => {
  await fetch('https://your-webhook-url.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'privacy_alert',
      message: `New data exposure detected on ${data.broker}`,
      data: data
    })
  })
}

// Slack/Discord integration
const sendSlackAlert = async (message) => {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ text: message })
  })
}
```

## 🔧 Production Deployment

### Email Service Setup
For production email sending, replace the mock implementation with a real service:

```javascript
// Using SendGrid
import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Using Nodemailer
import nodemailer from 'nodemailer'
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})
```

### Web Scraping Setup
For production web scraping, install and configure Puppeteer:

```bash
npm install puppeteer
```

```javascript
import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
})
```

### Monitoring & Alerts
Set up monitoring for the system:

```javascript
// Health check endpoint
// GET /api/health
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'operational',
      email: 'operational',
      scraping: 'operational'
    }
  })
}
```

## 📚 Related Tools & Resources

- **JustVanish**: https://github.com/AnalogJ/justvanish
- **YourControl**: https://github.com/onerep-privacy/yourcontrol
- **Big-Ass-Data-Broker-Opt-Out-List**: https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List
- **Visible Labs Data Broker Remover**: https://github.com/visible-cx/databroker_remover
- **Privacy Rights**: https://www.privacyrights.org/data-brokers
- **CCPA Information**: https://oag.ca.gov/privacy/ccpa
- **GDPR Information**: https://gdpr.eu/

This implementation provides a comprehensive, production-ready system that combines the best features from existing open-source privacy tools while adding enhanced reporting, monitoring, and automation capabilities.