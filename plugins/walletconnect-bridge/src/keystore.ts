import Redis from 'ioredis';
import { ISocketMessage, ISocketSub, INotification } from './types.js'

import { wcConfig } from './wcConfig.js';

const redisClient: any = new Redis(wcConfig.redis.url)

const subs: ISocketSub[] = []

export const setSub = (subscriber: ISocketSub) => subs.push(subscriber)
export const getSub = (topic: string) =>
  subs.filter(
    subscriber =>
      subscriber.topic === topic && subscriber.socket.readyState === 1
  )

export const setPub = (socketMessage: ISocketMessage) => {
  console.log(`pushing to db`)
  redisClient.lpush(
    `socketMessage:${socketMessage.topic}`,
    JSON.stringify(socketMessage)
  )
}

export const getPub = (topic: string): ISocketMessage[] => {
  return redisClient
    .lrange(`socketMessage:${topic}`, 0, -1)
    .then((data: any) => {
      if (data) {
        let localData: ISocketMessage[] = data.map((item: string) =>
          JSON.parse(item)
        )
        redisClient.del(`socketMessage:${topic}`)
        return localData
      }
    })
}

export const setNotification = (notification: INotification) =>
  redisClient.lpush(
    `notification:${notification.topic}`,
    JSON.stringify(notification)
  )

export const getNotification = (topic: string) => {
  return redisClient
    .lrange(`notification:${topic}`, 0, -1)
    .then((data: any) => {
      if (data) {
        return data.map((item: string) => JSON.parse(item))
      }
    })
}
