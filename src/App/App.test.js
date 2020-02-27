// these are made available by near-shell/test_environment
/* global nearlib, nearConfig */

import 'regenerator-runtime/runtime'
import React from 'react'
import renderer from 'react-test-renderer'
import App from '.'

let near
let contract
let accountId
let walletConnection
beforeAll(async function () {
  near = await nearlib.connect(nearConfig)
  accountId = nearConfig.contractName
  contract = await near.loadContract(nearConfig.contractName, {
    viewMethods: ['welcome'],
    changeMethods: [],
    sender: accountId
  })

  // Fake instance of WalletConnection
  // Feel free to modify for specific tests
  walletConnection = {
    requestSignIn () {
    },
    signOut () {
    },
    isSignedIn () {
      return true
    },
    getAccountId () {
      return accountId
    }
  }
})

it('renders without crashing', () => {
  const app = renderer.create(
    <App contract={contract} wallet={walletConnection} nearConfig={nearConfig} />
  )
  const tree = app.toJSON()
  expect(tree).toMatchSnapshot()
})
