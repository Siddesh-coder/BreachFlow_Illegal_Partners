import { useEffect, useRef } from "react";

export const AnimatedBlob = () => {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (blobRef.current) {
        const scrollY = window.scrollY;
        blobRef.current.style.transform = `translateX(-50%) translateY(${scrollY * 0.3}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={blobRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "5%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "600px",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <radialGradient id="blobGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9A91FC" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#9A91FC" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#9A91FC" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#9A91FC" stopOpacity="0" />
          </radialGradient>
          <filter id="blobBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <g filter="url(#blobBlur)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 300 300"
            to="360 300 300"
            dur="20s"
            repeatCount="indefinite"
          />
          <path fill="url(#blobGradient)">
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="
                M300,80 C380,60 460,120 480,200 C500,280 470,370 400,420 C330,470 240,470 180,420 C120,370 100,280 120,200 C140,120 220,100 300,80Z;
                M300,70 C390,80 460,140 470,220 C480,300 440,390 370,430 C300,470 210,450 160,390 C110,330 110,240 150,180 C190,120 210,60 300,70Z;
                M300,90 C370,60 450,110 475,190 C500,270 475,365 405,415 C335,465 235,460 175,405 C115,350 105,265 130,195 C155,125 230,120 300,90Z;
                M300,80 C380,60 460,120 480,200 C500,280 470,370 400,420 C330,470 240,470 180,420 C120,370 100,280 120,200 C140,120 220,100 300,80Z
              "
            />
          </path>
        </g>
      </svg>
    </div>
  );
};
