import 'regenerator-runtime/runtime';
import React, { useState, useEffect } from 'react';
import Form from './components/Form';
import SignIn from './components/SignIn';
import Upload from "./components/Upload";
import type { StoreFunction, LockBox } from "@textile/near-storage"

interface Props {
  store: StoreFunction
  lockBox: LockBox
  currentUser?: any
};

const App = ({ store, lockBox, currentUser }: Props) => {
  const [locked, setLocked] = useState<boolean>(false);

  const accountId = currentUser && currentUser.accountId

  useEffect(() => {
    // Don't just fetch once; subscribe!
    if (currentUser) {
      lockBox.hasLocked().then(setLocked);
    }
  }, []);

  const onUpload = (file: File) => {
    if (locked) {
      store(file).then((res: any) => {
        alert(`Your file is already on IPFS:\n${res.cid["/"]}`)
      })
      .catch((err: Error) => alert(err.message));
    }
  }

  const onSubmit = (actionType: "lock" | "unlock" | 'upload') => {
    switch(actionType) {
      case "lock":
        lockBox.lockFunds()
          .catch((err: Error) => alert(err.message));
      break
      case "unlock":
        lockBox.unlockFunds()
          .then(() => {
            setLocked(false)
            alert("funds unlocked!")
          })
          .catch((err: Error) => alert(err.message));
      break
    }
  };

  const signIn = () => {
    lockBox.requestSignIn('Textile Lock Box');
  };

  const signOut = () => {
    lockBox.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <main>
      <header>
        <h1>Textile Lock Box</h1>
        { accountId
          ? <button onClick={signOut}>Log out</button>
          : <button onClick={signIn}>Log in</button>
        }
      </header>
      <p>
        {locked ? "You got Ⓝ in here!" : `Lock some funds, ${accountId}!`}
      </p>
      { accountId
        ? (<div>
          <Form onSubmit={onSubmit} hasLocked={locked} />
          {locked ? <Upload onSubmit={onUpload} /> : null}
        </div>
        ) : <SignIn/>
      }
    </main>
  );
};

export default App;
