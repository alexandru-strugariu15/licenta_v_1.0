/**
 * Isomorphic safe binary <-> base64 conversion utilities for both browser and Node/Vitest environments.
 */

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const btoaFn = typeof window !== 'undefined' ? window.btoa : globalThis.btoa
  return btoaFn(binary)
}

export function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }
  const atobFn = typeof window !== 'undefined' ? window.atob : globalThis.atob
  const binary = atobFn(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
