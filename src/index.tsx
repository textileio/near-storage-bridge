/// <reference lib="dom" />

import React from 'react';
import App, { CustomContract } from "./App"
import ReactDOM from 'react-dom';
// @ts-expect-error missing types
import getConfig from './config.js';
import { Contract, keyStores, connect, WalletConnection } from 'near-api-js';

// Seems like a strange hack
const ENV = process.env as unknown as Record<string, string>

// Initializing contract
async function initContract() {
  const nearConfig = getConfig(ENV.NODE_ENV as any || 'testnet');

  // Initializing connection to the NEAR TestNet
  const near = await connect({
    deps: {
      keyStore: new keyStores.BrowserLocalStorageKeyStore()
    },
    ...nearConfig
  });

  // Needed to access wallet
  const walletConnection = new WalletConnection(near, null);

  // Load in account data
  let currentUser: { accountId: string, balance: string } | undefined;
  if(walletConnection.getAccountId()) {
    currentUser = {
      accountId: walletConnection.getAccountId(),
      balance: (await walletConnection.account().state()).amount
    };
  }

  // Initializing our contract APIs by contract name and configuration
  const contract = new Contract(walletConnection.account(), nearConfig.contractName, {
    // View methods are read-only – they don't modify the state, but usually return some value
    viewMethods: ['hasLocked'],
    // Change methods can modify the state, but you don't receive the returned value when called
    changeMethods: ['lockFunds', 'unlockFunds'],
    // Sender is the account ID to initialize transactions.
    // getAccountId() will return empty string if user is still unauthorized
    // sender: walletConnection.getAccountId()
  }) as CustomContract;

  return { contract, currentUser, nearConfig, walletConnection };
}

declare global {
    interface Window { 
      nearInitPromise: Promise<void>
     }
}

window.nearInitPromise = initContract()
  .then(({ contract, currentUser, nearConfig, walletConnection }) => {
    ReactDOM.render(
      <App
        contract={contract}
        currentUser={currentUser}
        nearConfig={nearConfig}
        wallet={walletConnection}
      />,
      document.getElementById('root')
    );
  });
