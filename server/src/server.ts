import chokidar, { FSWatcher } from "chokidar";
import { parse } from "luaparse";
import fs from "fs";
import path from "path";

const RESOURCE_METADATA_KEYS = [
  "client_scripts",
  "client_script",
  "server_scripts",
  "server_script",
  "shared_scripts",
  "shared_script",
  "ui_page",
  "files",
];

const watchers: { [key: string]: { watcher?: FSWatcher } } = {};

const report = (src: string, message: string) =>
  emitNet("hot-reload:report", src, message);

const getFileData = async (filePaths: string[]) =>
  Promise.all(
    filePaths.map(
      (filePath) =>
        new Promise<string>((resolve) =>
          fs.readFile(filePath, "utf8", (_e, data) => resolve(data))
        )
    )
  );

const getAllResources = () => {
  const numResources = GetNumResources();
  const resourceNames = [];
  for (let i = 0; i < numResources; i++) {
    const resourceName = GetResourceByFindIndex(i);
    if (resourceName) {
      resourceNames.push(resourceName);
    }
  }
  return resourceNames;
};

const watchResource = async (source: string, resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    report(source, `Cannot watch ${resourceName}`);
    return;
  }

  if (watchers[resourceName]) {
    report(source, `Already watching ${resourceName}`);
    return;
  }

  if (GetResourceState(resourceName) === "missing") {
    report(source, `Unknown resource ${resourceName}`);
    return;
  }

  // immediately add an empty object to avoid any potential race condititons
  watchers[resourceName] = {};

  const resourcePath = GetResourcePath(resourceName);

  const manifestData = (
    await getFileData(
      ["fxmanifest.lua", "__resource.lua"].map((fileName) =>
        path.resolve(resourcePath, fileName)
      )
    )
  ).find((result) => result);

  if (!manifestData) {
    report(source, `Unable to parse manifest for ${resourceName}`);
    return;
  }

  /*********
   * Lets parse the lua into AST then pick out the filenames. Bizzarely, this is more reliable than
   * the GetResourceMetadata() natives
   */
  const resourceFiles: string[] = [];
  const parsedManifest = parse(manifestData);

  parsedManifest.body.forEach((statement) => {
    if (statement.type === "CallStatement") {
      const base = statement.expression.base;
      if (base.type === "Identifier") {
        if (RESOURCE_METADATA_KEYS.includes(base.name)) {
          if (
            statement.expression.type === "TableCallExpression" &&
            statement.expression.arguments.type === "TableConstructorExpression"
          ) {
            const expressionArgs = statement.expression.arguments;
            expressionArgs.fields.forEach((field) => {
              if (field.value.type === "StringLiteral") {
                resourceFiles.push(field.value.raw.replace(/^'|'$/g, ""));
              }
            });
          } else if (statement.expression.type === "StringCallExpression") {
            const expressionArg = statement.expression.argument;
            if (expressionArg.type === "StringLiteral") {
              resourceFiles.push(expressionArg.raw.replace(/^'|'$/g, ""));
            }
          }
        }
      }
    }
  });

  let lastRestart = Date.now();

  watchers[resourceName].watcher = chokidar
    .watch(resourceFiles, {
      persistent: true,
      cwd: resourcePath,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    })
    .on("all", () => {
      setImmediate(() => {
        const now = Date.now();
        if (now > lastRestart + 800) {
          if (GetResourceState(resourceName) === "started") {
            ExecuteCommand(`restart ${resourceName}`);
          }
          lastRestart = now;
        }
      });
    });

  report(source, `Watching ${resourceName}`);
};

const unwatchResource = (source: string, resourceName: string) => {
  if (!watchers[resourceName]) {
    report(source, `Not watching ${resourceName}`);
    return;
  }
  //watchers[resourceName].close();
  delete watchers[resourceName];
  report(source, `Stopped watching ${resourceName}`);
};

onNet("hot-reload:watch", (resourceName: string) => {
  if (resourceName === "all") {
    getAllResources().forEach((resource) => watchResource(source, resource));
    return;
  }
  watchResource(source, resourceName);
});

onNet("hot-reload:unwatch", (resourceName: string) => {
  if (resourceName === "all") {
    getAllResources().forEach((resource) => unwatchResource(source, resource));
    return;
  }
  unwatchResource(source, resourceName);
});

onNet("hot-reload:list", () => {
  const resources = Object.keys(watchers);
  if (resources.length === 0) {
    report(source, `Watching no resources`);
    return;
  }
  report(source, `Watching: ${resources.join(", ")}`);
});
