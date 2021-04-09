import React from 'react';

interface Props {
  messages: any[]
}

export default function Messages({ messages }: Props) {
  return (
    <>
      <h2>Messages</h2>
      {messages.map((message: any, i: number) =>
        // TODO: format as cards, add timestamp
        <p key={i} className={message.premium ? 'is-premium' : ''}>
          <strong>{message.sender}</strong>:<br/>
          {message.text}
        </p>
      )}
    </>
  );
}
