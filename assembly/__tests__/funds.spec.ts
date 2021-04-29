/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { lockFunds, hasLocked, setBroker, unlockFunds } from '../main';
import { LockInfo, lockMap, LOCK_AMOUNT, DepositInfo, BrokerInfo, brokerMap } from '../model';
import { VMContext, Context, u128 } from 'near-sdk-as';

const ZERO = u128.Zero

describe('locking tests', () => {
  beforeEach(() => {
    VMContext.setCurrent_account_id("user.test")
    VMContext.setSigner_account_id("user.test")
    VMContext.setAttached_deposit(ZERO);
    VMContext.setAccount_balance(ZERO);
    setBroker("broker.id", new BrokerInfo("broker.id", ["blah"]))
  });

  afterEach(() => {
    lockMap.clear()
  });

  it('requires exactly x attached deposit to proceed', () => {
    VMContext.setAttached_deposit(ZERO);
    // If expect.toThrow is used on anything other than a () => void function
    // type, it will result in a compile time error!
    expect(() => {
      lockFunds("broker.id", "user.test")
    }).toThrow("should have throw expectation error")

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })

  it('requires and accepts attached deposit', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    lockFunds("broker.id", "user.test");

    expect(Context.accountBalance.toString()).toStrictEqual(
      LOCK_AMOUNT.toString(),
      'balance should be 1 Near'
    );
  });

  it('determines if the lock session has timed out/is valid', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    VMContext.setBlock_index(10)
    lockFunds("broker.id", "user.test");

    let ok = hasLocked("broker.id", "user.test")
    expect(ok).toBeTruthy()

    // Move forward about one hour and a bit
    VMContext.setBlock_index(60 * 60 + 30)

    ok = hasLocked("broker.id", "user.test")

    expect(ok).toBeFalsy()

    expect(Context.blockIndex).toStrictEqual(60 * 60 + 30)
  })

  it('locks some funds', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    expect(lockMap.contains("user.test")).toBe(
      false,
      'should not contain "user.test" yet'
    );
    const info = lockFunds("broker.id"); // Use default account id
    expect(info.accountId).toStrictEqual("user.test")
    expect(info.brokerId).toStrictEqual("broker.id")

    expect(lockMap.contains("broker.id/user.test")).toBe(
      true,
      'should contain "user.test"'
    );
    expect(lockMap.getSome("broker.id/user.test").deposit.sender).toStrictEqual(
      "user.test",
      'should have sender as "user.test"'
    );
    expect(lockMap.getSome("broker.id/user.test")).toStrictEqual(
      new LockInfo("user.test", "broker.id", new DepositInfo()),
      'locked funds should be for "user.test"'
    );
  });

  it('can lock on behalf of another account id', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    lockFunds("broker.id", "other.user");
    expect(lockMap.contains("broker.id/other.user")).toBe(
      true,
      'should contain "other.user"'
    );
    expect(lockMap.getSome("broker.id/other.user").deposit.sender).toStrictEqual(
      "user.test",
      'sender should be set to "user.test"'
    );
  })

  it('can increment funds for the same sender', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    expect(lockMap.contains("user.test")).toBe(
      false,
      'should not contain "user.test" yet'
    );
    lockFunds("broker.id"); // Use default account id

    expect(lockMap.getSome("broker.id/user.test").deposit.amount).toStrictEqual(
      LOCK_AMOUNT
    );

    lockFunds("broker.id"); // Use default account id

    expect(lockMap.getSome("broker.id/user.test").deposit.amount).toStrictEqual(
      u128.mul(LOCK_AMOUNT, u128.from(2))
    );
  });

  it('should fail when adding funds from different sender (for same user)', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    expect(lockMap.contains("user.test")).toBe(
      false,
      'should not contain "user.test" yet'
    );
    lockFunds("broker.id", "user.test"); // Use default account id

    expect(lockMap.getSome("broker.id/user.test").deposit.amount).toStrictEqual(
      LOCK_AMOUNT
    );

    VMContext.setSigner_account_id("sender.test")

    expect(() => {
      lockFunds("broker.id", "user.test"); // Use default account id
    }).toThrow()

    expect(lockMap.getSome("broker.id/user.test").deposit.amount).toStrictEqual(
      LOCK_AMOUNT
    );
  });

  it('should not release funds from an ongoing session', () => {
    // Use the name account id for everything here
    lockMap.set("user.test/user.test", new LockInfo("user.test", "user.test", new DepositInfo()))
    brokerMap.set("user.test", new BrokerInfo("user.test", []))
    const initialStorage = Context.storageUsage

    VMContext.setAttached_deposit(u128.Zero); 
    // Move forward a little bit
    VMContext.setBlock_index(30)
    unlockFunds()
    
    expect(Context.storageUsage).toStrictEqual(
      initialStorage,
      'usage should be unchanged'
    );
  });

  it('should release funds from an expired session', () => {
    // Use the name account id for everything here
    lockMap.set("user.test/user.test", new LockInfo("user.test", "user.test", new DepositInfo()))
    brokerMap.set("user.test", new BrokerInfo("user.test", []))
    const initialStorage = Context.storageUsage

    VMContext.setAttached_deposit(u128.Zero); 
    // Move forward a lot
    VMContext.setBlock_index(60 * 60 + 30)
    unlockFunds()
    
    expect(Context.storageUsage).toBeLessThan(
      initialStorage,
      'usage should be reduced'
    );
  });

  it('should not release funds to broker without locked funds', () => {
    // We already have funds one broker, let's add another
    brokerMap.set("user.test", new BrokerInfo("user.test", []))
    // Our default broker will have funds locked, but NOT our new one
    const deposit = new DepositInfo(LOCK_AMOUNT)
    lockMap.set("broker.id/user.test", new LockInfo("user.test", "broker.id", deposit))
    
    const initialStorage = Context.storageUsage

    VMContext.setAttached_deposit(ZERO);
    // This should essentially be a "no op"
    unlockFunds()
    
    expect(Context.storageUsage).toStrictEqual(
      initialStorage,
      'usage should be unchanged'
    );
  });

  // TODO: More tests! The above appears to be really really flaky due to the
  // global VMContext... need to learn how to deal with that better or move
  // to a Rust-based contract?
});