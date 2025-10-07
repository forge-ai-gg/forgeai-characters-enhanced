import { generateSprite } from "@/lib/generate-sprite";
import { logger } from "@/lib/logger";
import { SpriteConfigQueryParams } from "@/types/sprites";
import { yellow } from "colors";
import crypto from "crypto";
import { NextRequest } from "next/server";

/**
 * Generates a sprite based on the query parameters
 *
 * @example1 http://localhost:3000/api/sprite?body=Body_color_lavender&head=Human_female_lavender&sex=female&nose=none_Big_nose&hat=none_Armet&shoulders=Legion_steel&gloves=Gloves_bluegray&wrists=Cuffs_bluegray&bauldron=Bauldron_brown&arms=Armour_iron&sleeves=Shortsleeves_2_Overlay_maroon&apron=Apron_orange&chainmail=none_Chainmail&vest=Vest_green&legs=Pants_maroon&shoes=Basic_Shoes_orange&hair=Spiked_green&facial_left=Left_Monocle_iron&clothes=Shortsleeve_Polo_blue
 *
 *
 *
 * @param request - The NextRequest object containing the query parameters
 * @returns A Response object containing the sprite
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entries = Object.fromEntries(searchParams.entries());

    // Create cache key and ETag
    const cacheKey = createCacheKey(entries);
    const etag = createETag(cacheKey);

    logger.info("Got Query Params:");
    for (const key of Object.keys(entries)) {
      logger.info(`- ${yellow(key)}=${yellow(entries[key] ?? "")}`);
    }

    const sprite = await generateSprite(entries);

    return new Response(sprite as BodyInit, {
      headers: getHeaders(cacheKey, etag),
    });
  } catch (error) {
    console.error("Sprite generation error:", error);
    // Don't cache errors
    return Response.json(
      { error: "Failed to generate sprite", details: error },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// Helper function to create normalized cache key
function createCacheKey(params: Partial<SpriteConfigQueryParams>): string {
  // Sort params for consistent key generation
  const sortedEntries = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  const paramString = sortedEntries
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return paramString;
}

// Helper function to create ETag
function createETag(cacheKey: string): string {
  return crypto
    .createHash("sha256")
    .update(cacheKey)
    .digest("hex")
    .substring(0, 16);
}

// Helper function to get common headers
function getHeaders(cacheKey: string, etag: string) {
  return {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: `"${etag}"`,
    Vary: "Accept",
    "X-Cache-Key": cacheKey,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD",
    "Access-Control-Allow-Headers": "If-None-Match",
    "Access-Control-Max-Age": "86400",
  };
}

// HEAD handler - returns headers without generating sprite
export async function HEAD(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Format the parameters properly (same as GET)
    const params: Partial<SpriteConfigQueryParams> = {
      body: searchParams.get("body") || "Body_color_light",
      head: searchParams.get("head") || "Human_male_light",
      sex: searchParams.get("sex") || "male",
      ...Object.fromEntries(searchParams.entries()),
    };

    // Create cache key and ETag
    const cacheKey = createCacheKey(params);
    const etag = createETag(cacheKey);

    // Check if client already has this version
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === `"${etag}"`) {
      return new Response(null, {
        status: 304,
        headers: getHeaders(cacheKey, etag),
      });
    }

    // Return headers without generating the sprite
    return new Response(null, {
      headers: getHeaders(cacheKey, etag),
    });
  } catch (error) {
    console.error("HEAD request error:", error);
    return new Response(null, {
      status: 500,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

// Add OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD",
      "Access-Control-Allow-Headers": "If-None-Match",
      "Access-Control-Max-Age": "86400",
    },
  });
}
