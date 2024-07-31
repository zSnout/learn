import { createDeferredLayer as lazy } from "@/el/Deferred"

export const LAYER_BROWSE = lazy(() => import("./Browse"))
export const LAYER_CREATE_NOTE = lazy(() => import("./CreateNote"))
export const LAYER_EDIT_MODEL_FIELDS = lazy(() => import("./EditModelFields"))
export const LAYER_EDIT_MODEL_TEMPLATES = lazy(
  () => import("./EditModelTemplates"),
)
export const LAYER_MANAGE_MODELS = lazy(() => import("./ManageModels"))
export const LAYER_MEDIA = lazy(() => import("./Media"))
export const LAYER_QUERY = lazy(() => import("./Query"))
export const LAYER_SETTINGS = lazy(() => import("./Settings"))
export const LAYER_STATS = lazy(() => import("./Stats"))
export const LAYER_STORAGE = lazy(() => import("./Storage"))
export const LAYER_STUDY = lazy(() => import("./Study"))
export const LAYER_TASKS = lazy(() => import("./Tasks"))
