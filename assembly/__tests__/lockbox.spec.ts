import { lockFunds, unlockFunds } from '../main';
import { LockInfo, box, LOCK_AMOUNT } from '../model';
import { VMContext, Context, u128 } from 'near-sdk-as';

const ZERO = u128.Zero

function createInfo(accountId: string): LockInfo {
  return new LockInfo(accountId);
}

describe('lock box tests', () => {
  beforeEach(() => {
    VMContext.setSigner_account_id("user.test")
    VMContext.setAttached_deposit(ZERO);
    VMContext.setAccount_balance(ZERO);
  });

  afterEach(() => {
    if (box.contains("user.test")) {
      box.delete("user.test")
    }
    if (box.contains("other.test")) {
      box.delete("other.test")
    }
  });

  it('requires exactly x attached deposit to proceed', () => {
    VMContext.setAttached_deposit(ZERO);
    // If expect.toThrow is used on anything other than a () => void function
    // type, it will result in a compile time error!
    expect(() => {
      lockFunds("user.test")
    }).toThrow("should have throw expectation error")

    expect(Context.accountBalance.toString()).toStrictEqual(
      '0',
      'balance should be 0'
    );
  })

  it('requires and accepts attached deposit', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    lockFunds("user.test");

    expect(Context.accountBalance.toString()).toStrictEqual(
      '1',
      'balance should be 1'
    );
  });

  it('returns the current block index', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    VMContext.setBlock_index(1234)
    const blockIndex = lockFunds(); // Use default
    expect(blockIndex).toStrictEqual(u128.from(1234))
  })

  it('locks some funds', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    expect(box.contains("user.test")).toBe(
      false,
      'should not contain "user.test" yet'
    );
    lockFunds(); // Use default
    expect(box.contains("user.test")).toBe(
      true,
      'should contain "user.test"'
    );
    expect(box.getSome("user.test").sender).toStrictEqual(
      "user.test",
      'should have sender as "user.test"'
    );
    expect(box.getSome("user.test")).toStrictEqual(
      createInfo('user.test'),
      'locked funds should be for "user.test"'
    );
  });

  it('does not accept deposit on release', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);

    expect(() => {
      unlockFunds("user.test")
    }).toThrow("should not accept deposit")
  });

  it('releases some funds', () => {
    box.set("user.test", createInfo("user.test"))
    expect(box.contains("user.test")).toBe(
      true,
      'should contain "user.test"'
    );
    VMContext.setAttached_deposit(ZERO);
    unlockFunds("user.test")
    expect(box.contains("user.test")).toBe(
      false,
      'should no longer contain "user.test"'
    );
  });

  it('returns the correct block index', () => {
    box.set("user.test", createInfo("user.test"))
    VMContext.setAttached_deposit(ZERO);
    VMContext.setBlock_index(1234)
    const blockIndex = unlockFunds("user.test")
    expect(blockIndex).toStrictEqual(u128.from(1234))
  });

  it('can lock on behalf of another account id', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    VMContext.setSigner_account_id("sender.test")
    lockFunds("user.test");
    expect(box.contains("user.test")).toBe(
      true,
      'should contain "user.test"'
    );
    expect(box.getSome("user.test").sender).toStrictEqual(
      "sender.test",
      'sender should be set to "sender.test"'
    );
  })

  it('does not release funds to other senders', () => {
    VMContext.setAttached_deposit(LOCK_AMOUNT);
    VMContext.setSigner_account_id("sender.test")
    lockFunds("user.test");
    VMContext.setAttached_deposit(ZERO);
    VMContext.setSigner_account_id("user.test")
    expect(() => {
      unlockFunds("user.test")
    }).toThrow("should not release funds to another account id")
  })
});
