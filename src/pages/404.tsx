import { Link } from 'react-router-dom'
import { Masthead } from '../components/Masthead'

export function Component() {
  return (
    <div className="oj-root">
      <Masthead />
      <div className="oj-empty" style={{ paddingTop: 80 }}>
        <p>Page not found.</p>
        <Link to="/">
          <button>Back to incidents</button>
        </Link>
      </div>
    </div>
  )
}
