import {createCanonicalUrl, createPaletteMetaImageUrl} from './responses'
import {titleCase} from './helpers'
import {PaletteConfig} from '~/types/palette'

export function handleMeta(palettes: PaletteConfig[], updateHistory = false) {
  if (!palettes.length) {
    return
  }

  console.log(`handling meta`, updateHistory)

  // Generate a nice title for the colors
  // [blue, green, orange] => "Blue, Green & Orange"
  const paletteNames = palettes
    .map(({name}) => name)
    .reduce((acc, cur, curIndex, arr) => {
      const curTitleCase = titleCase(cur)

      // Last name
      if (curIndex === arr.length - 1) {
        return `${acc} ${curTitleCase}`
      }

      // Second last name
      if (curIndex === arr.length - 2) {
        return acc ? `${acc} ${curTitleCase} &` : `${curTitleCase} &`
      }

      return acc ? `${acc} ${curTitleCase},` : `${curTitleCase},`
    }, ``)

  const documentTitle = [
    paletteNames,
    `10-Color`,
    palettes.length === 1 ? `Palette` : `Palettes`,
    `for Tailwind CSS`,
  ].join(` `)

  // Update document title
  if (typeof document !== 'undefined') {
    document.title = documentTitle
  }

  // Update the URL
  if (typeof window !== 'undefined') {
    const currentUrl = new URL(window.location.href)

    if (palettes.length === 1) {
      // One palette === pretty url
      const canonicalPath = new URL(createCanonicalUrl(palettes)).pathname
      currentUrl.pathname = canonicalPath
      currentUrl.search = ``
    } else {
      // Many palettes === query string
      palettes.forEach((palette) => {
        currentUrl.searchParams.set(palette.name, palette.value.toUpperCase())
      })
      currentUrl.pathname = ``
    }

    console.log(`updating history`)

    // Update without pushing to history
    if (updateHistory) {
      window.history.pushState({}, '', currentUrl.toString())
    } else {
      window.history.replaceState({}, '', currentUrl.toString())
    }
  }

  // Update meta tags
  if (typeof window !== 'undefined') {
    const metaTitleTag = document.querySelector(`meta[name="twitter:title"]`)

    if (metaTitleTag) {
      metaTitleTag.setAttribute(`content`, documentTitle)
    }

    const themeColorTag = document.querySelector(`meta[name="theme-color"]`)
    const themeColorValue = palettes[0].swatches.find((swatch) => swatch.stop === 500)?.hex

    if (themeColorTag && themeColorValue) {
      themeColorTag.setAttribute(`content`, themeColorValue.toUpperCase())
    }

    const canonicalLinkTag = document.querySelector(`link[rel="canonical"]`)
    const canonicalUrl = createCanonicalUrl(palettes)

    if (canonicalLinkTag) {
      canonicalLinkTag.setAttribute(`href`, canonicalUrl)
    }

    const ogUrlTag = document.querySelector(`meta[property="og:url"]`)

    if (ogUrlTag) {
      ogUrlTag.setAttribute(`content`, canonicalUrl)
    }

    const ogTitleTag = document.querySelector(`meta[property="og:title"]`)

    if (ogTitleTag) {
      ogTitleTag.setAttribute(`content`, documentTitle)
    }

    const ogImageTag = document.querySelector(`meta[property="og:image"]`)

    if (ogImageTag) {
      const {url: metaImageUrl} = createPaletteMetaImageUrl(palettes[0])
      ogImageTag.setAttribute(`content`, metaImageUrl)
    }
  }
}
