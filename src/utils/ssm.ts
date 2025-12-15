import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({ region: process.env.REGION || 'ap-southeast-2' });

// Cache for SSM parameters (15 minutes TTL)
interface CacheEntry {
  value: string;
  expiry: number;
}

const cache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Get parameter from SSM Parameter Store with caching
 */
async function getParameter(name: string): Promise<string> {
  const now = Date.now();
  
  // Check cache
  const cached = cache.get(name);
  if (cached && cached.expiry > now) {
    return cached.value;
  }

  // Fetch from SSM
  try {
    const command = new GetParameterCommand({
      Name: name,
      WithDecryption: false,
    });
    
    const response = await ssmClient.send(command);
    
    if (!response.Parameter || !response.Parameter.Value) {
      throw new Error(`Parameter ${name} not found`);
    }

    const value = response.Parameter.Value;

    // Update cache
    cache.set(name, {
      value,
      expiry: now + CACHE_TTL,
    });

    return value;
  } catch (error) {
    console.error(`Error fetching SSM parameter ${name}:`, error);
    throw error;
  }
}

/**
 * Get User Pool configuration for an app
 */
export async function getAppConfig(appId: string, stage: string): Promise<{ userPoolId: string; userPoolClientId: string }> {
  const userPoolIdPath = `/auth-server/apps/${appId}/${stage}/user-pool-id`;
  const userPoolClientIdPath = `/auth-server/apps/${appId}/${stage}/user-pool-client-id`;

  try {
    const [userPoolId, userPoolClientId] = await Promise.all([
      getParameter(userPoolIdPath),
      getParameter(userPoolClientIdPath),
    ]);

    return {
      userPoolId,
      userPoolClientId,
    };
  } catch (error: any) {
    if (error.name === 'ParameterNotFound' || error.message?.includes('not found')) {
      throw new Error(`App '${appId}' is not registered or does not exist in stage '${stage}'`);
    }
    throw error;
  }
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}
