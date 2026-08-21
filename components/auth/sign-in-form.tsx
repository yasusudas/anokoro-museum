"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "@/features/auth/actions/sign-in";

type SignInErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<SignInErrors>({});

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

    startTransition(async () => {
      const result = await signInAction(formData);

      if (!result.ok) {
        setErrors({
          email: result.error.fieldErrors?.email?.[0],
          password: result.error.fieldErrors?.password?.[0],
          general: result.error.message,
        });
        return;
      }

      router.push("/");
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

      <button className="auth-submit" type="submit" disabled={isPending}>
        {isPending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
