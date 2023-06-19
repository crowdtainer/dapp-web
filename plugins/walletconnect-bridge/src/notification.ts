import axios from 'axios'
import { INotification } from './types.js'
import { getNotification } from './keystore.js'

export const pushNotification = async (topic: string) => {
  const notifications = await getNotification(topic)

  if (notifications && notifications.length) {
    notifications.forEach((notification: INotification) =>
      axios.post(notification.webhook, { topic })
    )
  }
}
