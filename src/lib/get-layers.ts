import {
  SheetDefinition,
  sheetDefinitions,
} from "@/lib/generated/sheet-definitions";
import { findValidAnimationFile } from "@/lib/get-animation-file";
import { LayerDefinition } from "@/types/sheet-definitions";
import { SpriteConfigQueryParams, SpriteLayer } from "@/types/sprites";
import { yellow } from "colors";
import { logger } from "./logger";

/**
 * Parse a value like "Pixie_dark_brown" or "Longsleeves_2_Overlay_navy"
 * Returns the name and variant separately
 * This is a heuristic-based parse - may need refinement by checking variants list
 */
function parseValueHeuristic(value: string): { name: string; variant: string } {
  const parts = value.split("_");

  // Find the split point - where lowercase/variant starts
  let splitIndex = parts.length - 1; // default to last segment

  // Work backwards to find where the variant starts (first lowercase segment from end)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (
      part &&
      part[0] &&
      part[0] === part[0].toUpperCase() &&
      isNaN(Number(part))
    ) {
      splitIndex = i + 1;
      break;
    }
  }

  const name = parts.slice(0, splitIndex).join(" ");
  const variant = parts.slice(splitIndex).join("_");

  return { name, variant };
}

/**
 * Parse value and refine using the sheet definition's variants list
 */
function parseValue(
  value: string,
  sheetDef?: SheetDefinition
): { name: string; variant: string } {
  // Start with heuristic parse
  let { name, variant } = parseValueHeuristic(value);

  // If we have a sheet definition with variants, use it to refine
  if (sheetDef && sheetDef.variants && sheetDef.variants.length > 0) {
    const parts = value.split("_");

    // Try different split points to find a matching variant
    for (let splitIndex = 1; splitIndex < parts.length; splitIndex++) {
      const testName = parts.slice(0, splitIndex).join(" ");
      const testVariant = parts.slice(splitIndex).join("_");
      const testVariantWithSpaces = parts.slice(splitIndex).join(" ");

      // Check if this variant exists in the variants list
      if (
        sheetDef.variants.includes(testVariant) ||
        sheetDef.variants.includes(testVariantWithSpaces)
      ) {
        return {
          name: testName,
          variant: sheetDef.variants.includes(testVariantWithSpaces)
            ? testVariantWithSpaces
            : testVariant,
        };
      }
    }
  }

  return { name, variant };
}

/**
 * Find sheet definition by matching BOTH type_name AND parsed name
 */
function findSheetDefinition(
  paramType: string,
  parsedName: string
): SheetDefinition | null {
  // Try to find by BOTH type_name AND name (most specific)
  const byBoth = Object.values(sheetDefinitions).find(
    (d): d is SheetDefinition =>
      "type_name" in d &&
      "name" in d &&
      d.type_name === paramType &&
      d.name === parsedName
  );

  if (byBoth) return byBoth;

  // Fallback 1: try to find by name match only
  const byName = Object.values(sheetDefinitions).find(
    (d): d is SheetDefinition => "name" in d && d.name === parsedName
  );

  if (byName) return byName;

  // Fallback 2: try to find by type_name only (least specific)
  const byTypeName = Object.values(sheetDefinitions).find(
    (d): d is SheetDefinition => "type_name" in d && d.type_name === paramType
  );

  return byTypeName || null;
}

export async function getLayersForSprite(
  params: Partial<SpriteConfigQueryParams>
): Promise<SpriteLayer[]> {
  const layers: SpriteLayer[] = [];
  const sex = params.sex || "male";

  for (const [paramType, rawValue] of Object.entries(params)) {
    if (!rawValue || paramType === "sex") continue;

    const value = rawValue.toString();
    logger.info(`\nProcessing param: ${yellow(paramType)}=${yellow(value)}`);

    // === SPECIAL CASE: body ===
    if (paramType === "body") {
      if (value.startsWith("Body_color_")) {
        const variant = value.replace("Body_color_", "");
        const fileName = await findValidAnimationFile({
          componentPath: `body/bodies/${sex}`,
          variant,
        });

        if (fileName) {
          layers.push({
            fileName,
            zPos: 1,
            name: `body_${sex}`,
            variant,
            supportedAnimations: [],
          });
          logger.info(`✅ Found body file: ${fileName}`);
        }
      }
      continue;
    }

    // === SPECIAL CASE: head (only for Human heads) ===
    if (paramType === "head" && value.startsWith("Human_")) {
      // Human head format: "Human_female_bronze" or "Human_male_plump_bright_green"
      // -> path: head/heads/human/female/, variant: bronze or bright_green
      const parts = value.split("_");
      if (parts.length >= 3) {
        const [headType, headSex, ...rest] = parts;
        if (!headType || !headSex) {
          logger.error(`❌ Invalid head format: ${value}`);
          continue;
        }

        // Check if there's a body type modifier (plump, gaunt, small)
        const bodyTypeModifiers = ["plump", "gaunt", "small"];
        let variant = rest.join("_");

        if (rest.length > 0 && rest[0] && bodyTypeModifiers.includes(rest[0])) {
          // Skip the body type modifier and use remaining parts as variant
          variant = rest.slice(1).join("_");
        }

        const fileName = await findValidAnimationFile({
          componentPath: `head/heads/${headType.toLowerCase()}/${headSex}/`,
          variant,
        });

        if (fileName) {
          layers.push({
            fileName,
            zPos: 10,
            name: `head_${headSex}`,
            variant,
            supportedAnimations: [],
          });
          logger.info(`✅ Found head file: ${fileName}`);
        }
      }
      continue;
    }

    // Non-human heads (Goblin, etc.) fall through to general case handling

    // === GENERAL CASE: All other components ===

    // Special handling for "none_*" values - skip them early
    if (value.toLowerCase().startsWith("none_")) {
      logger.info(`⏭️  Skipping none value: ${value}`);
      continue;
    }

    // First pass: heuristic parse to find sheet definition
    const { name: heuristicName } = parseValueHeuristic(value);

    const sheetDefinition = findSheetDefinition(paramType, heuristicName);

    if (!sheetDefinition) {
      logger.error(
        `❌ No sheet definition found for param: ${paramType}, name: ${heuristicName}, value: ${value}`
      );
      continue;
    }

    // Second pass: refined parse using the sheet definition
    const { name, variant } = parseValue(value, sheetDefinition);

    if (!variant || !name) {
      logger.error(`❌ Could not parse name/variant from value: ${value}`);
      continue;
    }

    logger.info(
      `✅ Found sheet definition: ${sheetDefinition.name} (type: ${sheetDefinition.type_name}), variant: ${variant}`
    );

    // Process all layers (1-8)
    for (let i = 1; i <= 8; i++) {
      const layerKey = `layer_${i}` as keyof SheetDefinition;
      const layer = sheetDefinition[layerKey] as LayerDefinition | undefined;

      if (!layer) continue;

      // Skip layers with custom_animation - they're only for custom animations, not standard sprites
      if (layer.custom_animation) {
        logger.debug(
          `Skipping ${paramType} layer ${i} - has custom_animation: ${layer.custom_animation}`
        );
        continue;
      }

      // Get path for current sex
      let componentPath = layer[sex as keyof LayerDefinition] as
        | string
        | undefined;

      if (!componentPath) {
        logger.debug(`No path for ${paramType} layer ${i} sex ${sex}`);
        continue;
      }

      // Handle replace_in_path for special components (like expressions)
      if (sheetDefinition.replace_in_path) {
        const headValue = params.head?.toString() || "";
        const headKey = headValue.split("_").slice(0, 3).join("_"); // e.g., "Human_male_plump"
        const replaceMap = sheetDefinition.replace_in_path.head as Record<
          string,
          string
        >;

        if (replaceMap && replaceMap[headKey]) {
          componentPath = componentPath.replace("${head}", replaceMap[headKey]);
          logger.debug(
            `Replaced ${headKey} with ${replaceMap[headKey]} in path`
          );
        }
      }

      const fileName = await findValidAnimationFile({
        componentPath,
        variant,
        supportedAnimations: sheetDefinition.animations,
      });

      if (fileName) {
        layers.push({
          fileName,
          zPos: layer.zPos,
          name: `${paramType}_${layerKey}`,
          variant,
          supportedAnimations: sheetDefinition.animations || [],
        });
        logger.info(`✅ Found file for ${sheetDefinition.name}: ${fileName}`);
      } else {
        logger.error(
          `❌ No file found for ${sheetDefinition.name} variant ${variant}`
        );
      }
    }
  }

  return layers.sort((a, b) => a.zPos - b.zPos);
}
