/**
 * Extensions index - export all extensions from here
 */

export { Interactable, type InteractableConfig } from "./Interactable";
export { HoldInteractable, type HoldInteractableConfig } from "./HoldInteractable";
export { Respawnable, type RespawnableConfig } from "./Respawnable";
export { ExtensionNames, type Extension, type ExtensionClass, type ExtensionName } from "./types";

/**
 * Map of extension names to their classes for factory pattern
 */
import { Interactable } from "./Interactable";
import { HoldInteractable } from "./HoldInteractable";
import { Respawnable } from "./Respawnable";

export const extensionsMap = {
  interactable: Interactable,
  holdInteractable: HoldInteractable,
  respawnable: Respawnable,
} as const;

