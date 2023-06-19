import { wcConfig } from './wcConfig.js';
import Helmet from '@fastify/helmet'
import Fastify from 'fastify'
import pubsub from './pubsub.js'
import { WebSocketServer } from 'ws';
import { setNotification } from './keystore.js'

// @ts-ignore
import pkg from '../package.json' assert { type: "json" }

interface BodyType {
  topic: string,
  webhook: string
}

const app = Fastify({
  logger: {
    transport: {
      target: "@fastify/one-line-logger",
    },
  },
})

app.register(Helmet)

app.get('/health', async (_, res) => {
  res.status(204).send()
})

app.get('/hello', (_, res) => {
  res.status(200).send(`Hello World, this is WalletConnect v${pkg.version}`)
})

app.get('/info', (_, res) => {
  res.status(200).send({
    name: pkg.name,
    description: pkg.description,
    version: pkg.version
  })
})

app.post('/subscribe', async (req, res) => {
  console.log(`subscribe called`)
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).send({
      message: 'Error: missing or invalid request body'
    })
  }

  const { topic, webhook } = req.body as BodyType;

  if (!topic || typeof topic !== 'string') {
    res.status(400).send({
      message: 'Error: missing or invalid topic field'
    })
  }

  if (!webhook || typeof webhook !== 'string') {
    res.status(400).send({
      message: 'Error: missing or invalid webhook field'
    })
  }

  await setNotification({ topic, webhook })

  res.status(200).send({
    success: true
  })
})

const wsServer = new WebSocketServer({ server: app.server });

app.ready(() => {
  wsServer.on('connection', function connection(socket) {
    console.log(`on: Connection...`)

    socket.on("error", console.error)

    socket.on('message', async data => {
      console.log(`received: ${data}`)
      pubsub(socket, data)
    })

    socket.on('pong', () => {
      console.log(`pong`)
      // socket.isAlive = true
    })

  })

  setInterval(
    () => {
      const sockets: any = wsServer.clients
      console.log(`WalletConnect ws: ${wsServer.clients.size}`)
    },
    30000 // 30 seconds
  )
})

app.listen({ port: wcConfig.port, host: wcConfig.host }, (err, address) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  app.log.info(`Server listening on ${address}`)
})
