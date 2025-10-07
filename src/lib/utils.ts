import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEffectiveSex(sex: string | undefined): string {
  switch (sex) {
    case "teen":
    case "pregnant":
      return "female";
    case "muscular":
      return "male";
    default:
      return sex || "male";
  }
}
