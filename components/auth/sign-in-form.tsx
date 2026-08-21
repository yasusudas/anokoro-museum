"use client";

import { useState, type FormEvent } from "react";

type SignInErrors = {
  email?: string;
  password?: string;
};

export function SignInForm() {
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

    setErrors(nextErrors);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label htmlFor="sign-in-email">メールアドレス</label>
        <input
          id="sign-in-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "sign-in-email-error" : undefined}
        />
        {errors.email && <p className="auth-error" id="sign-in-email-error" role="alert">{errors.email}</p>}
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
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "sign-in-password-error" : undefined}
          />
          <button
            className="auth-password-toggle"
            type="button"
            aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
            aria-pressed={showPassword}
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
        {errors.password && <p className="auth-error" id="sign-in-password-error" role="alert">{errors.password}</p>}
      </div>

      <label className="auth-check">
        <input type="checkbox" name="remember" />
        <span>次回から自動でログインする</span>
      </label>

      <button className="auth-submit" type="submit">
        ログイン
      </button>
    </form>
  );
}
