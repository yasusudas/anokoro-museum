"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "@/features/auth/actions/sign-in";
import { getSafeNextPath } from "@/features/auth/domain/next-path";
import { OAUTH_CALLBACK_ERROR_CODE } from "@/features/auth/domain/oauth-callback-error";
import { createClient } from "@/lib/supabase/browser";
import styles from "./sign-in-form.module.css";

type SignInErrors = {
  email?: string;
  password?: string;
  general?: string;
};

type SignInFormProps = {
  initialError?: string;
};

function readSafeNextPath() {
  return getSafeNextPath(
    new URLSearchParams(window.location.search).get("next"),
    window.location.origin,
  );
}

export function SignInForm({ initialError }: SignInFormProps) {
  const router = useRouter();
  const [isEmailPending, startEmailTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const isPending = isEmailPending || isGooglePending;
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<SignInErrors>(() =>
    initialError === OAUTH_CALLBACK_ERROR_CODE
      ? { general: "Googleログインに失敗しました。もう一度お試しください" }
      : {},
  );

  function handleGoogleSignIn() {
    setErrors({});

    startGoogleTransition(async () => {
      const supabase = createClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", readSafeNextPath());

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        console.error("Supabase Google sign-in error:", error);
        setErrors({ general: "Googleログインを開始できませんでした。もう一度お試しください" });
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextErrors: SignInErrors = {};

    if (!email) {
      nextErrors.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "メールアドレスの形式が正しくありません";
    }

    if (!password) {
      nextErrors.password = "パスワードを入力してください";
    } else if (password.length < 8) {
      nextErrors.password = "パスワードは8文字以上で入力してください";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    startEmailTransition(async () => {
      const result = await signInAction(formData);

      if (!result.ok) {
        setErrors({
          email: result.error.fieldErrors?.email?.[0],
          password: result.error.fieldErrors?.password?.[0],
          general: result.error.message,
        });
        return;
      }

      router.push(readSafeNextPath());
      router.refresh();
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {errors.general && (
        <p className="auth-error" role="alert">
          {errors.general}
        </p>
      )}

      <div className="auth-field">
        <label htmlFor="sign-in-email">メールアドレス</label>
        <input
          id="sign-in-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          disabled={isPending}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "sign-in-email-error" : undefined}
        />
        {errors.email && (
          <p className="auth-error" id="sign-in-email-error" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor="sign-in-password">パスワード</label>
        <div className="auth-password-field">
          <input
            id="sign-in-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="8文字以上"
            disabled={isPending}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "sign-in-password-error" : undefined}
          />
          <button
            className="auth-password-toggle"
            type="button"
            aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
            aria-pressed={showPassword}
            disabled={isPending}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.5" />
              {showPassword && <path d="m4 4 16 16" />}
            </svg>
          </button>
        </div>
        <span className="auth-field-hint">半角英数字で入力</span>
        {errors.password && (
          <p className="auth-error" id="sign-in-password-error" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      <div className={styles.divider} aria-hidden="true">
        <span>または</span>
      </div>

      <button
        className={styles.googleButton}
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isPending}
      >
        <svg className={styles.googleMark} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
          <path
            fill="#4285F4"
            d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.614Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.181l-2.908-2.258c-.806.54-1.835.86-3.048.86-2.344 0-4.328-1.584-5.04-3.711H.954v2.332A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.96 10.71A5.41 5.41 0 0 1 3.676 9c0-.593.102-1.17.284-1.71V4.958H.954A9 9 0 0 0 0 9c0 1.453.348 2.827.954 4.042l3.006-2.332Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.579c1.321 0 2.508.454 3.441 1.345l2.582-2.582C13.463.89 11.426 0 9 0A9 9 0 0 0 .954 4.958L3.96 7.29C4.672 5.163 6.656 3.579 9 3.579Z"
          />
        </svg>
        <span>{isGooglePending ? "Google へ移動中…" : "Google で続行"}</span>
      </button>

      <button className="auth-submit" type="submit" disabled={isPending}>
        {isEmailPending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
