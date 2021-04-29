import { u128, PersistentUnorderedMap, context, ContractPromiseBatch } from "near-sdk-as";
import { brokerMap, BROKER_MULTIPLIER } from "./model"

export const LOCKBOX_PREFIX = "u"
// Minimum funds (in Ⓝ) required to lock.
export const LOCK_AMOUNT = u128.from('1000000000000000000000000')
// Expected block time is around 1s and expected time to finality is around 2s.
export const BLOCK_OFFSET: u64 = 60 * 60 // ~1hr

@nearBindgen
export class DepositInfo {
  // The sender account id. i.e., the account locking the funds.
  sender: string
  // The block index at which funds should expire.
  expiration: u64
  /**
   * Information about a given deposit.
   * @param amount The amount of locked funds (in Ⓝ). Currently defaults to 1.
   */
  constructor(public amount: u128 = context.attachedDeposit) {
    this.sender = context.sender
    this.expiration = context.blockIndex + BLOCK_OFFSET
  }
  /**
   * Add additional funds to the existing deposit.
   * @param amount The additional funds to add.
   */
  addDeposit(amount: u128 = LOCK_AMOUNT): void {
    this.amount = u128.add(this.amount, amount)
    this.expiration += BLOCK_OFFSET
  }
  /**
   * Remove funds from the existing deposit.
   * @param amount The additional funds to add.
   */
  removeDeposit(amount: u128 = LOCK_AMOUNT): void {
    const newDeposit = u128.sub(this.amount, amount)
    if (newDeposit < u128.Zero) {
      throw new Error("insufficient deposit remaining")
    }
    this.amount = newDeposit
    this.expiration -= BLOCK_OFFSET
  }
}

@nearBindgen
export class LockInfo {
  /**
   * Information about locked funds.
   * @param accountId The target account id.
   * @param brokerId The target broker id.
   * @param deposit The associated locked funds/deposit.
   */
  constructor(
    public accountId: string,
    public brokerId: string,
    public deposit: DepositInfo) {}
}

export const lockMap = new PersistentUnorderedMap<string, LockInfo>(LOCKBOX_PREFIX)

/**
 * Return whether the given account has funds locked for a given broker.
 * @param accountId The account id for which funds have been locked.
 * @param brokerId The account id of the broker for which funds are locked.
 */
export function hasLocked(brokerId: string, accountId: string): bool {
  // We want to scope any queries for a given account to the given broker
  const key = `${brokerId}/${accountId}`
  const ok = lockMap.get(key)
  // If yes, is it still valid?
  return ok != null && ok.deposit.expiration > context.blockIndex
}

/**
 * Lock the funds for a given account scoped to a given broker.
 * The funds will be immediately deposited before the contract execution starts.
 * @param brokerId The account id of the broker to scope locked funds.
 * @param accountId The account id to use for locking funds. Defaults to sender.
 */
export function lockFunds(brokerId: string, accountId: string = context.sender): LockInfo {
  // If the provided broker is unknown to the contract, this is an error.
  if (!brokerMap.contains(brokerId)) {
    throw new Error("lockFunds: invalid broker id");
  }
  // TODO: Instead of requiring a brokerId, we could select one automatically

  if (context.attachedDeposit != LOCK_AMOUNT) {
    // Currently this is hard-coded. But we can have a "step" function here to
    // support multiple "tiers" of deposit amounts in the future.
    throw new Error("lockFunds: invalid attached deposit");
  }
  // If we already have locked funds for this key, that's ok, we'll just
  // increment the locked funds.
  const key = `${brokerId}/${accountId}`
  let info = lockMap.get(key)
  if (info) {
    // TODO: An alternative here is to allow multiple senders, and have deposit
    // be an array of deposits. This complicates checks and unlocking, but
    // may be more intuitive?
    if (info.deposit.sender != context.sender) {
      throw new Error("lockFunds: sender mismatch with previous deposit")
    }
    // Also increments our expiration block
    info.deposit.addDeposit(context.attachedDeposit)
  } else {
    // All required information is automatically extracted from context
    const deposit = new DepositInfo()
    // Create a new info object with the given deposit
    info = new LockInfo(accountId, brokerId, deposit)
  }
  lockMap.set(key, info);
  return info
}

/**
 * Release all expired lock sessions.
 */
export function unlockFunds(): void {
  let amount = LOCK_AMOUNT
  const entries = lockMap.entries()
  // AS doesn't support for ... of syntax
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const key = entry.key
    const value = entry.value
    if (value.deposit.expiration > context.blockIndex) {
      continue
    }
    // Return the min of LOCK_AMOUNT/original amount
    if (value.deposit.amount < amount) {
      amount = value.deposit.amount
    }
    const brokerCut = u128.mul(amount, BROKER_MULTIPLIER)
    if (brokerCut > u128.Zero) {
      // This should never happen
      if (amount < brokerCut) {
        amount = u128.Zero
      } else {
        amount = u128.sub(amount, brokerCut)
      }
      // Send the broker their cut
      ContractPromiseBatch.create(value.brokerId).transfer(brokerCut)  
    }
    // The rest goes back to the original sender
    ContractPromiseBatch.create(value.deposit.sender).transfer(amount)
    lockMap.delete(key)
  }
}