// Addresses Glove fetches because a person typed them (DISP-004 calendar
// feeds) must name a public host: never a loopback, private, link-local,
// shared, documentation, multicast or otherwise reserved IP address, nor a
// local-only or single-label name. The URL parser has already lowercased the
// host and written IPv4 in any notation (2130706433, 0x7f.1) as dotted decimal
// and IPv6 as compressed hex.

/** IANA special-purpose IPv4 blocks; 224.0.0.0/3 is multicast, reserved and broadcast. */
const reserved = ['0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16', '172.16.0.0/12', '192.0.0.0/24', '192.0.2.0/24', '192.88.99.0/24', '192.168.0.0/16', '198.18.0.0/15', '198.51.100.0/24', '203.0.113.0/24', '224.0.0.0/3']

const v4 = (host: string) => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  return m ? m.slice(1).reduce((n, part) => n * 256 + Number(part), 0) : null
}

const within = (ip: number, block: string) => {
  const [base, bits] = block.split('/'), size = 2 ** (32 - Number(bits))
  return Math.floor(ip / size) === Math.floor(v4(base)! / size)
}

/** The eight 16-bit groups of a bracketed IPv6 host. */
const v6 = (host: string) => {
  const [head, tail = ''] = host.slice(1, -1).split('::')
  const a = head ? head.split(':') : [], b = tail ? tail.split(':') : []
  return [...a, ...Array(8 - a.length - b.length).fill('0'), ...b].map(g => parseInt(g, 16))
}

/** Global unicast (2000::/3) only, without its special-purpose, documentation and 6to4 blocks. */
const publicV6 = ([a, b]: number[]) => a >= 0x2000 && a <= 0x3fff && !(a === 0x2001 && (b < 0x200 || b === 0xdb8)) && a !== 0x2002 && !(a === 0x3fff && b < 0x1000)

export function publicHost(hostname: string) {
  const host = hostname.replace(/\.$/, '')
  if (host.startsWith('[')) return publicV6(v6(host))
  const ip = v4(host)
  if (ip !== null) return !reserved.some(block => within(ip, block))
  return host.includes('.') && !/(^|\.)(localhost|localdomain|local|internal|lan|home\.arpa)$/.test(host)
}
