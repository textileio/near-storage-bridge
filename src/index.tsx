/// <reference lib="dom" />

import React from 'react';
import App from "./App"
import ReactDOM from 'react-dom';
// @ts-expect-error missing types
import getConfig from './config.js';
import { connect, keyStores, WalletConnection } from 'near-api-js';

// Seems like a strange hack
const ENV = process.env as unknown as Record<string, string>

declare global {
    interface Window { 
      nearInitPromise: Promise<void>
     }
}

// Initializing contract
async function initConnection() {
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
  let currentUser;
  if(walletConnection.getAccountId()) {
    currentUser = {
      accountId: walletConnection.getAccountId(),
      balance: (await walletConnection.account().state()).amount
    };
  }

  return { currentUser, walletConnection }
}

window.nearInitPromise = initConnection()
  .then(({ walletConnection, currentUser }) => {
    ReactDOM.render(
      <App
        wallet={walletConnection}
        currentUser={currentUser}
      />,
      document.getElementById('root')
    );
  });
