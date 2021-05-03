import 'regenerator-runtime/runtime';
import React, { useState, ReactElement, useEffect } from 'react';
import Form from './components/LockForm';
import Welcome from './components/Welcome';
import Upload from "./components/UploadForm";
import { openLockBox, openStore, Storage, RequestStatus } from "@textile/near-storage"
import type { WalletConnection } from 'near-api-js';

interface Props {
  wallet: WalletConnection
  currentUser?: {
    accountId: string
  }
}

const App = ({ wallet, currentUser }: Props): ReactElement => {
  const [storage, setStorage] = useState<Storage>();
  const [locked, setLocked] = useState<boolean>(false);
  const [lastId, setLastId] = useState<string>();
  const [activeBroker, setActiveBroker] = useState<string>();

  const lockBox = openLockBox(wallet)

  const accountId = currentUser && currentUser.accountId

  useEffect(() => {
    // Subscribe to changes to current user
    if (currentUser) {
      if (activeBroker) {
        lockBox.hasLocked(activeBroker).then(setLocked)
      } else {
        // Just grab a random broker
        lockBox.getBroker().then(brokerInfo => {
          // Open a new storage instance scoped to this broker
          const store = openStore(wallet, { brokerInfo })
          setStorage(store)
          setActiveBroker(brokerInfo?.brokerId)
        })
      }
    }
  }, [activeBroker]);

  const onUpload = (file: File) => {
    if (locked && storage) {
      storage.store(file)
      .then(({ id, cid }) => {
        setLastId(id)
        alert(`Your file is already on IPFS:\n${cid["/"]}`)
      })
      .catch((err: Error) => alert(err.message));
    }
  }

  const onStatus = () => {
    if (lastId && storage) {
      storage.status(lastId)
      .then((res) => {
        alert(`Your file status is currently: "${RequestStatus[res.status_code]}"!`)
      })
    } else {
      console.warn("no 'active' file, upload a file first")
    }
  }

  const onSubmit = () => {
    lockBox.lockFunds(activeBroker)
      .catch((err: Error) => alert(err.message));
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
          <Form onSubmit={onSubmit} />
          {locked ? <Upload onSubmit={onUpload} /> : null}
          <button type="button" name="status" onClick={(e) => {
            e.preventDefault();
            if (lastId) onStatus();
          }}>
            Status
          </button>
          <button type="button" name="unlock" onClick={(e) => {
            e.preventDefault();
            lockBox.unlockFunds()
              .then(() => {
                alert("check your wallet in case of released funds")
                // Auto-refresh the page
                location.reload();
              })
              .catch((err: Error) => alert(err.message));
          }}>Unlock
          </button>
        </div>
        ) : <Welcome/>
      }
    </main>
  );
};

export default App;
