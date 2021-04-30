import { u128, PersistentUnorderedMap, PersistentMap, context } from "near-sdk-as";
import { brokerMap } from "./model"

export const REPORTING_PREFIX = "r"
export const PAYLOAD_PREFIX = `${REPORTING_PREFIX}/p`
export const DATA_PREFIX = `${REPORTING_PREFIX}/D`

@nearBindgen
export class DealInfo { 
  constructor(public dealId: string, public minerId: string, public expiration: u128) {}
}

@nearBindgen
export class PayloadInfo { 
  constructor(public payloadCid: string, public pieceCid: string, public deals: DealInfo[]) {}
}

@nearBindgen
export class DataInfo { 
  // TODO: This can simply be reduced to a string => string mapping!
  constructor(public dataCid: string, public payloadCid: string) {}
}

export const payloadMap = new PersistentUnorderedMap<string, PayloadInfo>(PAYLOAD_PREFIX)
export const dataMap = new PersistentMap<string, string>(DATA_PREFIX)

// /**
//  * Push a new payload record and optionally update cid mappings.
//  * @param payload The payload information.
//  * @param dataCids A set of cids to map to the given payload.
//  */
// export function pushPayload(payload: PayloadInfo, dataCids: string[] = []): void {
//     // If the provided broker is unknown to the contract, this is an error.
//   if (!brokerMap.contains(context.sender)) {
//     throw new Error("pushPayload: invalid broker id");
//   }
//   payloadMap.set(payload.payloadCid, payload)
//   for (let i = 0; i < dataCids.length; i++) {
//     // TODO: Do we _want_ to overwrite this?
//     dataMap.set(dataCids[i], payload.payloadCid)
//   }
// }

/**
 * List payload records.
 * @param offset Offset from the most recent record. Defaults to 0.
 * @param maxLength The max number of records to return. Defaults to 100.
 * @returns A list of payload records, ordered from most recent to oldest.
 */
export function listPayloads(offset: i32 = 0, maxLength: i32 = 100): PayloadInfo[] {
  notPayable()

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
  notPayable()

  return payloadMap.get(payloadCid)
}

/**
 * Get a payload record by data cid.
 * @param dataCid The data cid.
 * @returns A payload record.
 */
export function getByCid(dataCid: string): PayloadInfo | null {
  notPayable()

  const payload = dataMap.get(dataCid)
  if (payload) {
    return payloadMap.get(payload)
  }
  return null
}