import {
  listProviders,
  addProvider,
  removeProvider,
  providers,
  transferOwnership,
  owner,
} from "..";
import { VMContext, VM, Context, u128 } from "near-sdk-as";

function logs(): string[] {
  return VM.outcome().logs;
}

describe("Bridge Registry", function () {
  beforeEach(() => {
    VMContext.setCurrent_account_id("alice");
    VMContext.setAttached_deposit(u128.Zero);
    VMContext.setAccount_balance(u128.One);
  });

  afterEach(() => {
    providers.clear();
  });

  it("...should start with an empty provider registry", () => {
    expect(listProviders()).toHaveLength(0);
  });

  throws("...when updating provider registry from incorrect account", () => {
    VMContext.setSigner_account_id("bob");
    addProvider("provider");
  });

  it("...should add a new provider when called from correct account", () => {
    VMContext.setSigner_account_id("alice");
    addProvider("provider");

    expect(listProviders()).toContainEqual("provider");
    expect(logs()).toContainEqual(`ProviderAdded("provider")`);
  });

  throws("...when deleting provider entry from incorrect account", () => {
    VMContext.setSigner_account_id("bob");

    removeProvider("provider");
  });

  it("...should delete a provider from the registry", () => {
    VMContext.setSigner_account_id("alice");
    addProvider("provider");

    expect(listProviders()).toContainEqual("provider");

    removeProvider("provider");

    expect(listProviders()).toHaveLength(0);
    expect(logs()).toContainEqual(`ProviderRemoved("provider")`);
  });

  it("...should update an existing provider in the registry", () => {
    VMContext.setSigner_account_id("alice");
    addProvider("provider");

    expect(listProviders()).toHaveLength(1);

    addProvider("another");
    addProvider("provider");

    expect(listProviders()).toHaveLength(2);
    expect(listProviders()).toContainEqual("provider");
  });

  it("...should not change balance when interacting with provider registry", () => {
    VMContext.setSigner_account_id("alice");
    // TODO: We actually want to test that the contract's balance doesn't change also
    const expectedBalance = u128.One;
    const initialBalance = Context.accountBalance;

    expect(initialBalance).toStrictEqual(expectedBalance);

    addProvider("provider");

    expect(Context.accountBalance).toStrictEqual(initialBalance);

    removeProvider("provider");

    expect(Context.accountBalance).toStrictEqual(initialBalance);
  });

  throws("...when ownership has been transferred away", () => {
    VMContext.setSigner_account_id("alice");
    addProvider("provider");

    expect(listProviders()).toHaveLength(1);

    // Transfer ownership away from current owner
    transferOwnership("bob");

    addProvider("another");
  });

  throws("...when removing non-existant provider", () => {
    VMContext.setSigner_account_id("alice");
    addProvider("provider");

    expect(listProviders()).toHaveLength(1);

    removeProvider("another");
  });

  throws("...when attaching funds to a function call", () => {
    VMContext.setSigner_account_id("alice");
    VMContext.setAttached_deposit(u128.One);

    addProvider("provider");
  });

  it("...should be ownable", () => {
    VMContext.setSigner_account_id("alice");
    transferOwnership("bob");
    expect(logs()).toContainEqual(`OwnershipTransfered("bob")`);
    expect(owner()).toStrictEqual("bob");
  });
});
