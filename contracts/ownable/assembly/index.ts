import { context, logging, storage } from "near-sdk-as";

/**
 * Logging event fired when ownership has been transferred.
 */
function OwnershipTransfered(account: string): void {
  const event = "OwnershipTransferred";
  const info = `{"account":"${account}"}`;
  logging.log(`{"event":"${event}","info":${info}}`);
}

/**
 * Helper function to assert a function is only called by the contract owner.
 */
export function onlyOwner(): void {
  assert(context.sender == owner(), "Ownable: caller is not the owner");
}

// Internal
function setOwner(account: string): void {
  notPayable();
  onlyOwner();
  storage.setString("_owner", account);
  OwnershipTransfered(account);
}

/**
 * Returns the current contract owner.
 *
 * This will default to the contract itself if ownership has not been transferred or renounced.
 */
export function owner(): string {
  notPayable();
  const own = storage.getString("_owner");
  if (own == null) {
    // Not set yet, so we default to contractName
    return context.contractName;
  }
  return own as string;
}

/**
 * Leaves the contract without owner. It will not be possible to call
 * functions with an owership guard anymore. Can only be called by the current owner.
 *
 * Renouncing ownership will leave the contract without an owner,
 * thereby removing any functionality that is only available to the owner.
 */
export function renounceOwnership(): void {
  notPayable();
  setOwner("");
}

/**
 * Transfers ownership of the contract to a new account (`account`).
 * Can only be called by the current owner.
 */
export function transferOwnership(account: string): void {
  notPayable();
  assert(account != "", "new owner cannot be empty");
  setOwner(account);
}
