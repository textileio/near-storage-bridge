import { u128, PersistentUnorderedMap, context } from "near-sdk-as";

// LOCK-BOX

export const LOCKBOX_PREFIX = "a"
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
    this.expiration = context.blockIndex + BLOCK_OFFSET
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

// BROKER

// Broker cut multiplier.
// This is purposefully simplistic to test assumptions.
export const BROKER_MULTIPLIER = u128.Zero

export const BROKER_PREFIX = "b"

@nearBindgen
export class BrokerInfo {
  /**
   * Information about a registered broker.
   * @param brokerId The account id for the broker.
   * @param addresses The list of known addresses for the broker.
   * e.g., ["https://remote.api/v1"]
   */
  constructor(public brokerId: string, public addresses: string[]) {}
}

export const brokerMap = new PersistentUnorderedMap<string, BrokerInfo>(BROKER_PREFIX)

// REPORTING

export const REPORTING_PREFIX = "r"
export const PAYLOAD_PREFIX = `${REPORTING_PREFIX}/p`
export const DATA_PREFIX = `${REPORTING_PREFIX}/d`

@nearBindgen
export class PayloadOptions {
  constructor(public pieceCid: string = "", public deals: DealInfo[] = [], public dataCids: string[] = []) {}
}

@nearBindgen
export class DealInfo { 
  constructor(public dealId: string, public minerId: string, public expiration: u128) {}
}

@nearBindgen
export class PayloadInfo { 
  constructor(public payloadCid: string, public pieceCid: string, public deals: DealInfo[]) {}
}

export const payloadMap = new PersistentUnorderedMap<string, PayloadInfo>(PAYLOAD_PREFIX)
export const dataMap = new PersistentUnorderedMap<string, string[]>(DATA_PREFIX)
