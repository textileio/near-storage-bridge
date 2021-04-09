import { context, u128, PersistentMap } from "near-sdk-as";

/**
 * Minimum funds (in Near) required to lock.
 */
export const LOCK_AMOUNT = u128.from('1000000000000000000000000')

/** 
 * The `LockInfo` class represents info about locked funds.
 */
@nearBindgen
export class LockInfo {
  /**
   * The amount of locked funds (in Near).
   */
  deposit: u128;
  /**
   * The provider account.
   */
  sender: string
  /**
   * Create a new `LockInfo` object.
   * @param accountId The target account id.
   */
  constructor(public accountId: string) {
    this.deposit = context.attachedDeposit
    this.sender = context.sender
  }
}

/**
 * The lock `box` is the persistent map of accountId => locked fund info.
 */
export const box = new PersistentMap<string, LockInfo>("m");