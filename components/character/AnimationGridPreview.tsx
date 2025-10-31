"use client";

import { useEffect, useRef, useState } from "react";

type AnimationConfig = {
  name: string;
  row: number;
  frames: number;
  directions: number;
};

type AnimationGridPreviewProps = {
  spriteUrl: string;
  animation: AnimationConfig;
  onImageLoad?: () => void;
  onImageError?: () => void;
};

export function AnimationGridPreview({
  spriteUrl,
  animation,
  onImageLoad,
  onImageError,
}: AnimationGridPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spriteUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const FRAME_WIDTH = 64;
        const FRAME_HEIGHT = 64;
        const SPRITE_COLS = 13; // Total columns in sprite sheet

        // Calculate canvas dimensions based on animation frames and directions
        const canvasWidth = animation.frames * FRAME_WIDTH;
        const canvasHeight = animation.directions * FRAME_HEIGHT;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Extract and draw frames
        for (let dir = 0; dir < animation.directions; dir++) {
          for (let frame = 0; frame < animation.frames; frame++) {
            const srcX = frame * FRAME_WIDTH;
            const srcY = (animation.row + dir) * FRAME_HEIGHT;
            const destX = frame * FRAME_WIDTH;
            const destY = dir * FRAME_HEIGHT;

            ctx.drawImage(
              img,
              srcX,
              srcY,
              FRAME_WIDTH,
              FRAME_HEIGHT,
              destX,
              destY,
              FRAME_WIDTH,
              FRAME_HEIGHT
            );
          }
        }

        setIsLoading(false);
        onImageLoad?.();
      } catch (err) {
        console.error("Error drawing sprite frames:", err);
        setError("Failed to render animation frames");
        setIsLoading(false);
        onImageError?.();
      }
    };

    img.onerror = () => {
      console.error("Failed to load sprite image");
      setError("Failed to load sprite image");
      setIsLoading(false);
      onImageError?.();
    };

    img.src = spriteUrl;
  }, [spriteUrl, animation, onImageLoad, onImageError]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg z-10">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading animation...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg z-10">
          <div className="text-center text-red-600">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-200">
        <canvas
          ref={canvasRef}
          className="pixelated mx-auto drop-shadow-lg"
          style={{
            imageRendering: "pixelated",
            maxWidth: "100%",
            height: "auto",
          }}
        />

        {/* Direction Labels */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-gray-600 font-medium">
          <div className="bg-white bg-opacity-70 rounded px-2 py-1">↑ Up</div>
          <div className="bg-white bg-opacity-70 rounded px-2 py-1">← Left</div>
          <div className="bg-white bg-opacity-70 rounded px-2 py-1">↓ Down</div>
          <div className="bg-white bg-opacity-70 rounded px-2 py-1">→ Right</div>
        </div>

        {/* Frame Labels */}
        <div className="mt-2 text-center text-xs text-gray-500">
          {animation.frames} frames × {animation.directions} directions
        </div>
      </div>
    </div>
  );
}

