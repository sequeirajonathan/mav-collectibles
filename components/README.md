# Components

Where things live, and which building block to reach for.

| Folder         | What's in it                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| `ui/`          | The UI kit: small, app-agnostic primitives. Start here.                       |
| `hub/`         | Event-hub pieces: event/post/vendor cards, badges, RSVP, comments, Discord.   |
| `shop/`        | Showcase shop: product cards, catalog grid/filters, add to cart.              |
| `admin/`       | Staff forms and tables (events, posts, vendors, results, site settings).      |
| `account/`     | Profile and address forms.                                                    |
| `auth/`        | Sign-in, sign-up, password reset, complete-profile forms and their errors.    |
| `layout/`      | Site header, footer, mobile drawer, banners, shop-mode provider.              |
| `print-agent/` | The Electron print agent screens.                                             |

File names are kebab-case. Everything is a server component unless the file
starts with `"use client"`; keep it that way and only add `"use client"` to
components that need state, effects or browser APIs.

## The UI kit (`@components/ui/*`)

All colours come from the theme tokens in `styles/globals.css` (`gold`,
`gold-light`, `gold-dark`, `panel`, `panel-2`, `line`, `ink`, `success`,
`danger`, `discord`, ...). Don't use hex values in components.

### Surfaces: `card.tsx`

```tsx
<Card padding="lg">...</Card>                                // a <div>
<Card asChild variant="list"><ul>...</ul></Card>             // styling on your own element
<Link className={cn(cardVariants({ variant: "interactive", padding: "md" }), "flex gap-3")} />
```

| `variant`     | Use for                                                              |
| ------------- | -------------------------------------------------------------------- |
| `default`     | Any boxed panel or form section.                                     |
| `interactive` | Whole-card links. Gold edge, glow and a 2px lift on hover (mouse only). |
| `list`        | `<ul>`/`<ol>` of rows separated by hairlines.                        |
| `accent`      | Gold-tinted callout (linked event, "available in store").            |
| `featured`    | Gold-edged hero/spotlight panel.                                     |
| `dashed`      | Empty placeholders.                                                  |
| `inset`       | A recessed surface inside a card (thumbnails, wells).                |

`padding`: `none` (default), `sm` (p-3), `md` (p-4), `lg` (p-4, p-6 from `fold`), `row` (px-4 py-3).
`radius`: `xl` (default), `lg`, `2xl`.

### Actions: `button.tsx`, `link-button.tsx`

```tsx
<Button onClick={save}>Save</Button>                          // gold is the default
<Button variant="outline" size="sm">Cancel</Button>
<LinkButton href="/vendors/apply">Apply for a table</LinkButton> // next/link, works in server components
<a href={url} className={buttonVariants({ variant: "outline", size: "sm" })}>Website</a>
```

Variants: `gold` (primary, one per view), `outline` (secondary), `ghost`
(tertiary/inline), `secondary`, `destructive`, `link`.
Sizes: `default` and `sm` are 44px tall on touch screens (`sm` drops to 36px
with a mouse), `lg` is 48px, `icon` is 44×44. Focus uses the global gold
`:focus-visible` outline, so don't add ring classes.

### Chips: `chip.tsx`

`ChipLink` for filter/tab pills (`active` sets `aria-current`, `dot` shows a
game colour), `chipClass(active)` for other elements, and `chipRowClass` for
the row that scrolls sideways on phones and wraps from `fold` up.

### Badges: `badge.tsx`

`<Badge variant="neutral | outline | gold | success | danger">`. The hub
wrappers in `hub/badges.tsx` (`GameBadge`, `KindBadge`, `StatusPill`,
`RankMark`) build on it.

### Loading: `skeleton.tsx`

```tsx
<Suspense fallback={<Skeleton className="h-64" />}>        // panel-sized block
<Skeleton className="h-4 w-1/2 rounded bg-panel-2" />       // a text line inside a Card
```

Skeletons shimmer (and stay still under `prefers-reduced-motion`).

### Page structure: `page-header.tsx`

- `PageHeader`: the page `<h1>` with optional `eyebrow`, `description` and `actions`.
- `SectionHeading`: a section `<h2>` with an optional "See all" link.
- `EmptyState`: "nothing here yet" with an optional action.
- `Eyebrow`: the small gold all-caps label.

### Forms: `field.tsx`, `input.tsx`, `label.tsx`, `switch.tsx`, `phone-input.tsx`

Hub/admin forms use `Field` (label + hint + error wired for screen readers)
with `inputClass` on the native control:

```tsx
<Field label="Title" error={errors.title}>
  {(id) => <input id={id} className={inputClass} value={title} onChange={...} />}
</Field>
```

The auth forms use `Input` + `Label`; `PhoneInput` formats US numbers.
`Switch` is the Radix toggle used on the admin site settings.

## Responsive and theme helpers (`styles/globals.css`)

- Breakpoint `fold` (36rem): iPhone Duo inner display and small tablets.
- Variants `short` (phones in landscape) and `can-hover` (mouse/trackpad; put
  hover-only effects behind it so they don't stick on touch screens).
- Utilities: `px-safe`, `pb-safe` (notch-aware padding), `scroll-fade`,
  `scrollbar-none`, `skeleton`, `bg-hero`, `text-foil`, and the `shadow-glow` shadow.
