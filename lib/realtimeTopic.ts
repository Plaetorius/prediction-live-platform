export function topicBetStream(
  platform: string,
  stream: string,
  kind: 'all' | 'pool' | 'placement' | 'resolution' = 'all',
) {
  const parts = ['bets']
  if (kind !== 'all') parts.push(kind)
  parts.push(platform.toLocaleLowerCase(), stream.toLowerCase())
  return parts.join(':')
}