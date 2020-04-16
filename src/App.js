import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'

const SUGGESTED_DONATION = '1'
const BOATLOAD_OF_GAS = BigNumber(1).times(10 ** 16).toFixed()

const App = ({ account, contract, nearConfig, wallet }) => {
  const [messages, setMessages] = useState([])
  const [accountId, setAccountId] = useState(wallet.getAccountId())

  useEffect(() => {
    // TODO: don't just fetch once; subscribe!
    contract.getMessages().then(setMessages)
  }, [])

  const onSubmit = useCallback(e => {
    e.preventDefault()

    const fieldset = e.target.children[0]
    fieldset.disabled = true

    const messageInput = e.target.elements.message
    const donationInput = e.target.elements.donation

    // TODO: optimistically update page with new message,
    // update blockchain data in background
    // add uuid to each message, so we know which one is already known
    contract.addMessage(
      { text: messageInput.value },
      BOATLOAD_OF_GAS,
      BigNumber(donationInput.value || '0').times(10 ** 24).toFixed()
    ).then(() => {
      contract.getMessages().then(messages => {
        setMessages(messages)

        messageInput.value = ''
        donationInput.value = SUGGESTED_DONATION
        fieldset.disabled = false
        messageInput.focus()
      })
    })
  }, [contract])

  const signIn = useCallback(() => {
    wallet.requestSignIn(
      nearConfig.contractName,
      'NEAR Guest Book'
    )
  }, [])

  const signOut = useCallback(() => {
    wallet.signOut()
    setAccountId(null)
  }, [])

  return (
    <main>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1>NEAR Guest Book</h1>
        {accountId
          ? <button onClick={signOut}>Log out</button>
          : <button onClick={signIn}>Log in</button>
        }
      </header>
      {accountId && (
        <form onSubmit={onSubmit}>
          <fieldset>
            <p>Sign the guest book, { accountId }!</p>
            <p className="highlight">
              <label htmlFor="message">Message:</label>
              <input
                autoComplete="off"
                autoFocus
                id="message"
                required
              />
            </p>
            <p>
              <label htmlFor="donation">Donation (optional):</label>
              <input
                autoComplete="off"
                defaultValue={SUGGESTED_DONATION}
                id="donation"
                max={BigNumber(account.amount).div(10 ** 24)}
                min="0"
                step="0.01"
                type="number"
              />
              <span title="NEAR Tokens">Ⓝ</span>
            </p>
            <button type="submit">
              Sign
            </button>
          </fieldset>
        </form>
      )}
      {!!messages.length && (
        <>
          <h2>Messages</h2>
          {messages.map((message, i) =>
            // TODO: format as cards, add timestamp
            <p key={i} className={message.premium ? 'is-premium' : ''}>
              <strong>{message.sender}</strong>:<br/>
              {message.text}
            </p>
          )}
        </>
      )}
    </main>
  )
}

App.propTypes = {
  account: PropTypes.shape({
    amount: PropTypes.string.isRequired
  }).isRequired,
  contract: PropTypes.shape({
    addMessage: PropTypes.func.isRequired,
    getMessages: PropTypes.func.isRequired
  }).isRequired,
  nearConfig: PropTypes.shape({
    contractName: PropTypes.string.isRequired
  }).isRequired,
  wallet: PropTypes.shape({
    getAccountId: PropTypes.func.isRequired,
    isSignedIn: PropTypes.func.isRequired,
    requestSignIn: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired
  }).isRequired
}

export default App
