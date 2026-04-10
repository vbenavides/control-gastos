"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DollarSign } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginContent() {
  const { signInWithGoogle, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "auth";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* App icon */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-gradient-to-br from-[#35c7ff] to-[#0b79ae] text-white shadow-[0_18px_40px_rgba(41,187,243,0.24)]">
            <div className="grid h-13 w-13 place-items-center rounded-full border-[3px] border-white/90">
              <DollarSign size={30} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-[1.6rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
              Control Gastos
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Manejá tus finanzas desde un solo lugar
            </p>
          </div>
        </div>

        {/* Error message */}
        {hasError && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Hubo un error al iniciar sesión. Intentá de nuevo.
          </div>
        )}

        {/* Sign in button */}
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-4 text-[0.97rem] font-semibold text-[var(--text-primary)] transition hover:bg-white/[0.1] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <GoogleIcon />
          )}
          <span>Continuar con Google</span>
        </button>

        <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          Al continuar aceptás el uso de cookies de autenticación.
        </p>
      </div>
    </div>
  );
}

export function LoginScreen() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
