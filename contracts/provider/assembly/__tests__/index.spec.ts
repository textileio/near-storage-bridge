import {
  transferOwnership,
  owner,
  providerProportion,
  sessionDivisor,
  apiEndpoint,
  setApiEndpoint,
  setProviderProportion,
  setSessionDivisor,
  addDeposit,
  releaseDeposits,
  releaseDeposit,
  hasDeposit,
  deposits,
  DefaultDivisor,
  Deposit,
  initialize,
} from "..";
import { VMContext, Context, VM, u128 } from "near-sdk-as";

function logs(): string[] {
  return VM.outcome().logs;
}

describe("Bridge Provider", function () {
  beforeEach(() => {
    VMContext.setCurrent_account_id("alice");
    VMContext.setAttached_deposit(u128.Zero);
    VMContext.setAccount_balance(u128.from(5));
  });

  afterEach(() => {
    deposits.clear();
  });

  // it("should just work", () => {
  //   VMContext.setCurrent_account_id("alice");
  //   VMContext.setAccount_balance(u128.from(2));
  //   _transfer("bob", u128.from(1));
  //   expect(Context.accountBalance).toStrictEqual(u128.from(1));
  // });

  it("...should start with empty/null parameters", () => {
    expect(apiEndpoint()).toStrictEqual("");
    expect(providerProportion()).toStrictEqual(0); // 0 gwei
    expect(sessionDivisor()).toStrictEqual(u128.One);
  });

  it("should have an init function that can only be called once", () => {
    VMContext.setSigner_account_id("alice");
    initialize(0, u128.Zero, "init");
    expect(apiEndpoint()).toStrictEqual("init");
    initialize(0, u128.One, "fake");
    expect(apiEndpoint()).toStrictEqual("init");
  });

  it("...should allow the contract owner to change public parameters", () => {
    VMContext.setSigner_account_id("alice");
    setApiEndpoint("https://fake.api");
    setProviderProportion(0);
    setSessionDivisor(DefaultDivisor);
  });

  throws("...when others try to change public parameters", () => {
    VMContext.setSigner_account_id("bob");
    setApiEndpoint("noop");
    // setProviderProportion(u128.from(0));
    // setSessionDivisor(u128.from(10000));
  });

  throws("...when adding more than one deposit (per depositee)", () => {
    VMContext.setSigner_account_id("bob");
    VMContext.setAttached_deposit(u128.One);
    addDeposit("account");

    VMContext.setSigner_account_id("carol");
    VMContext.setAttached_deposit(u128.One);
    addDeposit("account");
  });

  it("...should release deposit if adding over expired deposit", () => {
    VMContext.setSigner_account_id("bob");
    VMContext.setBlock_timestamp(10);
    VMContext.setAttached_deposit(u128.One);

    addDeposit("account");

    // Add 5 seconds
    VMContext.setBlock_timestamp(15);

    addDeposit("account");

    expect(logs()).toContainEqual(`DepositReleased("account", "bob", "1")`);

    expect(logs()).toContainEqual(`DepositAdded("account", "bob", "1")`);
  });

  it("...should check if an depositee has a deposit", () => {
    // No deposits at all yet, should default to false
    expect(hasDeposit("account")).toBeFalsy();

    VMContext.setBlock_timestamp(10);
    VMContext.setSigner_account_id("bob");
    VMContext.setAttached_deposit(u128.One);

    addDeposit("account");

    VMContext.setAttached_deposit(u128.Zero);

    expect(hasDeposit("account")).toBeTruthy();

    // Add 5 seconds
    VMContext.setBlock_timestamp(15);

    expect(hasDeposit("account")).toBeFalsy();

    // Has deposit should (still) return false after release
    releaseDeposits();

    expect(logs()).toContainEqual(`DepositReleased("account", "bob", "1")`);

    expect(hasDeposit("account")).toBeFalsy();
  });

  it("...should release deposits and (singular) deposit correctly", () => {
    VMContext.setBlock_timestamp(10);
    VMContext.setSigner_account_id("bob");
    VMContext.setAttached_deposit(u128.One);

    addDeposit("account");
    addDeposit("other");

    // Should be two in the bucket
    // Add 5 seconds
    VMContext.setBlock_timestamp(15);
    VMContext.setAttached_deposit(u128.Zero);

    releaseDeposit("account");

    expect(logs()).toContainEqual(`DepositReleased("account", "bob", "1")`);

    // Should still be one left
    releaseDeposits();

    expect(logs()).toContainEqual(`DepositReleased("other", "bob", "1")`);

    expect(hasDeposit("account")).toBeFalsy();
  });

  it("...should have a DefaultDivisor that works out to ~0.25 near per 600 seconds", () => {
    VMContext.setSigner_account_id("alice");
    VMContext.setBlock_timestamp(0);

    setSessionDivisor(DefaultDivisor);

    const quarter = u128.from("250000000000000000000000");

    VMContext.setAttached_deposit(quarter);
    addDeposit("account");

    VMContext.setAttached_deposit(u128.Zero);

    expect(hasDeposit("account")).toBeTruthy();

    VMContext.setBlock_timestamp(601e9); // 601 nano-seconds or ~10 minutes

    expect(hasDeposit("account")).toBeFalsy();

    VMContext.setBlock_timestamp(599e9); // Just shy of 10 minutes

    expect(hasDeposit("account")).toBeTruthy();
  });

  it("...should emit multiple events when releasing funds for multiple depositee accounts", () => {
    VMContext.setBlock_timestamp(10);
    VMContext.setSigner_account_id("bob");
    VMContext.setAttached_deposit(u128.One);

    addDeposit("account");
    addDeposit("other");

    // Should be two in the bucket
    // Add 5 seconds
    VMContext.setBlock_timestamp(15);

    VMContext.setAttached_deposit(u128.Zero);
    releaseDeposits();

    const l = logs();
    expect(l).toContainEqual(`DepositReleased("account", "bob", "1")`);
    expect(l).toContainEqual(`DepositReleased("other", "bob", "1")`);
  });

  it("...should emit logging events for adding deposit", () => {
    VMContext.setSigner_account_id("bob");
    VMContext.setAttached_deposit(u128.from("8160000000000000000000"));

    addDeposit("account");
    expect(logs()).toContainEqual(
      `DepositAdded("account", "bob", "8160000000000000000000")`
    );
  });

  it("...should return funds to the depositor (funds leave contract)", () => {
    const three = u128.from(3);
    const six = u128.from(6);
    // Start at six
    VMContext.setAccount_balance(six);
    VMContext.setSigner_account_id("bob");

    expect(Context.accountBalance).toStrictEqual(six);

    deposits.set("account", new Deposit(10, "bob", three));

    VMContext.setBlock_timestamp(15);
    // Release will send three to bob
    releaseDeposit("account");

    // Down to three remaining
    expect(Context.accountBalance).toStrictEqual(three);
  });

  it("...should keep provider proportion in contract", () => {
    const four = u128.from("4");
    const six = u128.from("6");
    VMContext.setSigner_account_id("alice");
    setProviderProportion(0.5);
    // Start at six
    VMContext.setAccount_balance(six);
    VMContext.setSigner_account_id("bob");

    expect(Context.accountBalance).toStrictEqual(six);

    deposits.set("account", new Deposit(10, "bob", four));

    VMContext.setBlock_timestamp(15);
    // Release will send three to bob
    releaseDeposit("account");

    // Down a bit, but keep 50% of deposit
    expect(Context.accountBalance).toStrictEqual(four);
  });

  it("...should emit logging events for releasing deposits", () => {
    VMContext.setSigner_account_id("bob");
    VMContext.setAttached_deposit(u128.Zero);
    VMContext.setBlock_timestamp(10);

    const deposit = u128.from(2);

    deposits.set("account", new Deposit(10, "bob", deposit));

    releaseDeposits();
    expect(logs()).toHaveLength(0);

    VMContext.setBlock_timestamp(15);

    releaseDeposits();

    expect(logs()).toContainEqual(
      `DepositReleased("account", "bob", "${deposit.toString()}")`
    );
  });

  it("...should be ownable", () => {
    VMContext.setSigner_account_id("alice");
    transferOwnership("bob");
    expect(logs()).toContainEqual(`OwnershipTransfered("bob")`);
    expect(owner()).toStrictEqual("bob");
  });

  throws("...when attempting to add zero-value deposit", () => {
    VMContext.setAttached_deposit(u128.Zero);
    addDeposit("account");
  });
});
