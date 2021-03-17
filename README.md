# Adventure Rocks 🪨!

Kids release painted rocks on an epic journey.

To play:

1. Paint a rock!
2. Name your rock and figure out what the rock likes and dislikes.
3. Print out a 2cm QR code
4. Glue the QR code to the bottom of the rock, and waterproof the heck out of it.

## Goals

- [x] Get demo running: https://adventure-rocks.web.app/v/SkyMap
- [ ] Security
- [ ] Instagram tag and embed recent snaps!
- [ ] Release rock 0 (SkyMap)
- [ ] Easier "Add a rock" page
- [ ] Smart initial zoom
- [x] Rock portraits (to be sure you have the right rock)
- [ ] List of "Track all rocks I have released"
- [x] Auto Anonymous Auth
- [ ] Shorter easier QR with u.nu


## Development

Single page site.  Has 4 states:

* knownRock: Viewing a rock's route, but you don't have it.
* haveRock: You have the rock in your hand AND can log a visit.
* newRock: Want to release a new rock
* noRock: I got nothing and just found this site.

`firebase ( login | init | serve | deploy )`

* Serves: https://adventure-rocks.web.app
* [Database](https://console.firebase.google.com/project/adventure-rocks/firestore/data~2F)

### Schema

* rocks
  * ID=(rock name LC)
    * likes, dislikes
    * name
    * visits
      * ID=auto
        * ts
        * gps

## Notes

* [Database](https://github.com/firebase/quickstart-js/blob/master/database/index.html)
* [Secrets](https://github.com/salamanders/adventure-rocks/settings/secrets)
* [QR Code Tool](https://www.nayuki.io/page/qr-code-generator-library) - use Medium Error Correction
* [Light Material Design buttons](https://mildrenben.github.io/surface/docs/buttons.html)
* [Background](https://www.myfreetextures.com/worn-parchment-paper-3/)
