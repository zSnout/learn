/// <reference types="vite/client" />

import type { JSX } from "solid-js"
import type { Reason } from "./lib/reason"

export type CtxCreateMenu = (createMenu: () => JSX.Element) => void
export type CtxEvent = CustomEvent<CtxCreateMenu>

declare module "solid-js" {
  namespace JSX {
    interface CustomEventHandlersCamelCase<T> {
      onCtx?: EventHandlerUnion<T, CtxEvent>
    }

    interface CustomEventHandlersLowerCase<T> {
      onctx?: EventHandlerUnion<T, CtxEvent>
    }

    interface CustomEvents {
      click: MouseEvent
    }
  }
}

declare global {
  interface WindowEventMap {
    "z-db-beforeundo": CustomEvent<{ redo: boolean; reason: Reason }>
    "z-db-undo": CustomEvent<{ redo: boolean; reason: Reason }>
  }

  interface ErrorConstructor {
    new (message?: string, options?: { cause?: unknown }): Error
  }

  interface StorageEstimate {
    usageDetails?: Record<string, number>
  }
}
