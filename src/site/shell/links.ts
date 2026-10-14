import pkg from '../../../package.json'

// Where the run site's links go: the docs on this site, the source repository named in package.json.
export const repository: string = pkg.repository
export const licence = `${repository}/blob/main/LICENSE`
export const docsPath = (slug?: string) => (slug ? `/docs/${slug}` : '/docs')
