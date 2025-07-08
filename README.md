# Mouna - Nanny Time Tracking App

Modern nanny time tracking and family management application.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://mouna.app
NEXT_PUBLIC_APP_NAME=Mouna

# Optional: If using custom domain for API
NEXT_PUBLIC_API_URL=https://api.mouna.app
```

## Domain Configuration

This app is configured to run on the `mouna.app` domain. The following configurations are in place:

- **package.json**: Homepage set to `https://mouna.app`
- **next.config.mjs**: Image domains configured for `mouna.app` and `www.mouna.app`
- **app/layout.tsx**: Metadata configured with proper OpenGraph and Twitter card settings for mouna.app

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up your environment variables (see above)

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

Run the SQL scripts in the `scripts/` directory in order:
1. `01-create-tables.sql`
2. `02-add-profile-picture.sql`
3. `03-add-timezone-support.sql`
4. `04-add-communication-features.sql`
5. `05-add-family-system.sql`

## Deployment

The app is configured for deployment on the `mouna.app` domain. Make sure to:

1. Set up your production environment variables
2. Configure your domain DNS to point to your hosting provider
3. Set up SSL certificates for `mouna.app` and `www.mouna.app`
4. Configure your Supabase project for the production domain 