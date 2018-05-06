# NgxSsbClient

Welcome to my experiment with [scuttlebutt](https://www.scuttlebutt.nz/). I started this client for two reasons:

1. I wanted to learn more about scuttlebutt.
1. I was a bit unhappy with patchwork and wanted to explore other UI-Concepts.

## Goals

I'm aiming at writing a full client with [angular](https://angular.io/) and [semantic ui](https://semantic-ui.com/). But as a german proverb goes [„Der Weg ist das Ziel“](http://false-friends.crellin.de/2012/06/der-weg-ist-das-ziel-auf-englisch.html), learning is my main goal while writing this client and not finishing as fast as possible.

## Components

### Angular

I'm using angular as my base for this web application.

### Semantic UI

Since I'm very bad at design, I'm using this library as it provides fundamental elements with a very neat design.

### NGXS

[ngxs](https://ngxs.gitbook.io/ngxs) is a library to manager your local state and it does so very good and very programmer friendly.

### Toast UI Editor

[tui.editor](https://github.com/nhnent/tui.editor) looked very good for my purpose, so it is going to be the markdown editor of my choice.

## TODO

These are tasks that need some love:

* Need to make [ssb-names](https://github.com/ssbc/ssb-names) work, so I can better display names and images of identities. I should pester @dominictarr with this.
* Enforce preview mode when posting a message
* Upload blobs. Need to connect to [electrons file chooser](https://github.com/electron/electron/blob/master/docs/api/dialog.md)
* Add a activity timestamp to the `PostingModel` and sort with this field.
* Add a profile detail page
* Add a search view
* Include subscribed channels in the side bar
* Add a channel feed page


These are some futures:

* Find a proper name ;-)

## Development

If you want to develop on this do these steps:

* Clone this repo
* npm i
* npm run start