import 'regenerator-runtime/runtime'

let near;
let contract;
let accountId;
let walletConnection;

beforeAll(async function () {
    near = await nearlib.connect(nearConfig);
    accountId = nearConfig.contractName;
    contract = await near.loadContract(nearConfig.contractName, {
        viewMethods: ['getMessages'],
        changeMethods: ['addMessage'],
        sender: accountId
    });

    // Fake instance of WalletConnection
    // Feel free to modify for specific tests
    walletConnection = {
        requestSignIn () {
        },
        signOut () {
        },
        isSignedIn () {
            return true
        },
        getAccountId () {
            return accountId
        }
    };
});

it('send one message and retrieve it', async () => {
    await contract.addMessage({text: 'aloha'});
    const msgs = await contract.getMessages();
    const expectedMessagesResult = [{
        "sender": accountId,
        "text": "aloha",
    }];
    expect(msgs).toEqual(expectedMessagesResult);
});

it('send two more messages and expect three total', async () => {
    await contract.addMessage({text: 'foo'});
    await contract.addMessage({text: 'bar'});
    const msgs = await contract.getMessages();
    expect(msgs.length).toEqual(3);
});