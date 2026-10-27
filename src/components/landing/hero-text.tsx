"use client";

import { Fragment } from "react";
import { useLanguage } from "@/components/common/language-provider";
import styles from "./hero-english.module.css";

export function HeroText({ text }: { text: string }) {
  const { locale, t } = useLanguage();
  const translated = t(text);

  if (locale !== "zh") return translated;

  const parts = translated.split(/([^，。！？；：])([，。！？；：])/g);
  return parts.map((part, index) => {
    if (index % 3 === 1) {
      return (
        <span className={styles.punctuationPair} key={index}>
          {part}<span className={styles.punctuation}>{parts[index + 1]}</span>
        </span>
      );
    }
    return index % 3 === 2 ? null : <Fragment key={index}>{part}</Fragment>;
  });
}
