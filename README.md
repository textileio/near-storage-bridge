# Lock Box

Sign in with [NEAR] and lock funds for off-chain storage!
This contract and app were built with an [AssemblyScript] backend and a [React] frontend.

# Quick Start

To run this project locally:

1. Prerequisites: Make sure you have Node.js ≥ 12 installed (https://nodejs.org).
2. Install dependencies: `npm install` (or just `npm i`)
3. Run the local development server: `npm run dev` (see `package.json` for a
   full list of `scripts` you can run with `npm`)

Now you'll have a local development environment backed by the NEAR TestNet!
Running `npm run dev` will tell you the URL you can visit in your browser to see the app.

# Exploring The Code

1. The backend code lives in the `/assembly` folder. This code gets deployed to
   the NEAR blockchain when you run `npm run deploy:contract`. This sort of
   code-that-runs-on-a-blockchain is called a "smart contract" – [learn more
   about NEAR smart contracts][smart contract docs].
2. The frontend code lives in the `/src` folder.
   [/src/index.html](/src/index.html) is a great place to start exploring. Note
   that it loads in `/src/index.js`, where you can learn how the frontend
   connects to the NEAR blockchain.
3. Tests: there are different kinds of tests for the frontend and backend. The
   backend code gets tested with the [asp] command for running the backend
   AssemblyScript tests, and [jest] for running frontend tests. You can run
   both of these at once with `npm test`.

Both contract and client-side code will auto-reload as you change source files.

# Deploy

Every smart contract in NEAR has its [own associated account][near accounts]. Ours is deployed to `lock-box.testnet`.

One command:

    npm run deploy

As you can see in `package.json`, this does two things:

1. builds & deploys smart contracts to NEAR TestNet
2. builds & deploys frontend code to GitHub using [gh-pages].

For now, you can view the "app" at: https://textileio.github.io/lock-box/

[near]: https://nearprotocol.com/
[assemblyscript]: https://docs.assemblyscript.org/
[react]: https://reactjs.org
[smart contract docs]: https://docs.nearprotocol.com/docs/roles/developer/contracts/assemblyscript
[asp]: https://www.npmjs.com/package/@as-pect/cli
[jest]: https://jestjs.io/
[near accounts]: https://docs.nearprotocol.com/docs/concepts/account
[near wallet]: https://wallet.nearprotocol.com
[near-cli]: https://github.com/nearprotocol/near-cli
[cli]: https://www.w3schools.com/whatis/whatis_cli.asp
[create-near-app]: https://github.com/nearprotocol/create-near-app
[gh-pages]: https://github.com/tschaub/gh-pages
