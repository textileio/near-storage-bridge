import {
  u128,
  storage,
  context,
  ContractPromiseBatch,
  PersistentUnorderedMap,
  logging,
} from "near-sdk-as";
import { onlyOwner } from "../../ownable/assembly";
export {
  transferOwnership,
  renounceOwnership,
  owner,
} from "../../ownable/assembly";

export const DefaultDivisor = u128.from("416000000000"); // yocto-Near per nano-second

export const deposits = new PersistentUnorderedMap<string, Deposit>("d");

@nearBindgen
export class Deposit {
  constructor(
    public timestamp: u64,
    public depositor: string,
    public value: u128
  ) {}
}

/**
 * Proportion of deposited funds that will be kept by this provider upon release.
 */
export function providerProportion(): f64 {
  return _providerProportion();
}

function _providerProportion(): f64 {
  const p = storage.getString("_providerProportion");
  if (p) return parseFloat(p);
  return 0;
}

export function setProviderProportion(p: f64): void {
  onlyOwner();
  storage.set("_providerProportion", p.toString());
}

/**
 * Divisor used to calculate session expiration.
 *
 * The session expiration is calculated as `timestamp + value / sessionDivisor`.
 * Currently, the sessionDivisor is set to 40 milli-Ⓝ.
 */
export function sessionDivisor(): u128 {
  return _sessionDivisor();
}

function _sessionDivisor(): u128 {
  const d = storage.getString("_sessionDivisor");
  if (d) return u128.fromString(d);
  return u128.One;
}

export function setSessionDivisor(d: u128): void {
  onlyOwner();
  storage.set("_sessionDivisor", d.toString());
}

/**
 * The off-chain upload/status RESTful API endpoint supported by this provider.
 */
export function apiEndpoint(): string {
  return _apiEndpoint();
}

function _apiEndpoint(): string {
  const p = storage.getString("_apiEndpoint");
  return p ? p : "";
}

export function setApiEndpoint(a: string): void {
  onlyOwner();
  storage.setString("_apiEndpoint", a);
}

/**
 * Logging event fired when a deposit has been added.
 */
function DepositAdded(
  depositee: string,
  depositor: string,
  amount: u128
): void {
  const event = "DepositAdded";
  const info = `{"depositee":"${depositee}","depositor":"${depositor}","amount":"${amount.toString()}"}`;
  logging.log(`{"event":"${event}","info":${info}}`);
}

/**
 * Logging event fired when a deposit has been released.
 */
function DepositReleased(
  depositee: string,
  depositor: string,
  amount: u128
): void {
  const event = "DepositReleased";
  const info = `{"depositee":"${depositee}","depositor":"${depositor}","amount":"${amount.toString()}"}`;
  logging.log(`{"event":"${event}","info":${info}}`);
}

const KEY_INITIATED = "initiated";

export function initialize(
  providerProportion: f64,
  sessionDivisor: u128,
  apiEndpoint: string
): void {
  onlyOwner();
  if (storage.getPrimitive<bool>(KEY_INITIATED, false)) {
    return;
  }
  setProviderProportion(providerProportion);
  setSessionDivisor(sessionDivisor);
  setApiEndpoint(apiEndpoint);
  storage.set<bool>(KEY_INITIATED, true);
}

// Public Methods

/**
 * Deposit attached funds with this provider for the given account to initiate a session.
 * Use `attachedDeposit` to attach a deposit in yocto-Ⓝ that will produce a session proptional
 * in length to `sessionDivisor`.
 */
export function addDeposit(depositee: string): void {
  assert(
    context.attachedDeposit > u128.Zero,
    "BridgeProvider: must include deposit > 0"
  );
  if (deposits.contains(depositee)) {
    // Maybe it has expired?
    _releaseDeposit(depositee);
    assert(
      !deposits.contains(depositee),
      "BridgeProvider: depositee already has deposit"
    );
  }
  deposits.set(
    depositee,
    new Deposit(context.blockTimestamp, context.sender, context.attachedDeposit)
  );
  DepositAdded(depositee, context.sender, context.attachedDeposit);
}

function isDepositValid(d: Deposit | null, t: u64, div: u128): bool {
  return (
    d != null &&
    d.value > u128.Zero &&
    t <= d.timestamp + u128.div(d.value, div).toI64()
  );
}

/**
 * Return whether the given depositee has funds deposited with this provider.
 */
export function hasDeposit(depositee: string): bool {
  return isDepositValid(
    deposits.get(depositee),
    context.blockTimestamp,
    _sessionDivisor()
  );
}

function _releaseDeposit(depositee: string): void {
  const deposit = deposits.get(depositee);
  if (deposit == null) return;
  if (
    deposit.value > u128.Zero &&
    !isDepositValid(deposit, context.blockTimestamp, _sessionDivisor())
  ) {
    let value = deposit.value;
    const cut = u128.fromF64(f64.mul(value.toF64(), _providerProportion()));
    if (cut > u128.Zero) {
      if (value < cut) {
        value = u128.Zero;
      } else {
        value = u128.sub(value, cut);
      }
    }
    ContractPromiseBatch.create(deposit.depositor).transfer(value);
    deposits.delete(depositee);
    DepositReleased(depositee, deposit.depositor, deposit.value);
  }
}

/**
 * Release expired session associated with the given depositee.
 */
export function releaseDeposit(depositee: string): void {
  notPayable();
  _releaseDeposit(depositee);
}

/**
 * Release all expired sessions associated with this provider.
 */
export function releaseDeposits(
  start: u32 = 0,
  end: u32 = deposits.length
): void {
  notPayable();
  const depositees = deposits.keys(start, end);
  for (let i = 0; i < depositees.length; i++) {
    _releaseDeposit(depositees[i]);
  }
}
