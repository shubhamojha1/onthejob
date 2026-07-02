import { useState } from 'react'
import type { Incident } from '../schema/incident'

const SITE = 'https://www.systemsfailed.dev'

/** Post to X, copy the link, or grab the pre-rendered share card. */
export function ShareRow({ incident: i }: { incident: Incident }) {
  const [copied, setCopied] = useState(false)
  const url = `${SITE}/incident/${i.id}`
  const text = `${i.company} ${i.year}: ${i.title}\n\nLesson: ${i.lesson}`
  const tweetHref =
    'https://twitter.com/intent/tweet?' +
    new URLSearchParams({ text, url }).toString()

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className="oj-share">
      <span className="oj-share-label">Share this failure</span>
      <a
        className="oj-share-btn primary"
        href={tweetHref}
        target="_blank"
        rel="noreferrer"
      >
        Post on X
      </a>
      <button className="oj-share-btn" onClick={copy}>
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <a
        className="oj-share-btn"
        href={`/cards/${i.id}.png`}
        download={`${i.id}.png`}
      >
        Download card
      </a>
    </div>
  )
}
