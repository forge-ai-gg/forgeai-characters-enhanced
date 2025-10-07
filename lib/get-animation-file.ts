import { ASSETS_BASE_URL } from "./constants";

// Helper function to check if a URL exists
async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Helper function to build asset URL
function buildAssetUrl(...pathSegments: string[]): string {
  const cleanSegments = pathSegments
    .filter(Boolean)
    .map((segment) => segment.replace(/^\/+|\/+$/g, "")); // Remove leading/trailing slashes
  return `${ASSETS_BASE_URL}/${cleanSegments.join("/")}`;
}

export async function findValidAnimationFile({
  componentPath,
  variant,
  supportedAnimations,
}: {
  componentPath: string;
  variant: string;
  supportedAnimations?: string[];
}): Promise<string | null> {
  const animationPriority = ["walk", "idle", "combat_idle", "run"];

  // Try both space and underscore versions of the variant
  // Some variants lists have spaces but files use underscores
  const variantVersions = [
    variant,
    variant.replace(/ /g, "_"), // space to underscore
  ].filter((v, i, arr) => arr.indexOf(v) === i); // unique values only

  // Try non-animated variant first (both versions)
  for (const variantVersion of variantVersions) {
    const baseFileUrl = buildAssetUrl(componentPath, `${variantVersion}.png`);
    if (await urlExists(baseFileUrl)) {
      console.log(`✅ Found base file: ${baseFileUrl}`);
      return baseFileUrl;
    }
  }

  console.log(`Base file not found, trying animations...`);

  // Try animations in priority order (both versions)
  for (const anim of animationPriority) {
    for (const variantVersion of variantVersions) {
      const animFileUrl = buildAssetUrl(
        componentPath,
        anim,
        `${variantVersion}.png`
      );

      if (await urlExists(animFileUrl)) {
        console.log(`✅ Found animation file: ${animFileUrl}`);
        return animFileUrl;
      } else {
        console.log(`Animation file not found: ${animFileUrl}`);
      }
    }
  }

  return null;
}
