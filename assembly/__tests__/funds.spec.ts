/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { addDeposit, hasDeposit, setBroker, releaseDeposits } from '../main';
import { DepositInfo, depositMap, DEPOSIT_AMOUNT, Deposit, BrokerInfo, brokerMap } from '../model';
import { VMContext, Context, u128 } from 'near-sdk-as';

const ZERO = u128.Zero

describe('releasing funds tests', () => {
  beforeEach(() => {
    VMContext.setCurrent_account_id("user.test")
    VMContext.setSigner_account_id("user.test")
    VMContext.setAttached_deposit(ZERO);
    VMContext.setAccount_balance(ZERO);
    setBroker("broker.id", ["blah"])
  });

  afterEach(() => {
    depositMap.clear()
  });

  it('requires exactly x attached deposit to proceed', () => {
    VMContext.setAttached_deposit(ZERO);
    // If expect.toThrow is used on anything other than a () => void function
    // type, it will result in a compile time error!
    expect(() => {
      addDeposit("broker.id", "user.test")
    }).toThrow("should have throw expectation error")

    expect(Context.accountBalance.toString()).toStrictEqual(
      ZERO.toString(),
      'balance should be 0 Near'
    );
  })

  it('requires and accepts attached deposit', () => {
    VMContext.setAttached_deposit(DEPOSIT_AMOUNT);
    addDeposit("broker.id", "user.test");

    expect(Context.accountBalance.toString()).toStrictEqual(
      DEPOSIT_AMOUNT.toString(),
      'balance should be 1 Near'
    );
  });

  it('determines if the session has timed out/is valid', () => {
    VMContext.setAttached_deposit(DEPOSIT_AMOUNT);
    VMContext.setBlock_index(10)
    addDeposit("broker.id", "user.test");

    let ok = hasDeposit("broker.id", "user.test")
    expect(ok).toBeTruthy()

    // Move forward about one hour and a bit
    VMContext.setBlock_index(60 * 60 + 30)

    ok = hasDeposit("broker.id", "user.test")

    expect(ok).toBeFalsy()

    expect(Context.blockIndex).toStrictEqual(60 * 60 + 30)
  })

  it('should deposit some funds', () => {
    VMContext.setAttached_deposit(DEPOSIT_AMOUNT);
    expect(depositMap.contains("user.test")).toBe(
      false,
      'should not contain "user.test" yet'
    );
    const info = addDeposit("broker.id"); // Use default account id
    expect(info.accountId).toStrictEqual("user.test")
    expect(info.brokerId).toStrictEqual("broker.id")

    expect(depositMap.contains("broker.id/user.test")).toBe(
      true,
      'should contain "user.test"'
    );
    expect(depositMap.getSome("broker.id/user.test").deposit.sender).toStrictEqual(
      "user.test",
      'should have sender as "user.test"'
    );
    expect(depositMap.getSome("broker.id/user.test")).toStrictEqual(
      new DepositInfo("user.test", "broker.id", new Deposit()),
      'deposited funds should be for "user.test"'
    );
  });

  it('can leave deposit on behalf of another account id', () => {
    VMContext.setAttached_deposit(DEPOSIT_AMOUNT);
    addDeposit("broker.id", "other.user");
    expect(depositMap.contains("broker.id/other.user")).toBe(
      true,
      'should contain "other.user"'
    );
    expect(depositMap.getSome("broker.id/other.user").deposit.sender).toStrictEqual(
      "user.test",
      'sender should be set to "user.test"'
    );
  })

  it('can increment funds for the same sender', () => {
    VMContext.setAttached_deposit(DEPOSIT_AMOUNT);
    expect(depositMap.contains("user.test")).toBe(
      false,
      'should not contain "user.test" yet'
    );
    addDeposit("broker.id"); // Use default account id

    expect(depositMap.getSome("broker.id/user.test").deposit.amount).toStrictEqual(
      DEPOSIT_AMOUNT
    );

    addDeposit("broker.id"); // Use default account id

    expect(depositMap.getSome("broker.id/user.test").deposit.amount).toStrictEqual(
      u128.mul(DEPOSIT_AMOUNT, u128.from(2))
    );
  });

  it('should fail when adding funds from different sender (for same user)', () => {
    VMContext.setAttached_deposit(DEPOSIT_AMOUNT);
    expect(depositMap.contains("user.test")).toBe(
      false,
      'should not contain "user.test" yet'
    );
    addDeposit("broker.id", "user.test"); // Use default account id

    expect(depositMap.getSome("broker.id/user.test").deposit.amount).toStrictEqual(
      DEPOSIT_AMOUNT
    );

    VMContext.setSigner_account_id("sender.test")

    expect(() => {
      addDeposit("broker.id", "user.test"); // Use default account id
    }).toThrow()

    expect(depositMap.getSome("broker.id/user.test").deposit.amount).toStrictEqual(
      DEPOSIT_AMOUNT
    );
  });

  it('should not release funds from an ongoing session', () => {
    // Use the name account id for everything here
    depositMap.set("user.test/user.test", new DepositInfo("user.test", "user.test", new Deposit()))
    brokerMap.set("user.test", new BrokerInfo("user.test", []))
    const initialStorage = Context.storageUsage

    VMContext.setAttached_deposit(u128.Zero); 
    // Move forward a little bit
    VMContext.setBlock_index(30)
    releaseDeposits()
    
    expect(Context.storageUsage).toStrictEqual(
      initialStorage,
      'usage should be unchanged'
    );
  });

  it('should release funds from an expired session', () => {
    // Use the name account id for everything here
    depositMap.set("user.test/user.test", new DepositInfo("user.test", "user.test", new Deposit()))
    brokerMap.set("user.test", new BrokerInfo("user.test", []))
    const initialStorage = Context.storageUsage

    VMContext.setAttached_deposit(u128.Zero); 
    // Move forward a lot
    VMContext.setBlock_index(60 * 60 + 30)
    releaseDeposits()
    
    expect(Context.storageUsage).toBeLessThan(
      initialStorage,
      'usage should be reduced'
    );
  });

  it('should not release funds to broker without deposited funds', () => {
    // We already have funds one broker, let's add another
    brokerMap.set("user.test", new BrokerInfo("user.test", []))
    // Our default broker will have funds deposited, but NOT our new one
    const deposit = new Deposit(DEPOSIT_AMOUNT)
    depositMap.set("broker.id/user.test", new DepositInfo("user.test", "broker.id", deposit))
    
    const initialStorage = Context.storageUsage

    VMContext.setAttached_deposit(ZERO);
    // This should essentially be a "no op"
    releaseDeposits()
    
    expect(Context.storageUsage).toStrictEqual(
      initialStorage,
      'usage should be unchanged'
    );
  });

  // TODO: More tests! The above appears to be really really flaky due to the
  // global VMContext... need to learn how to deal with that better or move
  // to a Rust-based contract?
});