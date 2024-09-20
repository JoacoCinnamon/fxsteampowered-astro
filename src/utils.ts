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
    "bot",
    "crawler",
    "spider",
    "facebookexternalhit",
    "discordbot",
    "whatsapp",
    "telegram",
    "twitter",
    "slack",
    "linkedinbot",
    "embedly",
  ];
  const lowerUA = userAgent.toLowerCase();
  return botPatterns.some((pattern) => lowerUA.includes(pattern));
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
export function formatUSD(amount: number | string) {
  const parsedAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  return `USD${usdFormatter.format(parsedAmount)}`;
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});
export function formatARS(amount: number | string) {
  const parsedAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  return `ARS${arsFormatter.format(parsedAmount)} 🧉`;
}
