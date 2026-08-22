import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";

type SignInPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <AuthCard
      eyebrow="ログイン"
      title="ログイン"
      lead=""
      asideTitle="帰ってきたくなる、入口"
      asideCopy="ログインすると、保存した反応やあとで読み返したい展示にすぐ戻れます。"
      chips={["しんみり履歴", "お気に入り", "展示の続き"]}
      footerLabel="アカウントを持っていないなら"
      footerHref="/sign-up"
      footerLinkLabel="アカウントを制作"
    >
      <SignInForm initialError={error} />
    </AuthCard>
  );
}
