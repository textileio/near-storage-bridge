import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import getConfig from './config.js'
import * as nearlib from 'nearlib'

// Initializing contract
async function initContract () {
  const nearConfig = getConfig(process.env.NODE_ENV || 'development')

  // Initializing connection to the NEAR DevNet.
  const near = await nearlib.connect(Object.assign({ deps: { keyStore: new nearlib.keyStores.BrowserLocalStorageKeyStore() } }, nearConfig))

  // Needed to access wallet login
  const wallet = new nearlib.WalletAccount(near)

  // Getting the Account ID. If unauthorized yet, it's just empty string.
  const accountId = wallet.getAccountId()

  // Initializing our contract APIs by contract name and configuration.
  const acct = await new nearlib.Account(near.connection, accountId)
  const contract = await new nearlib.Contract(acct, nearConfig.contractName, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['welcome'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: [],
    // Sender is the account ID to initialize transactions.
    sender: accountId
  })

  return { contract, nearConfig, wallet }
}

window.nearInitPromise = (async function () {
  try {
    const { contract, nearConfig, wallet } = await initContract()

    ReactDOM.render(
      <App contract={contract} nearConfig={nearConfig} wallet={wallet} />,
      document.getElementById('root')
    )
  } catch (e) {
    console.error(e)
  }
})()
