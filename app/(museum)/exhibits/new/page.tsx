import Link from "next/link";

import { MemoryPostForm } from "@/components/forms/memory-post-form";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/features/auth/queries/get-current-user";
import { getFloorPath, isFloorId } from "@/features/exhibits/floors";

type NewExhibitPageProps = {
  searchParams: Promise<{ from?: string | string[] }>;
};

export default async function NewExhibitPage({ searchParams }: NewExhibitPageProps) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;
  const rawFrom = Array.isArray(params.from) ? params.from[0] : params.from;
  const returnFloorId = rawFrom && isFloorId(rawFrom) ? rawFrom : null;
  const returnPath = returnFloorId ? getFloorPath(returnFloorId) : "/floor/2";
  const loginReturnPath = returnFloorId
    ? `/exhibits/new?from=${encodeURIComponent(returnFloorId)}`
    : "/exhibits/new";

  return (
    <div className="post-page">
      <SiteHeader
        currentUser={currentUser}
        loginReturnPath={loginReturnPath}
        mode="create"
      />
      <main className="post-shell">
        <section className="post-panel" aria-label="思い出の投稿フォーム">
          <div className="post-heading">
            <Link className="post-back-link" href={returnPath}>
              ← 展示場に戻る
            </Link>
            <h1>思い出の展示</h1>
          </div>
          <MemoryPostForm returnPath={returnPath} />
        </section>
      </main>
    </div>
  );
}
