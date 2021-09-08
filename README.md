# miriscient.org

A simple website for defining a word I created to express a human attribute I admire.

## Build & deploy

This static website is hosted with [IPFS](https://ipfs.io), pinned by [pinata.cloud](https://pinata.cloud), and fronted by [Cloudflare](https://www.cloudflare-ipfs.com). IPFS is a distributed network, so anyone can help to host by running:

```
$ ipfs pin add /ipns/www.miriscient.org
```

A merge to the `main` branch of this repo will trigger a Github Action that will:

1. Compile the site
2. Add the resulting files to a temporary IPFS instance
3. Pin the resulting IPFS multihash to pinata.cloud
4. Update Cloudflare's DNS entry to point to the new hash
