import { randomizeSpriteConfig } from "@/lib/randomize-sprite-config";
import { sheetDefinitions } from "@/lib/generated/sheet-definitions";
import { SheetDefinition } from "@/types/sheet-definitions";
import { NextRequest } from "next/server";

/**
 * Generates a random sprite configuration and redirects to the sprite endpoint
 * 
 * @example http://localhost:3000/api/random
 * 
 * @param request - The NextRequest object
 * @returns A redirect Response to /api/sprite with randomized query parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Transform sheet definitions into options format (same as /api/options)
    const options: Record<string, Array<{ name: string; type: string; variant: string; value: string }>> = {};

    Object.entries(sheetDefinitions).forEach(([key, definition]) => {
      const def = definition as SheetDefinition;
      
      // Skip if no type_name or variants
      if (!def.type_name || !def.variants || !Array.isArray(def.variants)) {
        return;
      }

      const typeName = def.type_name;
      
      // Initialize array for this type if it doesn't exist
      if (!options[typeName]) {
        options[typeName] = [];
      }

      // Create an option for each variant
      def.variants.forEach((variant) => {
        options[typeName].push({
          name: def.name,
          type: typeName,
          variant: variant,
          value: `${def.name.replaceAll(" ", "_")}_${variant}`,
        });
      });
    });

    // Generate random configuration
    const randomConfig = randomizeSpriteConfig(options);

    // Build query string from config
    const params = new URLSearchParams();
    Object.entries(randomConfig).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== false) {
        if (typeof value === "boolean") {
          params.set(key, value ? "true" : "false");
        } else {
          params.set(key, value.toString());
        }
      }
    });

    // Get the base URL from the request
    const baseUrl = new URL(request.url).origin;
    const redirectUrl = `${baseUrl}/api/sprite?${params.toString()}`;

    // Redirect to the sprite endpoint
    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error("Random sprite generation error:", error);
    return Response.json(
      { error: "Failed to generate random sprite", details: error },
      { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

