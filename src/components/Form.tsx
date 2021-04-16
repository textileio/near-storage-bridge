import React from 'react';

interface Props {
  onSubmit: (actionType: 'lock' | 'unlock') => void,
  hasLocked: boolean
}

export default function Form({ onSubmit, hasLocked }: Props) {
  return (
    <form>
      <fieldset id="fieldset">
        <button type="button" name="lock" onClick={(e) => {
          e.preventDefault();
          onSubmit(hasLocked ? "unlock" : "lock");
        }}>
          {hasLocked ? "Unlock" : "Lock"}
        </button>
      </fieldset>
    </form>
  );
}
