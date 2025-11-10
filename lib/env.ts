/**
 * Environment Variable Validation
 * Validates required environment variables at build time
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const optionalEnvVars = [
  'NEXT_PUBLIC_ANALYTICS_ID',
  'NEXT_PUBLIC_SENTRY_DSN',
] as const;

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ANALYTICS_ID?: string;
  SENTRY_DSN?: string;
}

function validateEnv(): EnvConfig {
  // DEBUG: Log all environment variables during build
  console.log('=================================');
  console.log('ENV VALIDATION DEBUG:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_SUPABASE_URL present?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_URL value:', process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'UNDEFINED');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY present?', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY value:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...` : 'UNDEFINED');
  console.log('All process.env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  console.log('=================================');

  const missing: string[] = [];
  
  // Check required environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables:\n${missing.join('\n')}

Please create a .env.local file with the following variables:
${requiredEnvVars.map(v => `${v}=your_value_here`).join('\n')}

See .env.example for more details.`;
    
    console.error('ENV VALIDATION FAILED:', errorMsg);
    
    // In production, throw error
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
    
    // In development, log warning
    console.warn(`⚠️  ${errorMsg}`);
  } else {
    console.log('✅ All required environment variables are present!');
  }

  return {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  };
}

export const env = validateEnv();

// Helper to check if app is properly configured
export function isConfigured(): boolean {
  return !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

// Type-safe environment variable access
export function getEnvVar(key: keyof EnvConfig): string | undefined {
  return env[key];
}

