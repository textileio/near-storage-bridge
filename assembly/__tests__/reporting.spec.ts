  /* eslint-disable @typescript-eslint/no-non-null-assertion */
import { updatePayload, listPayloads, getByPayload, getByCid } from '../main';
import { payloadMap, dataMap, BrokerInfo, brokerMap, PayloadInfo, DealInfo, PayloadOptions } from "../model"
import { VMContext, Context, u128 } from 'near-sdk-as';

const ZERO = u128.Zero

describe('reporting tests', () => {
  beforeEach(() => {
    VMContext.setCurrent_account_id("user.test")
    VMContext.setSigner_account_id("user.test")
    VMContext.setAttached_deposit(ZERO);
    VMContext.setAccount_balance(ZERO);
  });

  afterEach(() => {
    payloadMap.clear()
    dataMap.clear()
  });

  it('should start with empty maps', () => {
    expect(listPayloads()).toHaveLength(0)
    expect(dataMap.contains("cid")).toBeFalsy()
    expect(payloadMap.keys()).toHaveLength(0)

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })

  it('should allow pushing records from known brokers', () => {
    brokerMap.set("user.test", new BrokerInfo("user.test", []))
    
    expect(payloadMap).toHaveLength(0)
    const opts = new PayloadOptions("piece")
    updatePayload("payload", opts)

    expect(payloadMap).toHaveLength(1)
  })

  it('should not accept pushes from unknown brokers', () => {
    expect(() => {
      updatePayload("payload", new PayloadOptions("piece"))
    }).toThrow()
  })

  it('should list payloads and support offset/length', () => {
    const deal = new DealInfo(1, "miner", u128.One)
    const payload1 = new PayloadInfo("payload1", "piece1", [deal])
    const payload2 = new PayloadInfo("payload2", "piece2", [deal])
    payloadMap.set("payload1", payload1)
    payloadMap.set("payload2", payload2)

    let list = listPayloads()
    expect(list).toHaveLength(2)

    list = listPayloads(0, 1)
    expect(list).toHaveLength(1)

    list = listPayloads(1, 1)
    expect(list).toHaveLength(1)

    expect(list.pop().pieceCid).toStrictEqual("piece1")

    // Should be out of bounds
    list = listPayloads(2)
    expect(list).toHaveLength(0)
  })

  it('should get payloads by payload id', () => {
    const deal = new DealInfo(1, "miner", u128.One)
    const payload1 = new PayloadInfo("payload1", "piece1", [deal])
    const payload2 = new PayloadInfo("payload2", "piece2", [deal])
    payloadMap.set("payload1", payload1)
    payloadMap.set("payload2", payload2)

    let payload = getByPayload("payload1")
    expect(payload!.pieceCid).toStrictEqual("piece1")

    payload = getByPayload("payload2")
    expect(payload!.pieceCid).toStrictEqual("piece2")

    payload = getByPayload("missing")
    expect(payload).toBeNull()

    payloadMap.delete("payload2")

    payload = getByPayload("payload2")
    expect(payload).toBeNull()
  })

  it('should get payloads by data cid', () => {
    const deal = new DealInfo(1, "miner", u128.One)
    const payload1 = new PayloadInfo("payload1", "piece1", [deal])
    const payload3 = new PayloadInfo("payload3", "piece3", [deal])
    payloadMap.set("payload1", payload1)
    payloadMap.set("payload3", payload3)

    dataMap.set("cid1", ["payload1"])
    dataMap.set("cid2", ["payload1"])
    dataMap.set("cid3", ["payload3"])

    let payload = getByCid("cid1")
    expect(payload[0].pieceCid).toStrictEqual("piece1")
    expect(getByCid("cid2")[0].pieceCid).toStrictEqual("piece1")

    payload = getByCid("cid3")
    expect(payload[0].pieceCid).toStrictEqual("piece3")

    payload = getByCid("missing")
    expect(payload).toHaveLength(0)

    payloadMap.delete("payload3")

    const info = getByPayload("cid3")
    expect(info).toBeNull()
  })

  it('should support updating by partial payloads', () => {
    brokerMap.set("user.test", new BrokerInfo("user.test", []))

    const one = new DealInfo(1, "miner", u128.One)
    const two = new DealInfo(2, "miner", u128.One)
    const init = new PayloadInfo("payload", "piece", [one])
    payloadMap.set("payload", init)

    dataMap.set("cid1", ["payload"])
    dataMap.set("cid2", ["payload"])

    let payload = getByCid("cid1")
    expect(payload[0].deals).toHaveLength(1)

    const update1 = new PayloadOptions("piece", [two], [])
    updatePayload("payload", update1)

    payload = getByCid("cid1")
    expect(payload[0].deals).toHaveLength(2)

    // Should also be able to just update the dataCids
    const update2 = new PayloadOptions("", [], ["cid3"])
    updatePayload("payload", update2)

    payload = getByCid("cid3")
    expect(payload[0].deals).toHaveLength(2)
  })
})
