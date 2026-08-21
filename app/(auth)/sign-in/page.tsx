import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <AuthCard
      eyebrow="SIGN IN"
      title="展示室へ戻る"
      lead="もう一度入館したら、あなたのしんみり履歴や展示した記憶を続きから見られます。"
      asideTitle="帰ってきたくなる、入口"
      asideCopy="ログインすると、保存した反応やあとで読み返したい展示にすぐ戻れます。"
      chips={["しんみり履歴", "お気に入り", "展示の続き"]}
      footerLabel="アカウントを持っていないなら"
      footerHref="/sign-up"
      footerLinkLabel="新しく作る"
    >
      <SignInForm />
    </AuthCard>
  );
}
