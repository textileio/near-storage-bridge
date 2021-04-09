import 'regenerator-runtime/runtime';
import React, { useState, useEffect } from 'react';
import Big from 'big.js';
import Form from './components/Form';
import SignIn from './components/SignIn';
import type { LockResponse } from '../assembly/model'
import { Contract } from 'near-api-js';

const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();
const ONE = Big('1').times(10 ** 24).toFixed()

export interface CustomContract extends Contract {
  lockFunds: (args: { accountId?: string }, gas?: string, amount?: string) => Promise<LockResponse>;
  unlockFunds: (args: { accountId?: string }, gas?: string, amount?: string) => Promise<LockResponse>;
  hasLocked: (args: { accountId: string }) => Promise<boolean>
}

interface Props {
  contract: CustomContract

  currentUser?: {
    accountId: string
    balance: string
  }

  nearConfig: {
    contractName: string
  }

  wallet: {
    requestSignIn: Function,
    signOut: Function
  }
};

const App = ({ contract, currentUser, nearConfig, wallet }: Props) => {
  const [locked, setLocked] = useState<boolean>(false);

  useEffect(() => {
    // TODO: don't just fetch once; subscribe!
    if (currentUser) {
      contract.hasLocked({ accountId: currentUser.accountId }).then(setLocked);
    }
  }, []);

  const onSubmit = (actionType: "lock" | "unlock") => {
    switch(actionType) {
      case "lock":
        contract.lockFunds({}, BOATLOAD_OF_GAS, ONE)
          .catch((err: Error) => alert(err.message));
      break
      case "unlock":
        contract.unlockFunds({})
          .then(() => {
            setLocked(false)
            alert("funds unlocked!")
          })
          .catch((err: Error) => alert(err.message));
      break
    }
  };

  const signIn = () => {
    wallet.requestSignIn(
      nearConfig.contractName,
      'Textile Lock Box'
    );
  };

  const signOut = () => {
    wallet.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <main>
      <header>
        <h1>Textile Lock Box</h1>
        { currentUser
          ? <button onClick={signOut}>Log out</button>
          : <button onClick={signIn}>Log in</button>
        }
      </header>
      <p>
        {locked ? "You got Ⓝ in here!" : `Lock some funds, ${currentUser?.accountId}!`}
      </p>
      { currentUser
        ? <Form onSubmit={onSubmit} currentUser={currentUser} />
        : <SignIn/>
      }
    </main>
  );
};

export default App;
