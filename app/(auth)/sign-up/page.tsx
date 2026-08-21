import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthCard
      eyebrow="SIGN UP"
      title="あのころを残す準備"
      lead="展示をはじめる前に、アカウントを作って自分の記憶を集めておけます。"
      asideTitle="記憶の持ち主になる"
      asideCopy="公開前の下書き、あとで見返したい展示、しんみりの反応をまとめて扱えるようにします。"
      chips={["下書き保存", "展示の準備", "あとで見返す"]}
      footerLabel="すでにアカウントがあるなら"
      footerHref="/sign-in"
      footerLinkLabel="ログインする"
    >
      <SignUpForm />
    </AuthCard>
  );
}
