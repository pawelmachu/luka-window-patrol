# Luka: Window Patrol — V6

Updated after visual feedback.

## Fixes in this version

- the bottom instructions area was adjusted so it should no longer get cut on normal laptop screens
- the layout is more compact overall
- Luka was redrawn to look much more like an actual dog:
  - clearer legs and paws
  - more defined head and snout
  - stronger dog-like silhouette
  - fuller ears
  - better merle-style spots and markings
- pause, start and restart controls remain
- movement stays on left / right arrows only

## Controls

- `Space` = bark
- `Enter` = start / continue
- `Esc` = pause / resume
- `Left arrow` = move Luka left
- `Right arrow` = move Luka right


## V7 visual fix

- Luka now uses proper image-based game sprites instead of the rough canvas-only drawing
- two custom sprites were added:
  - idle / alert Luka
  - barking Luka
- these sprites are based on the Luka asset style, so she should look much more like a real dog and much closer to the artwork


## V8 sprite polish

- Luka sprites were rebuilt with cleaner transparent edges
- new filenames were used to avoid browser cache issues:
  - assets/luka-sprite-idle-v2.png
  - assets/luka-sprite-bark-v2.png
- Luka was resized and repositioned to sit more naturally in the room
- extra soft shadow was added so she blends into the scene better


## V9 Luka scale and pose tweak

- Luka was made a bit smaller
- the sprite drawing was vertically compressed slightly to give a more seated look
- position and angle were kept close to the previous version
- shadows were updated so she still sits naturally in the room


## V10 cache and sitting tweak

- sprite file names were changed again to avoid browser caching:
  - assets/luka-sit-idle-v3.png
  - assets/luka-sit-bark-v3.png
- Luka was adjusted to feel more seated:
  - a bit smaller
  - lower on the cushion
  - more vertically compressed


## V11 mobile browser version

This version adds a mobile-first browser layout for iPhone and similar phones.

### Mobile controls

- Tap **BARK!** to bark
- Hold **←** to move Luka left
- Hold **→** to move Luka right
- Tap the game area to bark
- Tap **Pause** to pause / resume
- Tap **Restart** to restart from the beginning

### Mobile UX changes

- desktop keyboard controls still work
- mobile touch controls appear automatically on small screens
- layout uses safe-area padding for iPhone browser bars
- accidental page scrolling is reduced while playing
- the canvas scales to the phone screen


## GitHub Pages note

The file `.nojekyll` is included on purpose. It may be hidden on Mac because the filename starts with a dot.

To show hidden files in Finder, press:

`Command + Shift + .`

Upload `.nojekyll` together with the other files when publishing to GitHub Pages.


## V13 improvements

- 5 distinct level backgrounds with different moods and time-of-day color palettes
- tighter, cleaner mobile layout
- Luka tuned to a slightly larger and better-balanced in-game size for iPhone screens
- mobile buttons redesigned to feel more game-like
- fresh asset filenames to avoid stale mobile browser cache
- improved audio wake-up for iPhone / Safari


## V14 final tested notes

This version follows safer browser-game deployment practices:

- Luka gameplay sprites are embedded directly into `game.js` as data URIs to avoid stale-cache issues and broken image paths
- Luka hero portrait is embedded directly into `index.html`
- the hosted URL can stay the same if you update the files in the same GitHub repository
- the package keeps `.nojekyll` for GitHub Pages compatibility

### Testing checklist completed

- zip integrity checked
- required files checked
- GitHub Pages files included
- Luka sprite references verified
- level background themes verified
- mobile controls verified
- desktop arrow controls verified
- audio wake helper verified


## V15 mobile screen fix

- enlarged the game canvas for iPhone 16 Pro style portrait screens
- tightened the top header and HUD spacing
- enlarged in-game popups
- rewrote the bottom mobile instructions with clearer text
- improved mobile typography so the text feels more consistent


## V16 mobile scale fix

- restored the correct 16:9 mobile game canvas proportions
- reduced the extra UI height so the game feels more balanced on iPhone
- removed the extra fixed capture field from the background
- kept only one moving bark zone that follows Luka
- refined popup sizing and wording


## V17 iPhone 16 Pro tuning

- tightened the mobile UI so the game uses more of the tall iPhone screen
- reduced header, HUD, button, and bottom help-card height
- kept the game screen proportional while making it feel larger on phone
- adjusted the bark zone so it starts at the bottom of the window view and reaches up to the highest character
