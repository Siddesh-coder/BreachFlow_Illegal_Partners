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
            border-radius: 58% 42% 38% 62% / 55% 58% 42% 45%;
          }
          50% {
            border-radius: 50% 50% 62% 38% / 42% 55% 45% 58%;
          }
          75% {
            border-radius: 38% 62% 48% 52% / 58% 38% 62% 42%;
          }
        }
        @keyframes blobRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blobScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .animated-blob-wrapper {
          position: absolute;
          top: 5%;
          left: 50%;
          width: 600px;
          height: 600px;
          z-index: 0;
          pointer-events: none;
          transform: translateX(-50%) translateY(var(--scroll-y, 0px));
          will-change: transform;
        }
        .animated-blob-scale {
          width: 100%;
          height: 100%;
          animation: blobScale 6s ease-in-out infinite;
        }
        .animated-blob-rotate {
          width: 100%;
          height: 100%;
          animation: blobRotate 20s linear infinite;
        }
        .animated-blob-shape {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 50% 50%,
            rgba(154, 145, 252, 0.9) 0%,
            rgba(154, 145, 252, 0.55) 40%,
            rgba(154, 145, 252, 0.2) 70%,
            rgba(154, 145, 252, 0) 100%);
          filter: blur(20px);
          animation: blobMorph 8s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .animated-blob-wrapper {
            width: 400px;
            height: 400px;
          }
        }
      `}</style>
      <div ref={blobRef} aria-hidden="true" className="animated-blob-wrapper">
        <div className="animated-blob-scale">
          <div className="animated-blob-rotate">
            <div className="animated-blob-shape" />
          </div>
        </div>
      </div>
    </>
  );
};
