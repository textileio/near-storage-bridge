import { u128, context, ContractPromiseBatch } from "near-sdk-as";
import {
  lockMap,
  brokerMap,
  BROKER_MULTIPLIER,
  LockInfo,
  LOCK_AMOUNT,
  DepositInfo,
  BrokerInfo,
  dataMap,
  payloadMap,
  PayloadInfo
} from "./model"

// LOCK-BOX

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

// BROKER

/**
 * Add or update a registered broker.
 * This method can only be called by the contract account id.
 */
export function deleteBroker(brokerId: string): void {
  if (context.sender != context.contractName) {
    throw new Error("invalid sender account id")
  }
  const keys = lockMap.keys()
  // Since AS doesn't support closures yet, we can't use keys.some here
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key.includes(brokerId)) {
      throw new Error("cannot delete broker with locked funds")
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

// REPORTING

/**
 * List payload records.
 * @param offset Offset from the most recent record. Defaults to 0.
 * @param maxLength The max number of records to return. Defaults to 100.
 * @returns A list of payload records, ordered from most recent to oldest.
 */
export function listPayloads(offset: i32 = 0, maxLength: i32 = 100): PayloadInfo[] {
  const start: i32 = max(payloadMap.length - (offset + maxLength), 0)
  const end: i32 = payloadMap.length - offset
  return payloadMap.values(start, end).reverse()
}

/**
 * Get a payload record by payload cid.
 * @param payloadCid The payload cid.
 * @returns A payload record.
 */
export function getByPayload(payloadCid: string): PayloadInfo | null {
  return payloadMap.get(payloadCid)
}

/**
 * Get a payload record by data cid.
 * @param dataCid The data cid.
 * @returns A payload record.
 */
export function getByCid(dataCid: string): PayloadInfo | null {
  const payload = dataMap.get(dataCid)
  if (payload) {
    return payloadMap.get(payload)
  }
  return null
}

/**
 * Push a new payload record and optionally update cid mappings.
 * @param payload The payload information.
 * @param dataCids A set of cids to map to the given payload.
 */
export function pushPayload(payload: PayloadInfo, dataCids: string[] = []): void {
    // If the provided broker is unknown to the contract, this is an error.
  if (!brokerMap.contains(context.sender)) {
    throw new Error("pushPayload: invalid broker id");
  }
  payloadMap.set(payload.payloadCid, payload)
  for (let i = 0; i < dataCids.length; i++) {
    // TODO: Do we _want_ to overwrite this?
    dataMap.set(dataCids[i], payload.payloadCid)
  }
}