let orbitdb;
let Ipfs
let ipfs
const Identities = require('orbit-db-identity-provider')
const migrate = require('localstorage-level-migration')
let identy
var FileSaver = require('file-saver');
let OrbitDB
let DB

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
      identy = await Identities.createIdentity({ id: 'id' })
      orbitdb = await OrbitDB.createInstance(ipfs, { identity: identy })
      callback()
    })
  },
  async search(data, callback) {
    db = await orbitdb.open(data, { sync: true })
    DB = db
    db.events.on('ready', () => callback(db))
    db.events.on('replicated', () => callback(db))
    db.events.on('write', () => callback(db))
    db.events.on('replicate.progress', () => callback(db))
    await db.load()
    return callback(null,db)
  },
  async query(db) {
    if (!db) return null
    const result = db.iterator({ limit: -1 }).collect().map((e) => e.payload.value)
    return result
  },
  async create(data, callback, showresult) {
    let o = {
      product_info: {
        name: data.name.value,
        type: data.type.value,
        desc: data.desc.value
      }
    }
    const db = await orbitdb.eventlog(o.product_info.name + "_" + Math.random().toString(36).substring(2, 15))
    DB = db

    db.events.on('ready', () => showresult(db))
    db.events.on('replicated', () => showresult(db))
    db.events.on('write', () => showresult(db))
    db.events.on('replicate.progress', () => showresult(db))

    await db.load();
    const hash = await db.add(o)
    
    return callback()
  },
  async add(data, callback) {
      let o = {
      product_tracking: {
        name: data.name.value,
        type: data.type.value,
        desc: data.comment.value
      }
    }
    const hash = await DB.add(o)
    return callback(db.get(hash))
  },
  savekey() {
   var blob = new Blob([JSON.stringify(identy.toJSON())], {type: "text/plain;charset=utf-8"});
   FileSaver.saveAs(blob, "key");
 },
 comparekeys(db) {
    if (!db) return null
    return db.options.accessController.write.indexOf(identy.id)
 },
}

module.exports = main
