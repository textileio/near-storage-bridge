/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { listBrokers, setBroker, deleteBroker, getBroker } from '../main';
import { brokerMap, DepositInfo, Deposit, depositMap } from '../model';
import { VMContext, Context, u128 } from 'near-sdk-as';

const ZERO = u128.Zero

describe('broker tests', () => {
  beforeEach(() => {
    VMContext.setCurrent_account_id("user.test")
    VMContext.setSigner_account_id("user.test")
    VMContext.setAttached_deposit(ZERO);
    VMContext.setAccount_balance(ZERO);
  });

  afterEach(() => {
    brokerMap.clear()
  });

  it('should start with an empty broker map', () => {
    expect(listBrokers()).toHaveLength(0)

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })

  it('should fail updating broker map with incorrect account', () => {    
    VMContext.setSigner_account_id("other.test")
    expect(() => {
      // If expect.toThrow is used on anything other than a () => void function
      // type, it will result in a compile time error!
      const brokerId = "broker.id"
      setBroker(brokerId, ["https://broker.io/api/v1"])
    }).toThrow()

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })

  it('should add a new broker when called from correct account', () => { 
    const brokerId = "broker.id"
    setBroker(brokerId, ["https://broker.io/api/v1"])

    expect(listBrokers()).toHaveLength(1)

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })

  it('should fail to delete a broker with deposited funds', () => {    
    const brokerId = "broker.id"
    const fakeUser = "fake.id"
    setBroker(brokerId, ["https://broker.io/api/v1"])
    const info = new DepositInfo(fakeUser, brokerId, new Deposit())
    depositMap.set(`${brokerId}/${fakeUser}`, info)

    expect(() => {
      // If expect.toThrow is used on anything other than a () => void function
      // type, it will result in a compile time error!
      const brokerId = "broker.id"
      deleteBroker(brokerId)
    }).toThrow()

    expect(listBrokers()).toHaveLength(1)

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })

  it('should fail deleting broker entry with incorrect account', () => {    
    VMContext.setSigner_account_id("other.test")
    expect(() => {
      // If expect.toThrow is used on anything other than a () => void function
      // type, it will result in a compile time error!
      const brokerId = "broker.id"
      deleteBroker(brokerId)
    }).toThrow()

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })

  it('should delete a broker from the map', () => { 
    const brokerId = "broker.id"
    setBroker(brokerId, ["https://broker.io/api/v1"])

    expect(listBrokers()).toHaveLength(1)

    deleteBroker(brokerId)

    expect(listBrokers()).toHaveLength(0)

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })

  it('should get a specific broker from the map', () => { 
    const brokerId = "broker.id"
    setBroker(brokerId, ["https://broker.io/api/v1"])

    expect(listBrokers()).toHaveLength(1)

    const broker = getBroker(brokerId)
    expect(broker!.brokerId).toStrictEqual(brokerId)
    expect(broker!.addresses).toHaveLength(1)

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })

  it('should update an existing broker', () => { 
    const brokerId = "broker.id"
    setBroker(brokerId, ["https://broker.io/api/v1"])

    expect(listBrokers()).toHaveLength(1)

    let broker = getBroker(brokerId)

    setBroker(brokerId, [])
    
    expect(listBrokers()).toHaveLength(1)

    broker = getBroker(brokerId)

    expect(broker!.addresses).toHaveLength(0)

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })
})
