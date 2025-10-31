import { sheetDefinitions } from "@/lib/generated/sheet-definitions";
import { SheetDefinition } from "@/types/sheet-definitions";

export async function GET() {
  try {
    // Transform sheet definitions into options format for randomization
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

    return new Response(JSON.stringify(options), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Options generation error:", error);
    return Response.json(
      { error: "Failed to generate options", details: error },
      { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

