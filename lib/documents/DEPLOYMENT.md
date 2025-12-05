# Deployment Guide

This guide covers various deployment options for the Data Broker Search application.

## Prerequisites

- Node.js 18+ installed
- Supabase account and project set up
- Environment variables configured

## Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Production Deployment

### Option 1: Vercel (Recommended)

Vercel provides seamless deployment with automatic builds and environment variable management.

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Environment Variables**
   - Go to your Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add your Supabase credentials:
     - `REACT_APP_SUPABASE_URL`
     - `REACT_APP_SUPABASE_ANON_KEY`

4. **Custom Domain (Optional)**
   - Add your custom domain in the Vercel dashboard
   - Update DNS settings as instructed

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**
   ```bash
   pnpm run build
   netlify deploy --prod --dir=dist
   ```

3. **Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add your Supabase credentials

### Option 3: Static Hosting (AWS S3, GitHub Pages, etc.)

1. **Build the Application**
   ```bash
   pnpm run build
   ```

2. **Upload dist folder**
   - Upload the entire `dist` folder to your hosting service
   - Configure your web server to serve `index.html` for all routes

3. **Environment Variables**
   - Since this is a client-side app, environment variables are built into the bundle
   - Ensure they're set during the build process

### Option 4: Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf**
   ```nginx
   events {
     worker_connections 1024;
   }

   http {
     include /etc/nginx/mime.types;
     default_type application/octet-stream;

     server {
       listen 80;
       server_name localhost;
       root /usr/share/nginx/html;
       index index.html;

       location / {
         try_files $uri $uri/ /index.html;
       }
     }
   }
   ```

3. **Build and Run**
   ```bash
   docker build -t data-broker-search .
   docker run -p 80:80 data-broker-search
   ```

## Environment Configuration

### Required Environment Variables

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Optional API Keys
REACT_APP_PEOPLE_DATA_LABS_API_KEY=your-pdl-key
REACT_APP_TRESTLE_API_KEY=your-trestle-key
REACT_APP_OPTERY_API_KEY=your-optery-key
```

### Security Notes

- Never commit `.env` files to version control
- Use your deployment platform's environment variable management
- Rotate API keys regularly
- Monitor usage and set up alerts for unusual activity

## Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test user registration and login functionality
- [ ] Confirm search functionality works
- [ ] Check that database operations are working
- [ ] Test on different devices and browsers
- [ ] Set up monitoring and error tracking
- [ ] Configure custom domain (if applicable)
- [ ] Set up SSL certificate
- [ ] Test email functionality (if enabled)
- [ ] Verify privacy policy and legal pages

## Monitoring and Maintenance

### Error Tracking

Consider integrating error tracking services:

```bash
# Sentry
npm install @sentry/react

# LogRocket
npm install logrocket
```

### Performance Monitoring

- Use Vercel Analytics or similar
- Monitor Core Web Vitals
- Set up uptime monitoring
- Track user engagement metrics

### Updates and Maintenance

- Regularly update dependencies
- Monitor Supabase usage and billing
- Review and update privacy policies
- Backup database regularly
- Monitor API rate limits and usage

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Ensure environment variables are available during build

2. **Runtime Errors**
   - Check browser console for errors
   - Verify Supabase connection
   - Confirm environment variables are loaded

3. **Authentication Issues**
   - Verify Supabase project settings
   - Check email provider configuration
   - Confirm redirect URLs are set correctly

4. **Database Connection Problems**
   - Verify database tables exist
   - Check RLS policies
   - Confirm API keys have correct permissions

### Performance Optimization

- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading for components
- Optimize images and assets
- Monitor bundle size and split code if needed

## Support

For deployment issues:
1. Check the deployment platform's documentation
2. Review error logs and console output
3. Verify environment configuration
4. Test locally with production build
5. Contact support if issues persist

