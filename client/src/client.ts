onNet("hot-reload:report", console.log);

RegisterCommand(
  "watch",
  (_source: string, [resourceName]: [string]) =>
    emitNet("hot-reload:watch", resourceName),
  true
);

RegisterCommand(
  "unwatch",
  (_source: string, [resourceName]: [string]) =>
    emitNet("hot-reload:unwatch", resourceName),
  true
);

RegisterCommand(
  "watching",
  (_source: string) => emitNet("hot-reload:list"),
  true
);
