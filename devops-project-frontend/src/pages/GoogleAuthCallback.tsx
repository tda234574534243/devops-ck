import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import {
  clearGoogleOAuthSession,
  getGoogleRedirectUri,
  GOOGLE_OAUTH_PKCE_VERIFIER_KEY,
  GOOGLE_OAUTH_REDIRECT_URI_KEY,
  GOOGLE_OAUTH_STATE_KEY,
} from '../utils/googleOAuth';

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (typeof (error as any).response?.data?.message === 'string' ||
      typeof (error as any).response?.data?.Message === 'string')
  ) {
    return (
      (error as any).response?.data?.message ||
      (error as any).response?.data?.Message ||
      fallbackMessage
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực đăng nhập Google...');
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) {
      return;
    }

    processed.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error');
      const oauthErrorDescription = params.get('error_description');
      const code = params.get('code');
      const state = params.get('state');
      const expectedState = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);

      if (oauthError) {
        clearGoogleOAuthSession();
        setStatus('error');
        setMessage(oauthErrorDescription || `Google trả về lỗi: ${oauthError}`);
        return;
      }

      if (!code) {
        clearGoogleOAuthSession();
        setStatus('error');
        setMessage('Không nhận được authorization code từ Google.');
        return;
      }

      if (!state || !expectedState || state !== expectedState) {
        clearGoogleOAuthSession();
        setStatus('error');
        setMessage('State OAuth không hợp lệ. Vui lòng thử đăng nhập lại.');
        return;
      }

      const redirectUri = sessionStorage.getItem(GOOGLE_OAUTH_REDIRECT_URI_KEY) || getGoogleRedirectUri();
      const codeVerifier = sessionStorage.getItem(GOOGLE_OAUTH_PKCE_VERIFIER_KEY) || undefined;

      try {
        const response = await authService.externalGoogleLogin({
          authorizationCode: code,
          redirectUri,
          codeVerifier,
        });

        login(
          {
            id: response.id,
            email: response.email,
            fullName: response.fullName,
            role: response.role,
          },
          response.token,
          response.refreshToken ?? null,
        );

        clearGoogleOAuthSession();
        navigate(getDefaultRouteForRole(response.role), { replace: true });
      } catch (error) {
        clearGoogleOAuthSession();
        setStatus('error');
        setMessage(
          getErrorMessage(error, 'Đăng nhập Google thất bại. Vui lòng thử lại.'),
        );
      }
    };

    void run();
  }, [login, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-10 text-on-surface">
      <section className="w-full max-w-md rounded-3xl border border-outline-variant/30 bg-surface-container-low p-8 text-center shadow-[0_20px_50px_-32px_rgba(0,0,0,0.45)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high">
          {status === 'loading' ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <AlertCircle className="h-8 w-8 text-error" />
          )}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Google OAuth/OIDC</p>
        <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-on-surface">
          {status === 'loading' ? 'Đang đăng nhập...' : 'Không thể đăng nhập'}
        </h1>

        <p className="mt-4 text-sm leading-7 text-secondary">{message}</p>

        {status === 'error' && (
          <Link
            to="/login"
            className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary transition-transform hover:translate-y-[-1px] active:scale-95"
          >
            Quay lại đăng nhập
          </Link>
        )}
      </section>
    </main>
  );
}
