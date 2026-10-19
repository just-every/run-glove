// Which controls to offer a person: the commands GET /api/glove/state says
// they hold (built-in or custom role). The server decides every command
// (src/glove/access.ts); this only avoids offering buttons that would be refused.
export const can = (actor: { commands: string[] }, type: string) => actor.commands.includes(type)
