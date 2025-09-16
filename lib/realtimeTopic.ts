export function topicBetStream(
  platform: string,
  name: string,
  kind: 'all' | 'pool' | 'placement' | 'resolution' = 'all',
) {
  const parts = ['bets']
  if (kind !== 'all') parts.push(kind)
  parts.push(platform.toLocaleLowerCase(), name.toLowerCase())
  return parts.join(':')
}