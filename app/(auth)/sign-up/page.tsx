import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthCard
      eyebrow="アカウントを制作"
      title="アカウントを作成"
      lead=""
      asideTitle="記憶の持ち主になる"
      asideCopy="公開前の下書き、あとで見返したい展示、しんみりの反応をまとめて扱えるようにします。"
      chips={["下書き保存", "展示の準備", "あとで見返す"]}
      footerLabel="すでにアカウントがあるなら"
      footerHref="/sign-in"
      footerLinkLabel="ログイン"
    >
      <SignUpForm />
    </AuthCard>
  );
}
