import { useId, type ButtonHTMLAttributes } from 'react'

/** One seed tooltip for icon controls, with immediate keyboard disclosure. */
export function IconButton({ tooltip, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tooltip: string }) {
  const id = useId()
  return <span className="icon-control"><button {...props} aria-describedby={id}>{children}</button><span id={id} className="control-tooltip" role="tooltip">{tooltip}</span></span>
}
