export function download(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement("a")
  a.style.display = "none"
  document.body.append(a)
  a.href = url
  a.download = file.name
  a.click()
  a.remove()
}
