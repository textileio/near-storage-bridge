import { context, PersistentUnorderedMap, u128 } from 'near-sdk-core';

// Broker cut multiplier.
// TODO: This is purposefully simplistic to test assumptions.
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

/**
 * Add or update a registered broker.
 * This method can only be called by the contract account id.
 */
export function deleteBroker(brokerId: string): void {
  if (context.sender != context.contractName) {
    throw new Error("invalid sender account id")
  }
  brokerMap.delete(brokerId)
}

/**
 * Add or update a registered broker.
 * This method can only be called by the contract account id.
 */
export function setBroker(brokerId: string, info: BrokerInfo): void {
  if (context.sender != context.contractName) {
    throw new Error("invalid sender account id")
  }
  brokerMap.set(brokerId, info)
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