# Image credits

The four bento photographs come from Unsplash. The [Unsplash
License](https://unsplash.com/license) grants free use, including commercially,
**without attribution** — these credits are recorded anyway so the images can be
traced, swapped or attributed later.

Each was requested from the Unsplash CDN pre-cropped to its panel's aspect ratio,
then encoded to WebP with `cwebp -q 72`.

| file | panel | source |
|---|---|---|
| `bento-screen.webp` | row 1 — beside *Film Discussions* | `images.unsplash.com/photo-1595769816263-9b910be24d5f` |
| `bento-set.webp` | the mobile hero's backdrop | `images.unsplash.com/photo-1478720568477-152d9b164e26` |
| `bento-audience.webp` | row 2 — beside *Debates* | `images.unsplash.com/photo-1517604931442-7e0c8ed2963c` |
| `bento-reels.webp` | row 3 — beside *Collaborate* | `images.unsplash.com/photo-1440404653325-ab127d49abc1` |
| `bento-night.webp` | row 4 — beside *Meetups* | `images.unsplash.com/photo-1536440136628-849c177e76a1` |

**Photographer names are not recorded here.** Unsplash's search and metadata APIs
are unreachable from the environment these were fetched in, so only the CDN asset
IDs could be resolved. To recover a photographer, open
`https://unsplash.com/photos/<id>` using the ID above.

**The files are colour.** The black-and-white treatment is `filter: grayscale(1)`
in `bento.css`, not baked into the asset, so it is one line to tune or remove.
