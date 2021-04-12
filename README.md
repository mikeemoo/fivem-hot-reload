# FiveM hot-reload resource

A fairly simple resource that will watch other resources for you and hot reload them when changes are detected.
The file locations are extracted from the fxmanifest.lua files of each resource. Glob patterns are supported.

## Commands

- `watch <resource1> <resource2>  <resource2>` Start watching resources
- `watch all` Start watching all resources
- `unwatch <resource1> <resource2> <resource3>` Stop watching resources
- `unwatch all` Stop watching all resources
- `watching` List all of the resources currently being watched.

Requires `add_ace resource.mm-hot-reload command.stop allow` and `add_ace resource.mm-hot-reload command.start allow` in server config.
