// Hash asosidagi oddiy router: #/students, #/groups/g1 ...
import { useEffect, useState } from 'react'

const parse = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)

export function useRoute() {
  const [parts, setParts] = useState(parse)
  useEffect(() => {
    const onChange = () => {
      setParts(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return parts
}

export const navigate = (to) => {
  window.location.hash = to
}

export function Link({ to, children, ...rest }) {
  return (
    <a href={'#' + to} {...rest}>
      {children}
    </a>
  )
}
