const main = (IPFS, ORBITDB) => {
  let orbitdb

  // If we're building with Webpack, use the injected IPFS module.
  // Otherwise use 'Ipfs' which is exposed by ipfs.min.js
  if (IPFS)
    Ipfs = IPFS

  // If we're building with Webpack, use the injected OrbitDB module.
  // Otherwise use 'OrbitDB' which is exposed by orbitdb.min.js
  if (ORBITDB)
    OrbitDB = ORBITDB

  // Create IPFS instance
  const ipfs = new Ipfs({
    repo: '/etna/blk',
    start: true,
    preload: { 
      enabled: false
    },
    EXPERIMENTAL: {
      pubsub: true,
    },
    config: {
      Addresses: {
        Swarm: [
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
        ]
      },
    }
  })

  ipfs.on('error', (e) => handleError(e))
  ipfs.on('ready', async () => {
    orbitdb = await OrbitDB.createInstance(ipfs)
    db = await orbitdb.keyvalue('first-database')
    console.log("loading db")
    await db.load()
    console.log(db.get('key1'))
    console.log(db.address)
  })
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = main
