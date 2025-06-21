"use client";

import { useEffect } from "react";

type Props = {
  adSlot?: string;
  style?: React.CSSProperties;
  className?: string;
};

export default function AdSenseAd({
  adSlot = "1234567890", // ✅ Test Ad Slot
  style = { display: "block", width: "100%", height: "100px" },
  className = "",
}: Props) {
  useEffect(() => {
    try {
      // @ts-expect-error adsbygoogle is injected by external script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client="ca-pub-4435788387381825" // ✅ Test Client ID
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
