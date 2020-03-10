import { addMessage, getMessages } from '../main'
import { PostedMessage } from '../model'
import { PersistentVector, context } from 'near-runtime-ts'

const messages = new PersistentVector<PostedMessage>('m')
const hello: string = 'hello world'
const sender = context.sender

function createMessage (text: string): PostedMessage {
  return { sender, text }
}

const message = createMessage(hello)

describe('messages should be able to', () => {
  it('add a message', () => {
    addMessage(hello)
    expect(messages.length).toBe(1, 'should only contain one message')
    expect(messages[0]).toStrictEqual(message, 'message should be "hello world"')
  })

  it('retrive messages', () => {
    const messages = getMessages()
    expect(messages.length).toBe(1, 'should be one message')
    expect(messages).toIncludeEqual(message, 'messages should include:\n' + message.toJSON())
    log(messages[0])
  })

  it('only show the last ten messages', () => {
    const newMessages: PostedMessage[] = []
    for (let i: i32 = 0; i < 10; i++) {
      const text = 'message #' + i.toString()
      newMessages.push(createMessage(text))
      addMessage(text)
    }
    const messages = getMessages()
    log(messages)
    expect(messages).toStrictEqual(newMessages, 'should be the last ten mesages')
    expect(messages).not.toIncludeEqual(message, "shouldn't contain the first element")
  })
})
