import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import getConfig from './config.js'
import * as nearlib from 'nearlib'

// Initializing contract
async function initContract () {
  const nearConfig = getConfig(process.env.NODE_ENV || 'development')

  // Initializing connection to the NEAR DevNet
  const near = await nearlib.connect({
    deps: {
      keyStore: new nearlib.keyStores.BrowserLocalStorageKeyStore()
    },
    ...nearConfig
  })

  // Needed to access wallet
  const wallet = new nearlib.WalletAccount(near)

  // Get Account ID – if still unauthorized, it's an empty string
  const accountId = wallet.getAccountId()

  // Initializing our contract APIs by contract name and configuration
  const acct = await new nearlib.Account(near.connection, accountId)
  const contract = await new nearlib.Contract(acct, nearConfig.contractName, {
    // View methods are read-only – they don't modify the state, but usually return some value
    viewMethods: ['getMessages'],
    // Change methods can modify the state, but you don't receive the returned value when called
    changeMethods: ['addMessage'],
    // Sender is the account ID to initialize transactions.
    sender: accountId
  })

  return { contract, nearConfig, wallet }
}

window.nearInitPromise = initContract()
  .then(({ contract, nearConfig, wallet }) => {
    ReactDOM.render(
      <App contract={contract} nearConfig={nearConfig} wallet={wallet} />,
      document.getElementById('root')
    )
  })
