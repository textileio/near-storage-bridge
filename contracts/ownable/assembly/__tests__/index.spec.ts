import { owner, renounceOwnership, transferOwnership } from "..";
import { VM, VMContext, u128, Context } from "near-sdk-as";

function logs(): string[] {
  return VM.outcome().logs;
}

describe("Ownable", function () {
  beforeEach(() => {
    VMContext.setCurrent_account_id("alice");
    VMContext.setAttached_deposit(u128.Zero);
  });

  it("...should start with a default owner", () => {
    expect(owner()).toStrictEqual("alice");
  });

  it("...should be able to transfer ownership", () => {
    VMContext.setSigner_account_id("alice");
    transferOwnership("bob");
    expect(logs()).toContainEqual(
      `{"event":"OwnershipTransferred","info":{"account":"bob"}}`
    );
    expect(owner()).toStrictEqual("bob");
  });

  throws("...when trying to renounce ownership if not the owner", () => {
    VMContext.setSigner_account_id("bob");
    renounceOwnership();
  });

  throws("...when trying to transfer ownership if not the owner", () => {
    VMContext.setSigner_account_id("bob");
    transferOwnership("bob");
  });

  throws("...when trying to transfer ownership to empty account", () => {
    VMContext.setSigner_account_id("alice");
    transferOwnership("");
  });

  it("...should be able to renounce ownership", () => {
    VMContext.setSigner_account_id("alice");
    renounceOwnership();
    expect(owner()).toStrictEqual("");
  });
});
