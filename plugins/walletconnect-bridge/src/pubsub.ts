import { ISocketMessage, ISocketSub, WebSocketData } from './types'
import { pushNotification } from './notification.js'
import { setSub, getSub, setPub, getPub } from './keystore.js'
import WebSocket from 'ws'


async function socketSend(socket: WebSocket, socketMessage: ISocketMessage) {
  if (socket.readyState === 1) {
    const message = JSON.stringify(socketMessage)
    socket.send(message)
    console.log(`outgoing: ${message}`)
  } else {
    await setPub(socketMessage)
  }
}

async function SubController(
  socket: WebSocket,
  socketMessage: ISocketMessage
) {
  const topic = socketMessage.topic

  const subscriber = { topic, socket }

  await setSub(subscriber)

  const pending = await getPub(topic)

  if (pending && pending.length) {
    await Promise.all(
      pending.map((pendingMessage: ISocketMessage) =>
        socketSend(socket, pendingMessage)
      )
    )
  }
}

async function PubController(socketMessage: ISocketMessage) {
  const subscribers = await getSub(socketMessage.topic)

  if (!socketMessage.silent) {
    await pushNotification(socketMessage.topic)
  }

  if (subscribers.length) {
    await Promise.all(
      subscribers.map((subscriber: ISocketSub) =>
        socketSend(subscriber.socket, socketMessage)
      )
    )
  } else {
    await setPub(socketMessage)
  }
}

export default async (socket: WebSocket, data: WebSocketData) => {
  const message: string = String(data)

  console.log({ type: 'incoming', message })

  if (!message || !message.trim()) {
    return
  }

  try {
    let socketMessage: ISocketMessage | null = null

    try {
      socketMessage = JSON.parse(message)
    } catch (e) {
      console.log(`error: $e`)
      // do nothing
    }

    if (!socketMessage) {
      return
    }

    switch (socketMessage.type) {
      case 'sub':
        await SubController(socket, socketMessage)
        break
      case 'pub':
        await PubController(socketMessage)
        break
      default:
        break
    }
  } catch (e) {
    console.error(e)
  }
}
