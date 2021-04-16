import React, { useState } from 'react';

interface Props {
  onSubmit: (file: File) => void
}

export default function Upload({ onSubmit }: Props) {
  const [file, setFile] = useState<File>()
  return (
    <form>
      <fieldset id="fieldset">
        <input type="file" name="file" onChange={(event) => {
          if (event.target.files)
            setFile(event.target.files[0])
        }}></input>
        <button type="button" name="lock" onClick={(e) => {
          e.preventDefault();
          if (file) onSubmit(file)
          setFile(undefined)
        }}>
          Upload
        </button>
      </fieldset>
    </form>
  );
}