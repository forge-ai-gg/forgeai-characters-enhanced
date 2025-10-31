import { SpriteConfigQueryParams } from "@/types/sprites";
import { createCanvas, loadImage } from "canvas";
import { UNIVERSAL_FRAME_SIZE } from "./constants";
import { getLayersForSprite } from "./get-layers";

// Avatar is the first frame (column 1) of row 3 (Y=128px)
// This is from the spellcast animation
const AVATAR_X = 0; // Column 1 (first column)
const AVATAR_Y = 128; // Row 3

export async function generateAvatar(
  params: Partial<SpriteConfigQueryParams>
): Promise<Buffer> {
  // 1. Load layer definitions based on params
  const layers = await getLayersForSprite(params);
  console.log("Got layers for avatar:", layers.length);

  // 2. Create canvas with single frame dimensions (64x64)
  const canvas = createCanvas(UNIVERSAL_FRAME_SIZE, UNIVERSAL_FRAME_SIZE);
  const ctx = canvas.getContext("2d");

  // Clear canvas with a transparent background
  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Sort layers by z-position
  const sortedLayers = layers.sort((a, b) => a.zPos - b.zPos);

  // 4. Load and draw each layer at the avatar position
  for (const layer of sortedLayers) {
    try {
      // Use the spellcast animation path for the avatar (row 3 is in spellcast)
      const spellcastPath = layer.fileName?.replace(
        /\/(idle|walk|run|slash|thrust|spellcast|shoot|hurt|jump|climb)\//,
        "/spellcast/"
      );

      if (!spellcastPath) {
        console.log("No file path for layer:", layer);
        continue;
      }

      const image = await loadImage(spellcastPath);

      // Row 3 is at Y=128px, which is row 2 (0-indexed) of the spellcast animation
      // spellcast starts at row 0, so row 3 is row index 2
      const spellcastRowOffset = 2;

      // Draw only the single frame at (column 1, spellcast row 2)
      ctx.drawImage(
        image as any,
        AVATAR_X, // Source X (column 1 = 0px)
        spellcastRowOffset * UNIVERSAL_FRAME_SIZE, // Source Y (row 2 within spellcast)
        UNIVERSAL_FRAME_SIZE, // Source width
        UNIVERSAL_FRAME_SIZE, // Source height
        0, // Destination X
        0, // Destination Y
        UNIVERSAL_FRAME_SIZE, // Destination width
        UNIVERSAL_FRAME_SIZE // Destination height
      );
    } catch (error) {
      console.log("Failed to load layer for avatar:", layer.fileName, error);
    }
  }

  // 5. Return PNG buffer
  return canvas.toBuffer("image/png");
}
