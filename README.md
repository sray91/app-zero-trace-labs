# Data Broker Search Application

A comprehensive React application built with Next.js, TailwindCSS, and Supabase that allows users to search for their personal information across data broker websites and manage removal requests.

## Features

- 🔍 **Search Functionality**: Search for personal information across multiple data broker sites
- 🔐 **User Authentication**: Secure sign-up/sign-in with Supabase Auth
- 📊 **Risk Assessment**: Color-coded risk levels for different data broker sites
- 📝 **Search History**: Track and view previous searches (authenticated users)
- 🗑️ **Removal Requests**: Submit and track data removal requests
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🛡️ **Privacy Focused**: Clear privacy notices and data handling transparency

## Technology Stack

- **Frontend**: React 18, Next.js-style components
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Custom components with shadcn/ui design patterns
- **Icons**: Lucide React
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn
- Supabase account (free tier available)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   cd data-broker-app-standalone
   pnpm install
   # or
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Supabase Database Setup**
   
   Create the following tables in your Supabase dashboard:

   ```sql
   -- Search history table
   CREATE TABLE search_history (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     full_name TEXT NOT NULL,
     phone TEXT,
     email TEXT,
     results JSONB,
     user_id UUID REFERENCES auth.users(id)
   );

   -- Data sources table
   CREATE TABLE data_sources (
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

   -- Removal requests table
   CREATE TABLE removal_requests (
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

4. **Enable Row Level Security (RLS)**
   
   Run these policies in your Supabase SQL editor:

   ```sql
   -- Search history policies
   ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can view own search history" ON search_history
     FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own search history" ON search_history
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Removal requests policies
   ALTER TABLE removal_requests ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can view own removal requests" ON removal_requests
     FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own removal requests" ON removal_requests
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Data sources policies
   ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Anyone can view active data sources" ON data_sources
     FOR SELECT USING (is_active = true);
   ```

5. **Start Development Server**
   ```bash
   pnpm run dev
   # or
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/
│   └── ui/                 # Reusable UI components
├── contexts/
│   └── AuthContext.jsx     # Authentication context provider
├── hooks/
│   └── useDataBroker.js    # Custom hook for data operations
├── lib/
│   └── supabase.js         # Supabase configuration and operations
├── assets/                 # Static assets
├── App.jsx                 # Main application component
├── App.css                 # Global styles and Tailwind config
├── main.jsx                # Application entry point
└── index.css               # Base styles
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL | Yes |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `REACT_APP_PEOPLE_DATA_LABS_API_KEY` | People Data Labs API key | No |
| `REACT_APP_TRESTLE_API_KEY` | Trestle API key | No |
| `REACT_APP_OPTERY_API_KEY` | Optery API key | No |

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your URL and anon key
3. Enable email authentication in Authentication > Settings
4. Run the SQL commands provided above to create tables
5. Set up RLS policies for security

## Deployment

### Build for Production

```bash
pnpm run build
# or
npm run build
```

### Deployment Options

**Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

**Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Static Hosting**
Upload the `dist` folder to any static hosting service.

## Customization

### Adding Real Data Broker APIs

Replace the mock search function in `src/hooks/useDataBroker.js` with real API calls:

```javascript
const performSearch = async (searchParams) => {
  // Add your API integrations here
  // Examples: People Data Labs, Trestle, Optery APIs
}
```

### Styling Customization

- Modify `src/App.css` for global styles
- Update Tailwind classes in components for design changes
- Customize color scheme in the CSS variables

### Adding Features

- **Email Notifications**: Integrate with email services
- **Admin Dashboard**: Add admin interface for managing requests
- **Analytics**: Track usage and search patterns
- **API Rate Limiting**: Implement request throttling

## Security Considerations

- Never expose service keys in client-side code
- Use environment variables for all sensitive data
- Enable RLS on all Supabase tables
- Implement proper input validation
- Follow GDPR/CCPA compliance guidelines

## Troubleshooting

### Common Issues

1. **Blank Screen**: Check browser console for errors, verify environment variables
2. **Authentication Errors**: Verify Supabase configuration and email settings
3. **Database Errors**: Ensure tables are created and RLS policies are set
4. **Build Errors**: Check for missing dependencies or syntax errors

### Support

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review [React Documentation](https://react.dev)
- Consult [Vite Documentation](https://vitejs.dev)

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### v1.0.0
- Initial release with core search functionality
- User authentication and data management
- Responsive design and accessibility features
- Supabase integration for backend services

