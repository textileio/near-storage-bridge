import { addMessage, getMessages } from '../main'
import { PostedMessage, messages } from '../model'
import { VMContext, Context, u128 } from 'near-sdk-as'

function createMessage (text: string): PostedMessage {
  return new PostedMessage(text)
}

const message = createMessage('hello world')

describe('message tests', () => {
  beforeEach(() => {
    addMessage('hello world')
  })

  afterEach(() => {
    while (messages.length > 0) {
      messages.pop()
    }
  })

  it('adds a message', () => {
    expect(messages.length).toBe(
      1,
      'should only contain one message'
    )
    expect(messages[0]).toStrictEqual(
      message,
      'message should be "hello world"'
    )
  })

  it('retrieves messages', () => {
    const messagesArr = getMessages()
    expect(messagesArr.length).toBe(
      1,
      'should be one message'
    )
    expect(messagesArr).toIncludeEqual(
      message,
      'messages should include:\n' + message.toJSON()
    )
    log('GETS MESSAGES TEST:')
    log(messagesArr[0])
  })

  it('only show the last 10 messages', () => {
    const newMessages: PostedMessage[] = []
    for (let i: i32 = 0; i < 10; i++) {
      const text = 'message #' + i.toString()
      newMessages.push(createMessage(text))
      addMessage(text)
    }
    const messages = getMessages()
    log('SHOWS LAST 10 MESSAGES TEST:')
    log(messages.slice(7, 10))
    expect(messages).toStrictEqual(
      newMessages,
      'should be the last ten messages'
    )
    expect(messages).not.toIncludeEqual(
      message,
      'shouldn\'t contain the first element'
    )
  })
})

describe('attached deposit test', () => {
  beforeEach(() => {
    VMContext.setAttached_deposit(u128.fromString('0'))
    VMContext.setAccount_balance(u128.fromString('0'))
    addMessage('hello world')
  })

  it('attaches a deposit to a contract call', () => {
    log('ATTACHED DEPOSIT TEST:')
    log('Initial account balance: ' + Context.accountBalance.toString())

    VMContext.setAttached_deposit(u128.from('10'))
    log('Attached deposit: 10')
    log('Account balance after deposit: ' + Context.accountBalance.toString())

    expect(Context.accountBalance.toString()).toStrictEqual('10',
      'balance should be 10'
    )
  })
})
