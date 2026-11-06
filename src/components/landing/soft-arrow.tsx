import styles from "./soft-arrow.module.css";

export function SoftArrow() {
  return <span aria-hidden data-soft-arrow className={`relative -mr-1 block size-8 shrink-0 pointer-events-none ${styles.arrow}`} />;
}
