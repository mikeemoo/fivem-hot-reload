onNet("hot-reload:report", console.log);

RegisterCommand(
  "watch",
  (_source: string, resources: string[]) =>
    emitNet("hot-reload:watch", ...resources),
  true
);

RegisterCommand(
  "unwatch",
  (_source: string, resources: string[]) =>
    emitNet("hot-reload:unwatch", ...resources),
  true
);

RegisterCommand(
  "watching",
  (_source: string) => emitNet("hot-reload:list"),
  true
);
