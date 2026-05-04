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
