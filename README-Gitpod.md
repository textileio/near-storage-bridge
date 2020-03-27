Guest Book - Gitpod version
===========================

Sign in with [NEAR] and add a message to the guest book! A starter app built with an [AssemblyScript] backend and a [React] frontend.

This README is specific to Gitpod and this example. For local development, please see [README.md](README.md).

Quick Start
===========

Exploring The Code
==================

1. The backend code lives in the `/assembly` folder. This code gets deployed to
   the NEAR blockchain when you run `yarn deploy:contract`. This sort of
   code-that-runs-on-a-blockchain is called a "smart contract" – [learn more
   about NEAR smart contracts][smart contract docs].
2. The frontend code lives in the `/src` folder. [/src/index.html] is a great
   place to start exploring. Note that it loads in `/src/index.js`, where you
   can learn how the frontend connects to the NEAR blockchain.
3. Tests: there are different kinds of tests for the frontend and backend. The
   backend code gets tested with the [asp] command for running the backend
   AssemblyScript tests, and [jest] for running frontend tests. You can run
   both of these at once with `yarn test`.

Both contract and client-side code will auto-reload as you change source files.


Using
======

Gitpod has taken care of installing all the necessary tools and dependencies. At the bottom of Gitpod is a terminal which will display a link to follow:
```bash
Server running at http://localhost:1234
```

A small dialog may appear showing options similar to this:

![Gitpod dialog that appears when website is served](assets/gitpod-port-1234.jpg)

The "Preview" option will open the site in a tab within the IDE. Note that Gitpod may need a little time to spin up the website. It's possible this step might require reloading after a brief pause.

Once you've opened the tab in your browser, follow the directions displayed on the web page by copy and pasting the commands into the browser console.

In many modern browsers you may find this by right clicking anywhere on the page, right-click, **Inspect**, and then navigate to the **Console** tab.



  [smart contract docs]: https://docs.nearprotocol.com/docs/roles/developer/contracts/assemblyscript
  [asp]: https://www.npmjs.com/package/@as-pect/cli
  [jest]: https://jestjs.io/
  [NEAR]: https://nearprotocol.com/
  [AssemblyScript]: https://docs.assemblyscript.org/
  [React]: https://reactjs.org
