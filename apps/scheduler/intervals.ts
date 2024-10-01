const durationsInMs = {
    ms: 1,
    seconds: 1000,
    minutes: 60_000,
    hours: 3_600_000,
    days: 86_400_000,
};

type Duration = keyof typeof durationsInMs;

export function every(times: number, duration: Duration) {
    return times * durationsInMs[duration];
}
