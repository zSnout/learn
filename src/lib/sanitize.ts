import dom from "dompurify"

export function sanitize(html: string) {
  return dom.sanitize(html, {})
}
