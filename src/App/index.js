import React from 'react'
import PropTypes from 'prop-types'

const App = ({ contract, nearConfig, wallet }) => {
  const [messages, setMessages] = React.useState([])
  const [accountId, setAccountId] = React.useState(wallet.getAccountId())

  React.useEffect(() => {
    // if (window.location.search.includes('account_id')) {
    //   window.location.replace(window.location.origin + window.location.pathname)
    // }

    contract.getMessages().then(setMessages)
  }, [])

  const signIn = React.useCallback(() => {
    wallet.requestSignIn(
      nearConfig.contractName,
      'NEAR Guest Book'
    )
  }, [])

  const signOut = React.useCallback(() => {
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
        <form onSubmit={async e => {
          e.preventDefault()
          const input = e.target.elements.message
          input.disabled = true
          await contract.addMessage({ text: input.value })
          const messages = await contract.getMessages()
          setMessages(messages)
          input.value = ''
          input.disabled = false
          input.focus()
        }}>
          <label>
            Sign the guest book, {accountId}!
            <input
              autoComplete="off"
              autoFocus
              id="message"
            />
          </label>
        </form>
      )}
      {!!messages.length && (
        <>
          <h2>Messages</h2>
          {messages.map((message, i) =>
            <p key={i}>
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
