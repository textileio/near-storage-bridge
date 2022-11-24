# near-storage-bridge

[![GitHub license](https://img.shields.io/github/license/textileio/near-storage-bridge.svg)](./LICENSE)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/textileio/near-storage-bridge.svg)](./package.json)
[![Release](https://img.shields.io/github/release/textileio/near-storage-bridge.svg)](https://github.com/textileio/near-storage-bridge/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

![Tests](https://github.com/textileio/near-storage-bridge/workflows/Test/badge.svg)

> Reference NEAR ↔ Filecoin Bridge Smart Contract (Assembly Script)

# Important note
**This repository has been [archived](https://blog.textile.io/sunsetting-the-auction-api/) and is no longer maintained. If you are looking for an alternative tool to use, try one of these: [Estuary](https://estuary.tech/), [Web3 Storage](https://web3.storage/), or lookout for the coming release of ♠️(SPADE).**

# Table of Contents

- [Background](#background)
- [Setup](#setup)
- [Usage](#usage)
- [API](#api)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

# Background

Sign in with [NEAR](https://nearprotocol.com/) and start storing data on Filecoin!

This NEAR smart contract is built with [Assembly Script](https://docs.assemblyscript.org/). The
core code lives in the `/assembly` folder. This code gets deployed to the NEAR blockchain when
you run `npm run deploy:contract`. This sort of code-that-runs-on-a-blockchain is called a
"smart contract" – [learn more about NEAR smart contracts](https://docs.nearprotocol.com/docs/roles/developer/contracts/assemblyscript).
The assembly script code gets tested with the [asp](https://www.npmjs.com/package/@as-pect/cli) tool/command.
Every smart contract in NEAR has its [own associated account](https://docs.nearprotocol.com/docs/concepts/account).
This contract is currently deployed to: `lock-box.testnet`.

# Setup

1. Prerequisite: Node.js ≥ 12 installed (https://nodejs.org).
2. Install dependencies: `npm install` (or just `npm i`)
3. Run tests: `npm run test`
4. Deploy contract: `npm run deploy` (builds & deploys smart contract to NEAR TestNet)

# Usage

For a basic [React](https://reactjs.org)-based demo app that utilizes this contract, see https://github.com/textileio/near-storage-basic-demo/.

# API

TODO

# Maintainers

[@carsonfarmer](https://github.com/carsonfarmer)
[@asutula](https://github.com/asutula)

# Contributing

PRs accepted.

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

# License

MIT AND Apache-2.0, © 2021 Textile.io
