import { CometChatUIKit } from '@cometchat/chat-uikit-react'

/**
 * Requests a CometChat auth token from our backend and logs the user in.
 * The backend enforces that only role==='user' (pet owners) receive a token.
 * Throws if the server returns a non-OK response.
 */
export async function loginCometChat(): Promise<void> {
  const res = await fetch('/api/cometchat/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (res.status === 403) {
    throw new Error('CHAT_NOT_ALLOWED')
  }

  if (!res.ok) {
    throw new Error('CHAT_TOKEN_ERROR')
  }

  const { token } = await res.json()
  await CometChatUIKit.loginWithAuthToken(token)
}

export async function logoutCometChat(): Promise<void> {
  await CometChatUIKit.logout()
}
