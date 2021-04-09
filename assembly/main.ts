import { Context, ContractPromiseBatch, u128 } from 'near-sdk-core';
import { LockInfo, LockResponse, box, LOCK_AMOUNT } from './model';

/**
 * Lock the funds attached with this call for `accountId`.
 * The funds will be immediately deposited before the contract execution starts.
 * @param accountId The account id to use for locking funds. Defaults to sender.
 * @returns The current block index
 */
export function lockFunds(accountId: string = Context.sender): LockResponse {
  if (Context.attachedDeposit != LOCK_AMOUNT) {
    throw new Error(`funds not locked for "${accountId}": require ${LOCK_AMOUNT} attached deposit`);
  }
  if (!accountId) {
    accountId = Context.sender
  }
  if (box.contains(accountId)) {
    throw new Error(`funds not locked for "${accountId}": already has locked funds`)
  }
  // The context (sender, attachedDeposit) is pulled in automatically
  const info = new LockInfo(accountId);
  box.set(accountId, info);
  return new LockResponse(u128.from(Context.blockIndex))
}

/**
 * Release the locked funds, if any, for the specified `accountId`.
 * @param accountId The account id to use for locking funds. Defaults to sender.
 * @returns The current block index.
 */
export function unlockFunds(accountId: string = Context.sender): LockResponse {
  notPayable()
  const info = box.getSome(accountId)
  if (info.sender != Context.sender) {
    throw new Error(`funds not released to "${Context.sender}": permission denied`)
  }
  ContractPromiseBatch.create(info.sender).transfer(info.deposit)
  box.delete(accountId)
  return new LockResponse(u128.from(Context.blockIndex))
}