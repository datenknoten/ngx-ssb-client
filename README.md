# NgxSsbClient

Welcome to my experiment with [scuttlebutt](). I started this client for two reasons:

1. I wanted to learn more about scuttlebutt.
1. I was a bit unhappy with patchwork and wanted to explore other UI-Concepts.

## Goals

I'm aiming at writing a full client with [angular]() and [semantic ui](). But as a german proverb goes [„Der Weg ist das Ziel“](http://false-friends.crellin.de/2012/06/der-weg-ist-das-ziel-auf-englisch.html), learning is my main goal while writing this client and not finishing as fast as possible.

## Components

### Angular

I'm using angular as my base for this web application.

### Semantic UI

Since I'm very bad at design, I'm using this library as it provides fundamental elements with a very neat design.

### NGXS

[ngxs]() is a library to manager your local state and it does so very good and very programmer friendly.

### Toast UI Editor

[tui.editor](https://github.com/nhnent/tui.editor) looked very good for my purpose, so it is going to be the markdown editor of my choice.

## TODO

This are immidiatly doable Tasks I have to do to make my client somewhat useable.

* Skip `ssb-party` and learn to start my own sbot instance so I can load `ssb-names`, because than I can fetch names and images for identities better.
* Integrate tui.editor
* Better way to filter the feed
* Add a activity timestamp to the `PostingModel` and sort with this field.

These are some futures:

* Find a proper name ;-)

## Development

If you want to develop on this do these steps:

* Clone this repo
* npm i
* npm run start