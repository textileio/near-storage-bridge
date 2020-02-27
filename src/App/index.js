import React, { Component } from 'react'
import PropTypes from 'prop-types'

import nearLogo from './near-logo.svg'
import nearLogoType from './near-logotype.svg'
import reactLogo from './react-logo.svg'

import './App.css'

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      login: false,
      speech: null
    }
    this.signedInFlow = this.signedInFlow.bind(this)
    this.requestSignIn = this.requestSignIn.bind(this)
    this.requestSignOut = this.requestSignOut.bind(this)
    this.signedOutFlow = this.signedOutFlow.bind(this)
  }

  componentDidMount () {
    const loggedIn = this.props.wallet.isSignedIn()
    if (loggedIn) {
      this.signedInFlow()
    } else {
      this.signedOutFlow()
    }
  }

  async signedInFlow () {
    this.setState({
      login: true
    })
    const accountId = await this.props.wallet.getAccountId()
    if (window.location.search.includes('account_id')) {
      window.location.replace(window.location.origin + window.location.pathname)
    }
    this.props.contract.welcome({ account_id: accountId }).then(response => this.setState({ speech: response.text }))
  }

  async requestSignIn () {
    const appTitle = 'NEAR React template'
    await this.props.wallet.requestSignIn(
      this.props.nearConfig.contractName,
      appTitle
    )
  }

  requestSignOut () {
    this.props.wallet.signOut()
    setTimeout(this.signedOutFlow, 500)
  }

  signedOutFlow () {
    if (window.location.search.includes('account_id')) {
      window.location.replace(window.location.origin + window.location.pathname)
    }
    this.setState({
      login: false,
      speech: null
    })
  }

  render () {
    const style = {
      fontSize: '1.5rem',
      color: '#0072CE',
      textShadow: '1px 1px #D1CCBD'
    }
    return (
      <div className="App-header">
        <div className="image-wrapper">
          <img className="logo" src={nearLogoType} alt="NEAR logo" />
          <p><span role="img" aria-label="fish">🐟</span> NEAR protocol is a new blockchain focused on developer productivity and useability!<span role="img" aria-label="fish">🐟</span></p>
          <p><span role="img" aria-label="chain">⛓</span> This little react app is connected to blockchain right now. <span role="img" aria-label="chain">⛓</span></p>
          <p style={style}>{this.state.speech}</p>
        </div>
        <div>
          {this.state.login ? <button onClick={this.requestSignOut}>Log out</button>
            : <button onClick={this.requestSignIn}>Log in with NEAR</button>}
        </div>
        <div>
          <div className="logo-wrapper">
            <img src={nearLogo} className="App-logo margin-logo" alt="" />
            <img src={reactLogo} className="App-logo" alt="" />
          </div>
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <p><span role="img" aria-label="net">🕸</span> <a className="App-link" href="https://nearprotocol.com">NEAR Website</a> <span role="img" aria-label="net">🕸</span>
          </p>
          <p><span role="img" aria-label="book">📚</span><a className="App-link" href="https://docs.nearprotocol.com"> Learn from NEAR Documentation</a> <span role="img" aria-label="book">📚</span>
          </p>
        </div>
      </div>
    )
  }
}

App.propTypes = {
  contract: PropTypes.shape({
    welcome: PropTypes.func.isRequired
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
