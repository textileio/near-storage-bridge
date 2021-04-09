/// <reference lib="dom" />

import React from 'react';
import App from "./App"
import ReactDOM from 'react-dom';
import getConfig, { Envs } from './config';
import * as nearAPI from 'near-api-js';

// Seems like a strange hack
const ENV = process.env as unknown as Record<string, string>

// Initializing contract
async function initContract() {
  const nearConfig = getConfig(ENV.NODE_ENV as Envs || 'testnet');

  // Initializing connection to the NEAR TestNet
  const near = await nearAPI.connect({
    deps: {
      keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore()
    },
    ...nearConfig
  });

  // Needed to access wallet
  const walletConnection = new nearAPI.WalletConnection(near, null);

  // Load in account data
  let currentUser: { accountId: string, balance: string } | undefined;
  if(walletConnection.getAccountId()) {
    currentUser = {
      accountId: walletConnection.getAccountId(),
      balance: (await walletConnection.account().state()).amount
    };
  }

  // Initializing our contract APIs by contract name and configuration
  const contract = new nearAPI.Contract(walletConnection.account(), nearConfig.contractName, {
    // View methods are read-only – they don't modify the state, but usually return some value
    viewMethods: ['getMessages'],
    // Change methods can modify the state, but you don't receive the returned value when called
    changeMethods: ['addMessage'],
    // Sender is the account ID to initialize transactions.
    // getAccountId() will return empty string if user is still unauthorized
    // sender: walletConnection.getAccountId()
  }) as nearAPI.Contract & any;

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
