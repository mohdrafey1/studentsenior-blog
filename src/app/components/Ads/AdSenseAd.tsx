"use client";

import { useEffect } from "react";

type Props = {
  style?: React.CSSProperties;
  className?: string;
};

export default function AdSenseAd({
  style = { display: "block", width: "100%" },
  className = "",
}: Props) {
  useEffect(() => {
    // Load AdSense script only once
    const scriptId = "adsbygoogle-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4435788387381825";
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    // Render ad
    try {
      // @ts-expect-error injected by Google script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client="ca-pub-4435788387381825"
      data-ad-slot="4650270379"
      data-ad-format="fluid"
      data-ad-layout-key="-fb+5w+4e-db+86"
    />
  );
}
