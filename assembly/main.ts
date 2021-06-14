import { u128, context, ContractPromiseBatch } from "near-sdk-as";
import {
  depositMap,
  brokerMap,
  BROKER_MULTIPLIER,
  DepositInfo,
  DEPOSIT_AMOUNT,
  Deposit,
  BrokerInfo,
} from "./model"

// DEPOSITS

/**
 * Return whether the given account has funds deposited for a given broker.
 * @param accountId The account id for which funds have been deposited.
 * @param brokerId The account id of the broker for which funds are deposited.
 */
export function hasDeposit(brokerId: string, accountId: string): bool {
  // We want to scope any queries for a given account to the given broker
  const key = `${brokerId}/${accountId}`
  const ok = depositMap.get(key)
  // If yes, is it still valid?
  return ok != null && ok.deposit.expiration > context.blockIndex
}

/**
 * Lock the funds for a given account scoped to a given broker.
 * The funds will be immediately deposited before the contract execution starts.
 * @param brokerId The account id of the broker to scope deposited funds.
 * @param accountId The account id to use for depositing funds. Defaults to sender.
 */
export function addDeposit(brokerId: string, accountId: string = context.sender): DepositInfo {
  // If the provided broker is unknown to the contract, this is an error.
  if (!brokerMap.contains(brokerId)) {
    throw new Error("addDeposit: invalid broker id");
  }
  // TODO: Instead of requiring a brokerId, we could select one automatically

  if (context.attachedDeposit != DEPOSIT_AMOUNT) {
    // Currently this is hard-coded. But we can have a "step" function here to
    // support multiple "tiers" of deposit amounts in the future.
    throw new Error("addDeposit: invalid attached deposit");
  }
  // If we already have deposited funds for this key...
  // just increment the deposited funds.
  const key = `${brokerId}/${accountId}`
  let info = depositMap.get(key)
  if (info) {
    // TODO: An alternative here is to allow multiple senders, and have deposit
    // be an array of deposits. This complicates checks and debiting, but
    // may be more intuitive?
    if (info.deposit.sender != context.sender) {
      throw new Error("addDeposit: sender mismatch with previous deposit")
    }
    // Also increments our expiration block
    info.deposit.addDeposit(context.attachedDeposit)
  } else {
    // All required information is automatically extracted from context
    const deposit = new Deposit()
    // Create a new info object with the given deposit
    info = new DepositInfo(accountId, brokerId, deposit)
  }
  depositMap.set(key, info);
  return info
}

/**
 * Release all expired sessions.
 */
export function releaseDeposits(): void {
  const entries = depositMap.entries()
  // AS doesn't support for ... of syntax
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const key = entry.key
    const value = entry.value
    if (value.deposit.expiration > context.blockIndex) {
      continue
    }
    let amount = value.deposit.amount
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
    depositMap.delete(key)
  }
}

// BROKER

/**
 * Add or update a registered broker.
 * This method can only be called by the contract account id.
 */
export function deleteBroker(brokerId: string): void {
  if (context.sender != context.contractName) {
    throw new Error("invalid sender account id")
  }
  const keys = depositMap.keys()
  // Since AS doesn't support closures yet, we can't use keys.some here
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key.includes(brokerId)) {
      throw new Error("cannot delete broker with deposited funds")
    }
  }
  brokerMap.delete(brokerId)
}

/**
 * Add or update a registered broker.
 * This method can only be called by the contract account id.
 */
export function setBroker(brokerId: string, addrs: string[]): BrokerInfo {
  if (context.sender != context.contractName) {
    throw new Error("invalid sender account id")
  }
  const info = new BrokerInfo(brokerId, addrs)
  brokerMap.set(brokerId, info)
  return info
}

/**
 * Return information (addresses) about a given registered broker.
 * @param brokerId The account id of the broker.
 */
export function getBroker(brokerId: string): BrokerInfo | null {
  return brokerMap.get(brokerId);
}

/**
 * Return a list of registered brokers.
 */
export function listBrokers(): BrokerInfo[] {
  return brokerMap.values();
}
