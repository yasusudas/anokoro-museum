import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="entrance-page">
      <Image className="entrance-image" src="/museum-exterior-v2.png" alt="あたたかな明かりが灯る、あのころミュージアムの外観" fill priority sizes="100vw" />
      <div className="entrance-shade" />
      <header className="entrance-header">
        <Link className="entrance-brand" href="/" aria-label="あのころミュージアム トップ">
          <Image src="/site-logo-mark.svg" alt="" width={42} height={42} aria-hidden="true" />
          <span><b>あのころ</b><small>MUSEUM OF MEMORIES</small></span>
        </Link>
      </header>
      <Link className="entrance-door" href="/floor/1">
        <span>入場</span><i aria-hidden="true">→</i>
      </Link>
    </main>
  );
}
