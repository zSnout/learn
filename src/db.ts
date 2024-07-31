import { createEventListener } from "@/lib/create-event-listener"
import { randomId } from "@/lib/id"
import type {
  Handlers,
  MainThreadToItselfNotification,
  WorkerNotification,
  WorkerRequest,
  WorkerResponse,
} from "./shared"
import { ZID_REJECT, ZID_RESOLVE } from "./shared"
import ActualWorker from "./worker?worker&url"

export class Worker {
  private readonly worker: Omit<globalThis.Worker, "postMessage"> & {
    postMessage(message: WorkerRequest): void
  }
  private readonly handlers = new Map<
    number,
    [(data: any) => void, (reason: any) => void]
  >()
  private targetWorker = new EventTarget()
  private targetMain = new EventTarget()
  readonly ready
  private isReady = false

  constructor() {
    this.worker = new globalThis.Worker(ActualWorker, { type: "module" })
    this.ready = new Promise<this>((resolve, reject) => {
      this.worker.addEventListener("message", ({ data }: { data: unknown }) => {
        if (typeof data != "object" || data == null || !("zid" in data)) {
          return
        }

        const res = data as unknown as WorkerResponse | WorkerNotification

        if (typeof res.zid == "string") {
          this.targetWorker.dispatchEvent(
            new CustomEvent(res.zid, { detail: res }),
          )
          if (res.zid == ZID_RESOLVE) {
            this.isReady = true
            resolve(this)
          } else if (res.zid == ZID_REJECT) {
            reject(res.reason)
          }
          return
        }

        const handler = this.handlers.get(res.zid)
        if (!handler) {
          return
        }
        this.handlers.delete(res.zid)

        if (res.ok) {
          handler[0](res.value)
        } else {
          handler[1](res.value)
        }
      })

      this.worker.addEventListener("error", (event) => {
        console.error("The database failed to load.")
        reject(event.error)
      })
    })
  }

  on<E extends WorkerNotification["zid"]>(
    event: E,
    fn: (data: WorkerNotification & { zid: E }) => unknown,
  ) {
    createEventListener(this.targetWorker, event, (event) => {
      fn((event as CustomEvent<WorkerNotification & { zid: E }>).detail)
    })
  }

  onMain<E extends MainThreadToItselfNotification["zid"]>(
    event: E,
    fn: (data: MainThreadToItselfNotification & { zid: E }) => unknown,
  ) {
    createEventListener(this.targetMain, event, (event) => {
      fn(
        (event as CustomEvent<MainThreadToItselfNotification & { zid: E }>)
          .detail,
      )
    })
  }

  triggerMain(data: MainThreadToItselfNotification) {
    this.targetMain.dispatchEvent(new CustomEvent(data.zid, { detail: data }))
  }

  private postNow<K extends keyof Handlers>(
    type: K,
    ...data: Parameters<Handlers[K]>
  ): Promise<Awaited<ReturnType<Handlers[K]>>> {
    return new Promise((resolve, reject) => {
      const id = randomId()
      const req: WorkerRequest = {
        zid: id,
        type: type as any,
        data: data as any,
      }
      this.handlers.set(id, [resolve, reject])
      this.worker.postMessage(req)
    })
  }

  async post<K extends keyof Handlers>(
    type: K,
    ...data: Parameters<Handlers[K]>
  ): Promise<Awaited<ReturnType<Handlers[K]>>> {
    if (!this.isReady) {
      await this.ready
    }
    return await this.postNow(type, ...data)
  }
}
