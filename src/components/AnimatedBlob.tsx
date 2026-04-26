import { useEffect, useRef } from "react";

export const AnimatedBlob = () => {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (blobRef.current) {
        const scrollY = window.scrollY;
        blobRef.current.style.setProperty("--scroll-y", `${scrollY * 0.3}px`);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @keyframes blobMorph {
          0%, 100% {
            border-radius: 42% 58% 55% 45% / 48% 42% 58% 52%;
          }
          25% {
            border-radius: 70% 30% 35% 65% / 60% 65% 35% 40%;
          }
          50% {
            border-radius: 35% 65% 70% 30% / 40% 60% 40% 60%;
          }
          75% {
            border-radius: 60% 40% 30% 70% / 65% 35% 65% 35%;
          }
        }
        @keyframes blobRotate {
          from { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.08); }
          to   { transform: rotate(360deg) scale(1); }
        }
        .animated-blob-wrapper {
          position: absolute;
          top: 5%;
          left: 50%;
          width: 400px;
          height: 400px;
          z-index: 0;
          pointer-events: none;
          transform: translateX(-50%) translateY(var(--scroll-y, 0px));
          will-change: transform;
        }
        .animated-blob-rotate {
          width: 100%;
          height: 100%;
          animation: blobRotate 20s linear infinite;
          transform-origin: 50% 50%;
        }
        .animated-blob-shape {
          width: 100%;
          height: 100%;
          background: #9A91FC;
          opacity: 0.7;
          filter: blur(40px);
          animation: blobMorph 8s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .animated-blob-wrapper {
            width: 400px;
            height: 400px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animated-blob-rotate, .animated-blob-shape {
            animation: none;
          }
        }
      `}</style>
      <div ref={blobRef} aria-hidden="true" className="animated-blob-wrapper">
        <div className="animated-blob-rotate">
          <div className="animated-blob-shape" />
        </div>
      </div>
    </>
  );
};
