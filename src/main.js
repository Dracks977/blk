let orbitdb;
let Ipfs
let ipfs

function handleError(e) {
  console.error(e.stack)
  statusElm.innerHTML = e.message  
}

const main = {
  init(IPFS, ORBITDB) {
   if (IPFS)
    Ipfs = IPFS

    // If we're building with Webpack, use the injected OrbitDB module.
    // Otherwise use 'OrbitDB' which is exposed by orbitdb.min.js
    if (ORBITDB)
      OrbitDB = ORBITDB
  },
  start(callback) {
    ipfs = new Ipfs({
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
      console.log('ipfs ready')
      orbitdb = await OrbitDB.createInstance(ipfs)
      callback()
    })
  },
  async search(data, callback) {
    console.log(data)
    db = await orbitdb.open(data, { sync: true })
    db.events.on('ready', () => callback(db))
    db.events.on('replicated', () => callback(db))
    db.events.on('write', () => callback(db))
    db.events.on('replicate.progress', () => callback(db))
    await db.load()
    callback(db)
  },
  async query(db) {
    const networkPeers = await ipfs.swarm.peers()
    const databasePeers = await ipfs.pubsub.peers(db.address.toString())
    const result = db.iterator({ limit: -1 }).collect().map((e) => e.payload.value)
    return result
  },
  async create(data, callback, showresult) {
    console.log(data.name)
    let o = {
      product_info: {
        name: data.name.value,
        type: data.type.value,
        desc: data.desc.value
      }
    }
    const db = await orbitdb.eventlog(o.product_info.name + "_" + Math.random().toString(36).substring(2, 15))

    db.events.on('ready', () => showresult(db))
    db.events.on('replicated', () => showresult(db))
    db.events.on('write', () => showresult(db))
    db.events.on('replicate.progress', () => queryAndRender(db))

    await db.load();
    const hash = await db.add(o)
    const address = db.address
    console.log(hash)
    console.log(address)
    const event = db.get(hash)
    callback(event)
  }
}

module.exports = main
