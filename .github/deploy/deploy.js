const {
  PINATA_API_KEY,
  PINATA_API_SECRET,

  CLOUDFLARE_TOKEN,
  CLOUDFLARE_DNS_ZONE_ID,
  CLOUDFLARE_DNS_IDENTIFIER,

  GITHUB_RUN_ID,
} = process.env

const buildURL = `https://www.github.com/jphastings/miriscient.org/actions/runs/${GITHUB_RUN_ID}`
const pinataPinName = 'miriscient.org'
const domain = 'www.miriscient.org'

const path = require('path')
const pinata = require('@pinata/sdk')(PINATA_API_KEY, PINATA_API_SECRET)
const cloudflare = require('cloudflare')({ token: CLOUDFLARE_TOKEN })

build().then(pinataPin).then(cloudflareUpdate).then(pinataUnpinPrevious).catch(console.error)

async function build() {
  return path.join(__dirname, '..', '..', 'public')
}

async function pinataPin(rootPath) {
  console.log(`Pinning new version:`)
  const response = await pinata.pinFromFS(rootPath, {
    pinataMetadata: {
      name: pinataPinName,
      keyvalues: { buildURL }
    },
    pinataOptions: {
      cidVerson: 1,
      wrapWithDirectory: false,
      customPinPolicy: {
        regions: [
          {
            id: 'FRA1',
            desiredReplicationCount: 1
          },
          {
            id: 'NYC1',
            desiredReplicationCount: 1
          }
        ]
      }
    }
  })

  console.log(`  ✅ ${response.IpfsHash}`)

  return response.IpfsHash
}

async function cloudflareUpdate(rootHash) {
  const txtRecord = `dnslink=/ipfs/${rootHash}`

  const opts = {
    type: 'TXT',
    name: `_dnslink.${domain}`,
    content: `dnslink=/ipfs/${rootHash}`,
    ttl: 1,
  }


  const response = await cloudflare.dnsRecords.edit(
    CLOUDFLARE_DNS_ZONE_ID,
    CLOUDFLARE_DNS_IDENTIFIER,
    opts
  )

  if (!response.success) {
    throw new Error("Failed to update Cloudflare: " + response.errors)
  }

  return rootHash
}

async function pinataUnpinPrevious(rootHash) {
  console.log("Finding old versions to unpin:")
  const response = await pinata.pinList({
    metadata: { name: pinataPinName }
  })

  const deletes = []

  response.rows.forEach((pin) => {
    if (pin.ipfs_pin_hash == rootHash) {
      return
    }

    deletes.push(
      pinata.unpin(pin.ipfs_pin_hash)
        .then(() => console.log(`  👍 Unpinned ${pin.ipfs_pin_hash}`))
        .catch(() => console.log(`  👍 Already unpinned ${pin.ipfs_pin_hash}`))
    )
  })

  return Promise.all(deletes)
}