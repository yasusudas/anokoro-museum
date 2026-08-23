import type { CSSProperties } from "react";

import styles from "./loading.module.css";

type DotStyle = CSSProperties & {
  "--dot-index": number;
};

const dots = Array.from({ length: 8 }, (_, index) => index);

export default function Loading() {
  return (
    <main className={styles.screen}>
      <div className={styles.status} role="status" aria-live="polite">
        <div className={styles.orbit} aria-hidden="true">
          {dots.map((index) => (
            <span
              className={styles.dot}
              style={{ "--dot-index": index } as DotStyle}
              key={index}
            />
          ))}
        </div>
        <p className={styles.label}>読み込み中</p>
      </div>
    </main>
  );
}
