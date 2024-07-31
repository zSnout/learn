import { createResource } from "solid-js"
import { AutocompleteBox } from "./AutocompleteBox"

async function getFonts() {
  const fontCheck = new Set([
    // Windows 10
    "Arial",
    "Arial Black",
    "Bahnschrift",
    "Calibri",
    "Cambria",
    "Cambria Math",
    "Candara",
    "Comic Sans MS",
    "Consolas",
    "Constantia",
    "Corbel",
    "Courier New",
    "Ebrima",
    "Franklin Gothic Medium",
    "Gabriola",
    "Gadugi",
    "Georgia",
    "HoloLens MDL2 Assets",
    "Impact",
    "Ink Free",
    "Javanese Text",
    "Leelawadee UI",
    "Lucida Console",
    "Lucida Sans Unicode",
    "Malgun Gothic",
    "Marlett",
    "Microsoft Himalaya",
    "Microsoft JhengHei",
    "Microsoft New Tai Lue",
    "Microsoft PhagsPa",
    "Microsoft Sans Serif",
    "Microsoft Tai Le",
    "Microsoft YaHei",
    "Microsoft Yi Baiti",
    "MingLiU-ExtB",
    "Mongolian Baiti",
    "MS Gothic",
    "MV Boli",
    "Myanmar Text",
    "Nirmala UI",
    "Palatino Linotype",
    "Segoe MDL2 Assets",
    "Segoe Print",
    "Segoe Script",
    "Segoe UI",
    "Segoe UI Historic",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
    "SimSun",
    "Sitka",
    "Sylfaen",
    "Symbol",
    "Tahoma",
    "Times New Roman",
    "Trebuchet MS",
    "Verdana",
    "Webdings",
    "Wingdings",
    "Yu Gothic",
    // macOS
    "American Typewriter",
    "Andale Mono",
    "Arial",
    "Arial Black",
    "Arial Narrow",
    "Arial Rounded MT Bold",
    "Arial Unicode MS",
    "Avenir",
    "Avenir Next",
    "Avenir Next Condensed",
    "Baskerville",
    "Big Caslon",
    "Bodoni 72",
    "Bodoni 72 Oldstyle",
    "Bodoni 72 Smallcaps",
    "Bradley Hand",
    "Brush Script MT",
    "Chalkboard",
    "Chalkboard SE",
    "Chalkduster",
    "Charter",
    "Cochin",
    "Comic Sans MS",
    "Copperplate",
    "Courier",
    "Courier New",
    "Didot",
    "DIN Alternate",
    "DIN Condensed",
    "Futura",
    "Geneva",
    "Georgia",
    "Gill Sans",
    "Helvetica",
    "Helvetica Neue",
    "Herculanum",
    "Hoefler Text",
    "Impact",
    "Lucida Grande",
    "Luminari",
    "Marker Felt",
    "Menlo",
    "Microsoft Sans Serif",
    "Monaco",
    "Noteworthy",
    "Optima",
    "Palatino",
    "Papyrus",
    "Phosphate",
    "Rockwell",
    "Savoye LET",
    "SignPainter",
    "Skia",
    "Snell Roundhand",
    "Tahoma",
    "Times",
    "Times New Roman",
    "Trattatello",
    "Trebuchet MS",
    "Verdana",
    "Zapfino",
    // toki pona
    "nasin-nanpa",
    "linja lipamanka",
    "sitelen seli kiwen asuki",
    "sitelen seli kiwen juniko",
    "sitelen seli kiwen asuki mono",
    "sitelen seli kiwen juniko mono",
  ])

  await document.fonts.ready

  const available = new Set<string>()

  for (const font of fontCheck.values()) {
    if (document.fonts.check(`12px "${font}"`)) {
      available.add(font)
    }
  }

  return Array.from(available.values()).sort()
}

function useFonts() {
  const [fonts] = createResource(getFonts, { initialValue: [] })
  return fonts
}

export function AutocompleteFontFamily(props: {
  label: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}) {
  const fonts = useFonts()

  return (
    <AutocompleteBox
      label={props.label}
      onChange={props.onChange}
      value={props.value}
      placeholder={props.placeholder}
      options={fonts()}
      allowArbitrary
      fontFamily={(x) => {
        try {
          if (fonts().includes(x) || document.fonts.check(`12px "${x}"`)) {
            return `"${x}"`
          } else {
            return
          }
        } catch {
          return
        }
      }}
    />
  )
}
