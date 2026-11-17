import { describe, it, expect } from 'vitest'
import { uint8ArrayToBase64, base64ToUint8Array } from './binaryUtils'
import * as Y from 'yjs'

describe('binaryUtils & CRDT binary serialization', () => {
  it('converts Uint8Array to base64 and back with exact byte fidelity', () => {
    const originalBytes = new Uint8Array([0, 1, 2, 42, 127, 255, 18, 99, 210])
    const base64 = uint8ArrayToBase64(originalBytes)
    const decoded = base64ToUint8Array(base64)

    expect(decoded.length).toBe(originalBytes.length)
    expect(Array.from(decoded)).toEqual(Array.from(originalBytes))
  })

  it('serializes and applies Yjs update binary diffs correctly', () => {
    // Client A creates doc and inserts text
    const docA = new Y.Doc()
    const textA = docA.getText('content')
    textA.insert(0, 'Hello CRDT world')

    // Encode update from Doc A
    const updateA = Y.encodeStateAsUpdate(docA)
    const base64Update = uint8ArrayToBase64(updateA)

    // Client B receives base64 string, decodes to Uint8Array and applies
    const docB = new Y.Doc()
    const decodedUpdate = base64ToUint8Array(base64Update)
    Y.applyUpdate(docB, decodedUpdate)

    const textB = docB.getText('content')
    expect(textB.toString()).toBe('Hello CRDT world')

    // Client B adds more text concurrently
    textB.insert(16, ' with real-time sync')
    const updateB = Y.encodeStateAsUpdate(docB, Y.encodeStateVector(docA))
    const base64UpdateB = uint8ArrayToBase64(updateB)

    // Client A receives and applies
    Y.applyUpdate(docA, base64ToUint8Array(base64UpdateB))
    expect(textA.toString()).toBe('Hello CRDT world with real-time sync')
  })
})
