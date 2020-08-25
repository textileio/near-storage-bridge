import 'regenerator-runtime/runtime'
import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Big from 'big.js'

const SUGGESTED_DONATION = '0'
const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed()

const App = ({ contract, currentUser, nearConfig, wallet }) => {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    // TODO: don't just fetch once; subscribe!
    contract.getMessages().then(setMessages)
  }, [])

  const onSubmit = useCallback(e => {
    e.preventDefault()

    const { fieldset, message, donation } = e.target.elements

    fieldset.disabled = true

    // TODO: optimistically update page with new message,
    // update blockchain data in background
    // add uuid to each message, so we know which one is already known
    contract.addMessage(
      { text: message.value },
      BOATLOAD_OF_GAS,
      Big(donation.value || '0').times(10 ** 24).toFixed()
    ).then(() => {
      contract.getMessages().then(messages => {
        setMessages(messages)

        message.value = ''
        donation.value = SUGGESTED_DONATION
        fieldset.disabled = false
        message.focus()
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
    window.location.replace(window.location.origin + window.location.pathname)
  }, [])

  return (
    <main>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1>NEAR Guest Book</h1>
        {currentUser
          ? <button onClick={signOut}>Log out</button>
          : <button onClick={signIn}>Log in</button>
        }
      </header>
      {currentUser ? (
        <form onSubmit={onSubmit}>
          <fieldset id="fieldset">
            <p>Sign the guest book, { currentUser.accountId }!</p>
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
                max={Big(currentUser.balance).div(10 ** 24)}
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
      ) : (
        <>
          <p>
            This app demonstrates a key element of NEAR’s UX: once an app has
            permission to make calls on behalf of a user (that is, once a user
            signs in), the app can make calls to the blockhain for them without
            prompting extra confirmation. So you’ll see that if you don’t
            include a donation, your message gets posted right to the guest book.
          </p>
          <p>
            But if you do add a donation, then NEAR will double-check that
            you’re ok with sending money to this app.
          </p>
          <p>
            Go ahead and sign in to try it out!
          </p>
        </>
      )}
      {!!currentUser && !!messages.length && (
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
  contract: PropTypes.shape({
    addMessage: PropTypes.func.isRequired,
    getMessages: PropTypes.func.isRequired
  }).isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired
  }),
  nearConfig: PropTypes.shape({
    contractName: PropTypes.string.isRequired
  }).isRequired,
  wallet: PropTypes.shape({
    requestSignIn: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired
  }).isRequired
}

export default App
