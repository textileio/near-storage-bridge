import 'regenerator-runtime/runtime';
import React from 'react';
import TestRenderer from 'react-test-renderer';
import { u128 } from "near-sdk-as";
import App from '../../App';
const { act } = TestRenderer;

// Declare stubs for contract, walletConnection, and nearConfig
const contract = {
  account: {
    connection: {},
    accountId: 'test.near'
  } as any, // This is the minimal set of keys we need for the test
  contractId: 'test.near',
  lockFunds: () => Promise.resolve({ blockIndex: u128.Zero }),
  unlockFunds: () => Promise.resolve({ blockIndex: u128.Zero }),
  hasLocked: () => Promise.resolve(true)
};
const walletConnection = {
  account: () => ({ _state: { amount: '1' + '0'.repeat(25) } }),
  requestSignIn: () => null,
  signOut: () => null,
  isSignedIn: () => false,
  getAccountId: () => 'test.near'
};
const nearConfig = {
  networkId: 'default',
  nodeUrl: 'https://rpc.nearprotocol.com',
  contractName: 'test.near',
  walletUrl: 'https://wallet.nearprotocol.com',
  helperUrl: 'https://near-contract-helper.onrender.com'
};

// For UI tests, use pattern from: https://reactjs.org/docs/test-renderer.html
let container: HTMLDivElement | null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  if (container) document.body.removeChild(container);
  container = null;
});

it('renders with proper title', () => {
  let testRenderer: TestRenderer.ReactTestRenderer | undefined;

  act(() => {
    testRenderer = TestRenderer.create(
      <App contract={contract} wallet={walletConnection} nearConfig={nearConfig} />
    );
  });

  const testInstance = testRenderer?.root;

  expect(testInstance?.findByType('h1').children).toStrictEqual(['NEAR Guest Book']);
});
