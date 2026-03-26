import { CometChatUIKit, UIKitSettingsBuilder } from '@cometchat/chat-uikit-react'
import { COMETCHAT_CONSTANTS } from './config'

let initialized = false

export async function initCometChat(): Promise<void> {
  if (initialized) return

  const settings = new UIKitSettingsBuilder()
    .setAppId(COMETCHAT_CONSTANTS.APP_ID)
    .setRegion(COMETCHAT_CONSTANTS.REGION)
    .subscribePresenceForAllUsers()
    .build()

  await CometChatUIKit.init(settings)
  initialized = true
}
