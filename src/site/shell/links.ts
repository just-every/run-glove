// Where the run site's links go. The run site never links an instance-only route (/signin, /setup, /app).
import run from '../run.json'

export const repository: string = run.repository
export const links = { home: '/', run: '/run', docs: '/docs', contract: '/contract', source: repository, licence: `${repository}/blob/main/LICENSE`, demo: 'https://demo.run-glove.com/' }
export const docsPath = (slug?: string) => (slug ? `/docs/${slug}` : '/docs')
