export type Result<T, E = Error> = [null, T] | [E, null];
export const to = async <T>(promise: Promise<T>) => {
  return promise
    .then((data) => [null, data] as Result<T>)
    .catch((err) => [err as Error, null] as Result<T>);
};
export const Ok = <T>(data: T) => [null, data] as Result<T>;
export const Err = <E = Error>(error: E) => [error, null] as Result<never, E>;

export function isBot(userAgent: string): boolean {
  const botPatterns = [
    'bot', 'crawler', 'spider', 'facebookexternalhit', 'discordbot', 'whatsapp',
    'telegram', 'twitter', 'slack', 'linkedinbot', 'embedly'
  ];
  const lowerUA = userAgent.toLowerCase();
  return botPatterns.some(pattern => lowerUA.includes(pattern));
}

