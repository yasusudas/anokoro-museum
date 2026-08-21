"use client";

export function SignInForm() {
  return (
    <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
      <div className="auth-field">
        <label htmlFor="sign-in-email">メールアドレス</label>
        <input id="sign-in-email" name="email" type="email" autoComplete="email" placeholder="name@example.com" />
      </div>

      <div className="auth-field">
        <label htmlFor="sign-in-password">パスワード</label>
        <input id="sign-in-password" name="password" type="password" autoComplete="current-password" placeholder="8文字以上" />
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
