"use client";

import { useEffect, useRef } from "react";

interface Avatar2DProps {
  mouthOpenAmount: number;
  speaking: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function Avatar2D({ mouthOpenAmount, speaking }: Avatar2DProps) {
  const mouthRef = useRef<SVGPathElement | null>(null);
  const eyelidRef = useRef<SVGRectElement | null>(null);

  useEffect(() => {
    if (!mouthRef.current) {
      return;
    }

    const openness = clamp(mouthOpenAmount, 0, 1);
    const height = 8 + openness * 24;
    const d = `M 40 70 Q 60 ${70 + height / 2} 80 70 Q 60 ${70 + height} 40 70 Z`;
    mouthRef.current.setAttribute("d", d);
  }, [mouthOpenAmount]);

  useEffect(() => {
    if (!eyelidRef.current) {
      return;
    }
    if (!speaking) {
      eyelidRef.current.style.transform = "scaleY(1)";
      return;
    }

    const blink = () => {
      if (!eyelidRef.current) {
        return;
      }
      eyelidRef.current.animate(
        [
          { transform: "scaleY(1)" },
          { transform: "scaleY(0.2)", offset: 0.5 },
          { transform: "scaleY(1)" },
        ],
        {
          duration: 200,
          easing: "ease-in-out",
        },
      );
    };

    const interval = setInterval(blink, 3500);
    return () => {
      clearInterval(interval);
    };
  }, [speaking]);

  return (
    <div className="flex h-full items-center justify-center">
      <svg
        viewBox="0 0 120 140"
        className="h-full w-full max-h-80 max-w-[320px] drop-shadow-xl"
        role="img"
        aria-label="Avatar animado"
      >
        <defs>
          <radialGradient id="faceGradient" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ffe1d9" />
            <stop offset="80%" stopColor="#f8b59d" />
            <stop offset="100%" stopColor="#f29c86" />
          </radialGradient>
        </defs>

        <circle cx="60" cy="70" r="48" fill="url(#faceGradient)" stroke="#f39c6b" strokeWidth="2" />

        <g transform="translate(25,40)">
          <rect ref={eyelidRef} x="0" y="0" width="25" height="12" rx="6" fill="#fff" />
          <circle cx="12" cy="6" r="6" fill="#333" />
          <circle cx="9" cy="5" r="2" fill="#fff" />
        </g>

        <g transform="translate(75,40)">
          <rect x="0" y="0" width="25" height="12" rx="6" fill="#fff" />
          <circle cx="12" cy="6" r="6" fill="#333" />
          <circle cx="9" cy="5" r="2" fill="#fff" />
        </g>

        <path
          ref={mouthRef}
          d="M 40 70 Q 60 82 80 70 Q 60 88 40 70 Z"
          fill="#b9325e"
          stroke="#8d2549"
          strokeWidth="2"
        />

        <path
          d="M 42 58 Q 60 50 78 58"
          fill="none"
          stroke="#d57f5f"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M 32 92 Q 60 ${speaking ? 108 : 100} 88 92"
          fill="none"
          stroke="#d57f5f"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default Avatar2D;
