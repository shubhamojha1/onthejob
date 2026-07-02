import { Link } from 'react-router-dom'
import { Masthead } from '../components/Masthead'

export function Component() {
  return (
    <div className="oj-root">
      <Masthead />
      <div className="oj-empty" style={{ marginTop: 80, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
        <p>
          <strong>404 — nothing at this address.</strong>
          <br />
          No impact, no trigger, no lesson. The record lives at the homepage.
        </p>
        <Link to="/">
          <button>Back to the record</button>
        </Link>
      </div>
    </div>
  )
}
