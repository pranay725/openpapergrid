# Supabase Authentication Setup Guide

This guide will walk you through setting up Supabase authentication for OpenPaper Grid.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Fill in your project details:
   - **Name**: OpenPaper Grid
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (something like `https://your-project-id.supabase.co`)
   - **Project API Key (anon public)** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **Project API Key (service_role)** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

## 3. Configure Environment Variables

1. Open your `.env.local` file in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 4. Configure Authentication Providers

### Email/Password Authentication (Already Enabled)
Email/password authentication is enabled by default in Supabase.

### OAuth Providers (Optional)

#### Google OAuth Setup
1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Google**
3. Set up Google OAuth in [Google Cloud Console](https://console.cloud.google.com/):
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add your redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

#### GitHub OAuth Setup
1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **GitHub**
3. Set up GitHub OAuth in [GitHub Developer Settings](https://github.com/settings/developers):
   - Create a new OAuth App
   - Set Authorization callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

## 5. Configure Authentication Settings

1. Go to **Authentication** > **Settings** in Supabase
2. Configure the following:
   - **Site URL**: `http://localhost:3000` (for development) or your production URL
   - **Redirect URLs**: Add both `http://localhost:3000/auth/callback` and your production callback URL
   - **Email confirmations**: Enable if you want users to confirm their email (recommended)

## 6. Set Up Row Level Security (Optional but Recommended)

If you plan to store user-specific data, set up RLS:

1. Go to **Database** > **Tables** in Supabase
2. Create any custom tables you need
3. Enable Row Level Security on tables that should be user-specific
4. Create policies to control access

Example policy for a user-specific table:
```sql
-- Allow users to see their own data
CREATE POLICY "Users can view own data" ON your_table
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert own data" ON your_table
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 7. Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Click "Log in" and try to create a new account
4. Check your email for confirmation (if email confirmation is enabled)
5. Try logging in with your new account

## 8. Production Deployment

When deploying to production:

1. Update your environment variables with production values
2. Update **Site URL** and **Redirect URLs** in Supabase Authentication settings
3. Update OAuth provider redirect URIs if using social login
4. Ensure your domain is added to **Redirect URLs**

## Common Issues and Troubleshooting

### "Invalid login credentials"
- Check that your email/password are correct
- Ensure email confirmation is completed if enabled

### OAuth redirect errors
- Verify your redirect URLs are correctly configured
- Check that OAuth app settings match Supabase configuration

### Environment variable issues
- Ensure `.env.local` is in the project root
- Restart your development server after changing environment variables
- Check that variable names match exactly (including `NEXT_PUBLIC_` prefix)

### CORS errors
- Verify your Site URL is correctly set in Supabase
- Check that your domain is added to allowed origins

## Next Steps

Your authentication system is now set up! You can:

1. Customize the login/signup forms in `app/auth/login/page.tsx` and `app/auth/signup/page.tsx`
2. Add protected routes by checking user authentication status
3. Implement user profiles and additional features
4. Set up user-specific database tables with Row Level Security

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)