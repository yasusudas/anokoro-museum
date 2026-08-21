"use client";

import { useState, type FormEvent } from "react";

type SignUpErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const nextErrors: SignUpErrors = {};

    if (!name) {
      nextErrors.name = "表示名を入力してください";
    }

    if (!email) {
      nextErrors.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "メールアドレスの形式が正しくありません";
    }

    if (!password) {
      nextErrors.password = "パスワードを入力してください";
    } else if (password.length < 8) {
      nextErrors.password = "パスワードは8文字以上で入力してください";
    } else if (!/^[A-Za-z0-9]+$/.test(password)) {
      nextErrors.password = "パスワードは半角英数字で入力してください";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "パスワードをもう一度入力してください";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "パスワードが一致しません";
    }

    setErrors(nextErrors);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label htmlFor="sign-up-name">表示名</label>
        <input
          id="sign-up-name"
          name="name"
          type="text"
          autoComplete="nickname"
          placeholder="田中太郎"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "sign-up-name-error" : undefined}
        />
        {errors.name && <p className="auth-error" id="sign-up-name-error" role="alert">{errors.name}</p>}
      </div>

      <div className="auth-field">
        <label htmlFor="sign-up-email">メールアドレス</label>
        <input
          id="sign-up-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "sign-up-email-error" : undefined}
        />
        {errors.email && <p className="auth-error" id="sign-up-email-error" role="alert">{errors.email}</p>}
      </div>

      <div className="auth-field">
        <label htmlFor="sign-up-password">パスワード</label>
        <div className="auth-password-field">
          <input
            id="sign-up-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="8文字以上"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "sign-up-password-error" : undefined}
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
        {errors.password && <p className="auth-error" id="sign-up-password-error" role="alert">{errors.password}</p>}
      </div>

      <div className="auth-field">
        <label htmlFor="sign-up-confirm-password">パスワード確認</label>
        <div className="auth-password-field">
          <input
            id="sign-up-confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="もう一度入力"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "sign-up-confirm-password-error" : undefined}
          />
          <button
            className="auth-password-toggle"
            type="button"
            aria-label={showConfirmPassword ? "パスワードを隠す" : "パスワードを表示"}
            aria-pressed={showConfirmPassword}
            onClick={() => setShowConfirmPassword((visible) => !visible)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.5" />
              {showConfirmPassword && <path d="m4 4 16 16" />}
            </svg>
          </button>
        </div>
        {errors.confirmPassword && <p className="auth-error" id="sign-up-confirm-password-error" role="alert">{errors.confirmPassword}</p>}
      </div>

      <button className="auth-submit" type="submit">
        アカウントを制作
      </button>
    </form>
  );
}
