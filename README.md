# FiveM hot-reload resource

A fairly simple resource that will watch other resources for you and hot reload them when changes are detected.
The file locations are extracted from the fxmanifest.lua files of each resource. Glob patterns are supported.

## Commands
* `watch <resourceName>` Start watching a resource
* `watch all` Start watching all resources
* `unwatch <resourceName>` Stop watching a resource
* `unwatch all` Stop watching all resources
* `watching` List all of the resources currently being watched.
