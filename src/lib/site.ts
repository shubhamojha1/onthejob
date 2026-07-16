export const SITE_URL = 'https://www.systemsfailed.dev'

export const SITE_SHARE_HREF =
  'https://twitter.com/intent/tweet?' +
  new URLSearchParams({
    text: 'Production breaks. The pattern repeats.\n\nExplore real engineering postmortems by failure mode:',
    url: SITE_URL,
  }).toString()
