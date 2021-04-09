import React from 'react';

interface Props {
  onSubmit: (actionType: 'lock' | 'unlock') => void
  currentUser: any
}

export default function Form({ onSubmit, currentUser }: Props) {
  return (
    <form>
      <fieldset id="fieldset">
        <button type="button" name="lock" onClick={(e) => {
          e.preventDefault();
          onSubmit("lock")
        }}>
          Lock
        </button>
        <button type="button" name="unlock" onClick={(e) => {
          e.preventDefault();
          onSubmit("unlock");
        }}>
          Unlock
        </button>
      </fieldset>
    </form>
  );
}
