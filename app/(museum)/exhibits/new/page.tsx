import Link from "next/link";

import { MemoryPostForm } from "@/components/forms/memory-post-form";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";

export default async function NewExhibitPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="post-page">
      <SiteHeader
        currentUser={currentUser}
        loginReturnPath="/exhibits/new"
        mode="create"
      />
      <main className="post-shell">
        <section className="post-panel" aria-label="思い出の投稿フォーム">
          <div className="post-heading">
            <Link className="post-back-link" href="/">
              ← 展示場に戻る
            </Link>
            <h1>思い出の展示</h1>
          </div>
          <MemoryPostForm />
        </section>
      </main>
    </div>
  );
}
