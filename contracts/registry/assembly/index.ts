import { logging, PersistentSet } from "near-sdk-as";
import { onlyOwner } from "../../ownable/assembly";
export {
  transferOwnership,
  renounceOwnership,
  owner,
} from "../../ownable/assembly";

// Events
function ProviderAdded(provider: string): void {
  logging.log(`ProviderAdded("${provider}")`);
}

function ProviderRemoved(provider: string): void {
  logging.log(`ProviderRemoved("${provider}")`);
}

// State

export const providers = new PersistentSet<string>("p");

/**
 * Add a provider to the registry.
 * Can only be called by the current owner.
 */
export function addProvider(provider: string): void {
  notPayable();
  onlyOwner();
  providers.add(provider);
  ProviderAdded(provider);
}

/**
 * Remove a provider from the registry.
 * Can only be called by the current owner.
 */
export function removeProvider(provider: string): void {
  notPayable();
  onlyOwner();
  providers.delete(provider);
  ProviderRemoved(provider);
}

/**
 * List all providers in the registry.
 */
export function listProviders(): string[] {
  return providers.values();
}
