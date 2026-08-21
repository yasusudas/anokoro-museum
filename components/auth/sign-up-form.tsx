"use client";

export function SignUpForm() {
  return (
    <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
      <div className="auth-field">
        <label htmlFor="sign-up-name">表示名</label>
        <input id="sign-up-name" name="name" type="text" autoComplete="nickname" placeholder="あのころ太郎" />
      </div>

      <div className="auth-field">
        <label htmlFor="sign-up-email">メールアドレス</label>
        <input id="sign-up-email" name="email" type="email" autoComplete="email" placeholder="name@example.com" />
      </div>

      <div className="auth-field">
        <label htmlFor="sign-up-password">パスワード</label>
        <input id="sign-up-password" name="password" type="password" autoComplete="new-password" placeholder="8文字以上" />
      </div>

      <div className="auth-field">
        <label htmlFor="sign-up-confirm-password">パスワード確認</label>
        <input id="sign-up-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="もう一度入力" />
      </div>

      <button className="auth-submit" type="submit">
        アカウントを作成する
      </button>
    </form>
  );
}
