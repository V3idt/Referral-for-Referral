# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** create a public GitHub issue.

Instead, please report it privately:

1. **Email**: [Create a private security advisory on GitHub](../../security/advisories/new)
   - Or email the maintainers directly (add your email here)

2. **Include in your report**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

## What to Expect

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: Within 24-48 hours
  - High: Within 1 week
  - Medium: Within 2 weeks
  - Low: Next release cycle

## Security Best Practices

### For Users

1. **Never commit `.env.local`** - Contains your Supabase keys
2. **Use strong passwords** - For Supabase dashboard access
3. **Enable 2FA** - On your Supabase account
4. **Rotate keys regularly** - Especially if exposed
5. **Use Row Level Security** - Already configured in migrations
6. **Keep dependencies updated** - Run `npm audit` regularly

### For Contributors

1. **No secrets in code** - Use environment variables
2. **Validate all input** - Prevent injection attacks
3. **Use parameterized queries** - Supabase handles this
4. **Follow principle of least privilege** - In RLS policies
5. **Review Supabase RLS policies** - Before modifying

## Known Security Features

✅ **Row Level Security (RLS)** - All tables protected  
✅ **JWT Authentication** - Supabase handles tokens  
✅ **Environment validation** - Prevents missing config  
✅ **Secure file uploads** - User-isolated storage  
✅ **HTTPS only** - Enforced by Supabase  

## Security Checklist for Deployment

Before deploying to production:

- [ ] Disable "Auto-confirm" in Supabase Auth
- [ ] Set proper CORS origins
- [ ] Review all RLS policies
- [ ] Enable Supabase database backups
- [ ] Set up error tracking (without exposing secrets)
- [ ] Use strong JWT secret
- [ ] Enable rate limiting
- [ ] Set up monitoring/alerts
- [ ] Review API access logs regularly

## Dependencies

We use:
- **Supabase** - Handles authentication, authorization, and database security
- **Next.js** - Framework with built-in security features
- Regular dependency updates via Dependabot (recommended to enable)

## Disclosure Policy

- We will acknowledge your contribution in the release notes
- We follow responsible disclosure practices
- Public disclosure only after fix is deployed

## Contact

For security concerns: [Create a private security advisory](../../security/advisories/new)

---

**Thank you for helping keep Referral-for-Referral secure!** 🔒

