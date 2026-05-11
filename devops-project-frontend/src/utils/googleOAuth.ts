const GOOGLE_AUTH_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_OAUTH_SCOPE = 'openid email profile';

export const GOOGLE_OAUTH_STATE_KEY = 'google_oauth_state';
export const GOOGLE_OAUTH_PKCE_VERIFIER_KEY = 'google_oauth_pkce_verifier';
export const GOOGLE_OAUTH_REDIRECT_URI_KEY = 'google_oauth_redirect_uri';

const toBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }

  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const randomBase64Url = (byteLength: number): string => {
  const random = new Uint8Array(byteLength);
  window.crypto.getRandomValues(random);
  return toBase64Url(random.buffer);
};

const createPkcePair = async () => {
  const verifier = randomBase64Url(64);
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const challenge = toBase64Url(digest);

  return { verifier, challenge };
};

export const getGoogleClientId = (): string => {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
};

export const getGoogleRedirectUri = (): string => {
  const fromEnv = (import.meta.env.VITE_GOOGLE_REDIRECT_URI || '').trim();
  if (fromEnv) {
    return fromEnv;
  }

  return `${window.location.origin}/auth/google/callback`;
};

export const clearGoogleOAuthSession = () => {
  sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
  sessionStorage.removeItem(GOOGLE_OAUTH_PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(GOOGLE_OAUTH_REDIRECT_URI_KEY);
};

export const createGoogleAuthorizationUrl = async (): Promise<string> => {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Missing VITE_GOOGLE_CLIENT_ID');
  }

  const redirectUri = getGoogleRedirectUri();
  const state = randomBase64Url(24);
  const { verifier, challenge } = await createPkcePair();

  sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
  sessionStorage.setItem(GOOGLE_OAUTH_PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(GOOGLE_OAUTH_REDIRECT_URI_KEY, redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    include_granted_scopes: 'true',
    access_type: 'offline',
    prompt: 'select_account',
  });

  return `${GOOGLE_AUTH_BASE_URL}?${params.toString()}`;
};
