import type { MediaPrefix } from "./media"

export type FileUrl = `${MediaPrefix}${string}/${string}`

export function createFile(file: File, url: FileUrl) {
  if (file.type.startsWith("image/")) {
    return createFileImage(url)
  }
  if (file.type.startsWith("video/")) {
    return createFileVideo(url)
  }
  if (file.type.startsWith("audip/")) {
    return createFileAudio(url)
  }
  return createFileAnchor(file, url)
}

function createFileImage(url: FileUrl) {
  const node = document.createElement("img")
  node.src = url
  return node
}

function createFileVideo(url: FileUrl) {
  const node = document.createElement("video")
  node.src = url
  node.playsInline = true
  return node
}

function createFileAudio(url: FileUrl) {
  const node = document.createElement("audio")
  node.src = url
  return node
}

function createFileAnchor(file: File, url: FileUrl) {
  const node = document.createElement("a")
  node.href = url
  node.textContent = file.name
  node.spellcheck = false
  node.target = "_blank"
  return node
}
