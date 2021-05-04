import React, { ReactElement} from 'react';

interface Props {
  onSubmit: () => void,
}

export default function LockForm({ onSubmit }: Props): ReactElement {
  return (
    <form>
      <button type="button" name="lock" onClick={(e) => {
        e.preventDefault();
        onSubmit();
      }}>
        Lock
      </button>
    </form>
  );
}
