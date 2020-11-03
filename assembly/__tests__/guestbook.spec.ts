import { addMessage, getMessages } from '../main'
import { PostedMessage, messages } from '../model'
import { VMContext, Context, u128 } from 'near-sdk-as'

function createMessage (text: string): PostedMessage {
  return new PostedMessage(text)
}

const hello: string = 'hello world'
const message = createMessage(hello)

beforeEach(() => {
  VMContext.setAttached_deposit(u128.fromString('0'))
  VMContext.setAccount_balance(u128.fromString('0'))
})

describe('message tests', () => {
  afterEach(() => {
    while (messages.length > 0) {
      messages.pop()
    }
  })

  it('adds a message', () => {
    addMessage(hello)
    expect(messages.length).toBe(1, 'should only contain one message')
    expect(messages[0]).toStrictEqual(message, 'message should be "hello world"')
  })

  it('retrieves messages', () => {
    addMessage(hello)
    const messagesArr = getMessages()
    expect(messagesArr.length).toBe(1, 'should be one message')
    expect(messagesArr).toIncludeEqual(message, 'messages should include:\n' + message.toJSON())
    log(messagesArr[0])
  })

  it('only show the last ten messages', () => {
    addMessage(hello)
    const newMessages: PostedMessage[] = []
    for (let i: i32 = 0; i < 10; i++) {
      const text = 'message #' + i.toString()
      newMessages.push(createMessage(text))
      addMessage(text)
    }
    const messages = getMessages()
    log(messages.slice(7, 10))
    expect(messages).toStrictEqual(newMessages, 'should be the last ten messages')
    expect(messages).not.toIncludeEqual(message, "shouldn't contain the first element")
  })
})

describe('attached deposit tests', () => {
  it('attaches a deposit', () => {
    log('Initial account balance:')
    log(Context.accountBalance.toString())
    VMContext.setAttached_deposit(u128.from('10000000000000000000000'))
    addMessage(hello)
    log('Account balance after deposit:')
    log(Context.accountBalance.toString())
    log(messages[0])
    expect(Context.accountBalance.toString()).toStrictEqual('10000000000000000000000', 'balance should be 10000000000000000000000')
  })
})
