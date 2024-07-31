import type { Awaitable } from "@/el/Layers"
import type { Reason } from "@/lib/reason"
import type { UndoMeta } from "./worker/lib/undo"
import * as messages from "./worker/messages"

export type Handler = (this: void, ...data: any) => HandlerReturn

export type HandlerReturn = Awaitable<Cloneable>

export type Handlers = typeof messages

export type WorkerRequest = {
  [K in keyof Handlers]: { zid: number; type: K; data: Parameters<Handlers[K]> }
}[keyof Handlers]

export type WorkerResponse = {
  [K in keyof Handlers]:
    | { zid: number; ok: true; value: Awaited<ReturnType<Handlers[K]>> }
    | { zid: number; ok: false; value: string }
}[keyof Handlers]

export type WorkerNotification =
  | { zid: typeof ZID_RESOLVE }
  | { zid: typeof ZID_REJECT; reason: unknown }
  | { zid: typeof ZID_UNDO_STACK_CHANGED; canUndo: boolean; canRedo: boolean }
  | { zid: typeof ZID_UNDO_FAILED; type: UndoType }
  | {
      zid: typeof ZID_UNDO_HAPPENED
      type: UndoType
      reason: Reason | null
      meta: UndoMeta
    }

export type UndoType = "undo" | "redo"

/** Indicates the worker is ready. */
export const ZID_RESOLVE = "zdb:resolve"

/** Indicates the worker failed to start up. */
export const ZID_REJECT = "zdb:reject"

/** Indicates the undo/redo buttons should be updated. */
export const ZID_UNDO_STACK_CHANGED = "zdb:undo-stack-changed"

/** Indicates the user interface should be updated. */
export const ZID_UNDO_HAPPENED = "zdb:undo-happened"

/** Indicates that an undo or redo action failed. */
export const ZID_UNDO_FAILED = "zdb:undo-failed"

export type MainThreadToItselfNotification = {
  zid: typeof ZID_BEFORE_UNDO
  meta: UndoMeta
}

/** Indicates that the main thread is preparing to save the current state. */
export const ZID_BEFORE_UNDO = "zdb:before-undo"

export type Cloneable =
  | Array<Cloneable>
  | ArrayBuffer
  | boolean
  | DataView
  | Date
  | Error
  | Map<Cloneable, Cloneable>
  | number
  | { [x: string]: Cloneable }
  | RegExp
  | Set<Cloneable>
  | string
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | BigUint64Array
  | BigInt64Array
  | Float64Array
  // | AudioData
  | Blob
  // | CropTarget
  | CryptoKey
  | DOMException
  | DOMMatrix
  | DOMMatrixReadOnly
  | DOMQuad
  | DOMRect
  | DOMRectReadOnly
  | File
  | FileList
  | FileSystemDirectoryHandle
  | FileSystemFileHandle
  // | GPUCompilationInfo
  // | GPUCompilationMessage
  | ImageBitmap
  | ImageData
  | RTCCertificate
  | VideoFrame
  | null
  | undefined
  | void

export type Transferable =
  | ArrayBuffer
  | MessagePort
  | ReadableStream
  | WritableStream
  | TransformStream
  // | WebTransportReceiveStream
  // | WebTransportSendStream
  // | AudioData
  | ImageBitmap
  | VideoFrame
  | OffscreenCanvas
  | RTCDataChannel
