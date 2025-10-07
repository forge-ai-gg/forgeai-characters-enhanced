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
 */
function parseValue(value: string): { name: string; variant: string } {
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

    // === SPECIAL CASE: head ===
    if (paramType === "head") {
      // head format: "Human_female_bronze" -> path: head/heads/human/female/, variant: bronze
      const parts = value.split("_");
      if (parts.length >= 3) {
        const [headType, headSex, ...variantParts] = parts;
        if (!headType || !headSex) {
          logger.error(`❌ Invalid head format: ${value}`);
          continue;
        }
        const variant = variantParts.join("_");
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

    // === GENERAL CASE: All other components ===

    // Special handling for "none_*" values - skip them early
    if (value.toLowerCase().startsWith("none_")) {
      logger.info(`⏭️  Skipping none value: ${value}`);
      continue;
    }

    const { name, variant } = parseValue(value);

    if (!variant || !name) {
      logger.error(`❌ Could not parse name/variant from value: ${value}`);
      continue;
    }

    const sheetDefinition = findSheetDefinition(paramType, name);

    if (!sheetDefinition) {
      logger.error(
        `❌ No sheet definition found for param: ${paramType}, name: ${name}, value: ${value}`
      );
      continue;
    }

    logger.info(
      `✅ Found sheet definition: ${sheetDefinition.name} (type: ${sheetDefinition.type_name})`
    );

    // Process all layers (1-8)
    for (let i = 1; i <= 8; i++) {
      const layerKey = `layer_${i}` as keyof SheetDefinition;
      const layer = sheetDefinition[layerKey] as LayerDefinition | undefined;

      if (!layer) continue;

      // Get path for current sex
      const componentPath = layer[sex as keyof LayerDefinition] as
        | string
        | undefined;

      if (!componentPath) {
        logger.debug(`No path for ${paramType} layer ${i} sex ${sex}`);
        continue;
      }

      // Try to find the file with variant (check variants list for proper format)
      let finalVariant = variant;
      if (sheetDefinition.variants) {
        // Check if variant with space exists in variants list
        const variantWithSpace = variant.replace(/_/g, " ");
        if (sheetDefinition.variants.includes(variantWithSpace)) {
          finalVariant = variantWithSpace;
        } else if (!sheetDefinition.variants.includes(variant)) {
          // If neither underscore nor space version exists, log warning
          logger.warn(
            `⚠️  Variant "${variant}" not found in variants list for ${sheetDefinition.name}`
          );
        }
      }

      const fileName = await findValidAnimationFile({
        componentPath,
        variant: finalVariant,
        supportedAnimations: sheetDefinition.animations,
      });

      if (fileName) {
        layers.push({
          fileName,
          zPos: layer.zPos,
          name: `${paramType}_${layerKey}`,
          variant: finalVariant,
          supportedAnimations: sheetDefinition.animations || [],
        });
        logger.info(`✅ Found file for ${sheetDefinition.name}: ${fileName}`);
      } else {
        logger.error(
          `❌ No file found for ${sheetDefinition.name} variant ${finalVariant}`
        );
      }
    }
  }

  return layers.sort((a, b) => a.zPos - b.zPos);
}
