import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <AuthCard
      eyebrow="ログイン"
      title="あのころミュージアム"
      lead=""
      asideTitle="帰ってきたくなる、入口"
      asideCopy="ログインすると、保存した反応やあとで読み返したい展示にすぐ戻れます。"
      chips={["しんみり履歴", "お気に入り", "展示の続き"]}
      footerLabel="アカウントを持っていないなら"
      footerHref="/sign-up"
      footerLinkLabel="アカウントを制作"
    >
      <SignInForm />
    </AuthCard>
  );
}
