// TODO: there's a chance we can rewrite this to avoid python

import { loadPyodide, type PyodideInterface } from "pyodide"
// import { loadPyodide } from "../../../node_modules/"

let api: PyodideInterface | undefined
let ready: Promise<PyodideInterface> | undefined

export async function load(): Promise<PyodideInterface> {
  if (api) {
    return api
  }

  if (ready) {
    return ready
  }

  return (ready = (loadPyodide() as Promise<PyodideInterface>)
    .then((py) => py.loadPackage("anki").then(() => py))
    .then((py) => (api = py)))
}
