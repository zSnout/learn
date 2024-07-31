export function writeCsv(data: Iterable<string[]>): string {
  let output = ""

  for (const row of data) {
    for (let index = 0; index < row.length; index++) {
      if (index != 0) {
        output += ","
      }
      const el = row[index]!
      if (
        el.includes(",") ||
        el.includes('"') ||
        el.includes("\n") ||
        el.includes("\r")
      ) {
        output += '"'
        output += el.replace(/"/g, '""')
        output += '"'
      } else {
        output += el
      }
    }
    output += "\n"
  }

  return output
}
