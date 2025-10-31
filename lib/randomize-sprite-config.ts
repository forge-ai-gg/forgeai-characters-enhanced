import { SpriteConfigQueryParams } from "@/types/sprites";

/**
 * Randomizes sprite configuration based on provided options
 * @param options - Object with categories as keys and arrays of options as values
 * @returns Partial sprite configuration with randomized values
 */
export function randomizeSpriteConfig(
  options: Record<string, Array<{ name: string; value: string; variant: string }>>
): Partial<SpriteConfigQueryParams> {
  // Start with default config
  const newConfig: Partial<SpriteConfigQueryParams> = {
    body: "Body_color_light",
    head: "Human_male_light",
    sex: "male",
    shadow: undefined,
    expression: undefined,
    eyes: undefined,
    ears: undefined,
    nose: undefined,
    eyebrows: undefined,
    wrinkles: undefined,
    beard: undefined,
    mustache: undefined,
    hair: undefined,
    shoulders: undefined,
    arms: undefined,
    bauldron: undefined,
    bracers: undefined,
    gloves: undefined,
    ring: undefined,
    clothes: undefined,
    chainmail: undefined,
    legs: undefined,
    shoes: undefined,
    weapon: undefined,
    shield: undefined,
    animation: undefined,
    bodyColor: "light",
    special: undefined,
    prostheses: undefined,
    wings: undefined,
    wounds: false,
    wheelchair: false,
    lizard: false,
    matchBodyColor: false,
    weaponVariant: undefined,
  };

  // Categories to skip during randomization
  const skipCategories = new Set([
    "wings",
    "bauldron",
    "body",
    "head",
    "weapon",
    "shield",
    "chainmail",
    "ears",
    "beard", // Skip beard initially - will be handled separately based on sex
  ]);

  // Randomize each category if options are available
  Object.entries(options).forEach(
    ([categoryKey, categoryOptions]: [string, any]) => {
      // Skip categories that shouldn't be randomized
      if (skipCategories.has(categoryKey)) {
        return;
      }

      if (Array.isArray(categoryOptions) && categoryOptions.length > 0) {
        const randomOption =
          categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
        if (randomOption?.value) {
          newConfig[categoryKey as keyof SpriteConfigQueryParams] =
            randomOption.value;
        }
      }
    }
  );

  // Only randomize between male and female for body type
  const bodyTypes = ["male", "female"];

  // Always keep skin color as 'light'
  const bodyColor = "light";

  newConfig.sex = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
  newConfig.bodyColor = bodyColor;
  newConfig.body = `Body_color_${bodyColor}`;
  newConfig.head = `Human_${newConfig.sex}_${bodyColor}`;

  // Only add beard for male characters
  if (
    newConfig.sex !== "female" &&
    options.beard &&
    Array.isArray(options.beard) &&
    options.beard.length > 0
  ) {
    const randomBeard =
      options.beard[Math.floor(Math.random() * options.beard.length)];
    if (randomBeard?.value) {
      newConfig.beard = randomBeard.value;

      // Match beard color with hair color if hair is present
      if (newConfig.hair) {
        const hairParts = newConfig.hair.split("_");
        if (hairParts.length > 1) {
          const hairColor = hairParts[hairParts.length - 1];
          const beardParts = randomBeard.value.split("_");
          if (beardParts.length > 1) {
            const beardName = beardParts.slice(0, -1).join("_");
            newConfig.beard = `${beardName}_${hairColor}`;
          }
        }
      }
    }
  }

  return newConfig;
}

