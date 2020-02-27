// these are made available by near-shell/test_environment
/* global nearlib, nearConfig */

let near
let contract
let accountId

beforeAll(async function () {
  near = await nearlib.connect(nearConfig)
  accountId = nearConfig.contractName
  contract = await near.loadContract(nearConfig.contractName, {
    viewMethods: ['welcome'],
    changeMethods: [],
    sender: accountId
  })
})

it('welcome test', async () => {
  const message = await contract.welcome({ account_id: 'test' })
  expect(message).toEqual({ text: 'Welcome, test. Welcome to NEAR Protocol chain' })
})
