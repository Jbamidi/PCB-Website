import { profile } from "@/content/profile";
import styles from "./layout.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <p className={styles.footerName}>
          {profile.name}
          <span className="silk">JB-PB01 · rev A · 2026</span>
        </p>
        <ul className={styles.footerLinks}>
          <li><a href={`mailto:${profile.email}`}>{profile.email}</a></li>
          <li><a href={profile.github} rel="me noopener">GitHub</a></li>
          <li><a href={profile.linkedin} rel="me noopener">LinkedIn</a></li>
        </ul>
      </div>
    </footer>
  );
}
