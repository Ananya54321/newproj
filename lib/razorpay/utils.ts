// Razorpay client-side utilities
// Loaded dynamically to avoid SSR issues

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: { ondismiss?: () => void }
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: RazorpayOptions) => { open(): void }
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(false); return }
    if (document.getElementById('razorpay-checkout-script')) { resolve(true); return }
    const script = document.createElement('script')
    script.id = 'razorpay-checkout-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/** Creates a Razorpay order on the server and returns the order ID */
export async function createRazorpayOrder(
  amountInRupees: number
): Promise<{ orderId: string; amount: number } | null> {
  const res = await fetch('/api/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountInRupees }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return { orderId: data.id, amount: data.amount }
}

/** Verifies a Razorpay payment signature on the server */
export async function verifyRazorpayPayment(
  response: RazorpayPaymentResponse
): Promise<boolean> {
  const res = await fetch('/api/razorpay/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  })
  if (!res.ok) return false
  const data = await res.json()
  return data.verified === true
}

/** Full Razorpay payment flow: create order → open modal → verify → resolve payment ID */
export async function initiateRazorpayPayment(opts: {
  amountInRupees: number
  name: string
  description?: string
  prefill?: { name?: string; email?: string }
}): Promise<{ paymentId: string } | null> {
  const order = await createRazorpayOrder(opts.amountInRupees)
  if (!order) throw new Error('Failed to create payment order')

  const loaded = await loadRazorpayScript()
  if (!loaded) throw new Error('Failed to load payment SDK')

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: order.amount,
      currency: 'INR',
      name: opts.name,
      description: opts.description,
      order_id: order.orderId,
      prefill: opts.prefill,
      theme: { color: '#4F5B3A' },
      handler: async (response) => {
        const verified = await verifyRazorpayPayment(response)
        if (verified) {
          resolve({ paymentId: response.razorpay_payment_id })
        } else {
          reject(new Error('Payment verification failed'))
        }
      },
      modal: {
        ondismiss: () => resolve(null),
      },
    })
    rzp.open()
  })
}
