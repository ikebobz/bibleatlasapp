# NKJV licence request — Bible Atlas

The New King James Version is published by Thomas Nelson (HarperCollins Christian
Publishing). It is licensed case by case rather than bundled into a standard
API.Bible plan, so it has to be requested directly and then added to our existing
API.Bible key's authorised bibles.

Our key currently authorises 258 bibles (47 English) — NKJV is not among them,
which is why requests for it return 404.

## Where to send it

1. **API.Bible support** — <support@api.bible> (or the "Request a Bible" form in
   the API.Bible developer dashboard). Ask them to route the request to
   HarperCollins Christian Publishing and to attach NKJV to our existing key.
2. **HarperCollins Christian Publishing permissions** — the Bible permissions
   request form at <https://www.harpercollinschristian.com/permissions/>.
   Send the same text; mention that delivery would be through API.Bible.

Send both; the API.Bible route is usually faster, the direct route is what
ultimately grants the rights.

---

## Message to send

> Subject: NKJV licence request — Bible Atlas (mybibleatlas.com)
>
> Hello,
>
> I'm writing to request permission to display the New King James Version in
> Bible Atlas, and to have it added to our existing API.Bible key.
>
> **The product**
> Bible Atlas (https://mybibleatlas.com) is a free web and installable PWA Bible
> reader. Alongside the text it provides interactive maps of biblical journeys,
> timelines, people and place pages, a concordance and thematic connections
> between passages. The Scripture text is always the centre of the experience.
>
> **How the text would be used**
> - Chapter-level reading, one chapter per request.
> - Verse search within the selected translation.
> - Sharing of a single verse via a link and a social preview card.
> - Text is fetched per request from API.Bible at read time. It is never
>   downloaded in bulk, redistributed, or exported.
>
> **Compliance already built in**
> We already carry licensed translations (NIV and The Message) under the same
> terms, and the application enforces them in code:
> - Licensed texts are flagged display-only: offline download and device storage
>   are refused for them, while public-domain texts may be saved.
> - The required copyright notice is rendered beneath every chapter of a licensed
>   translation and on our About page.
> - All API calls are made server-side with the key held as a secret; the key is
>   never exposed to the browser.
>
> **Scale and business model**
> - Current monthly traffic: ____________ (visits / chapter reads)
> - Monetisation: ____________ (currently free, no ads, no subscription)
> - Expected API volume for NKJV: within our existing 150,000 requests/month plan
>
> **The ask**
> Please advise on licensing the NKJV for this use, including any fees or
> revenue-share terms, and — if approved — arrange for NKJV to be added to the
> authorised bibles on our existing API.Bible key.
>
> Our API.Bible account is registered to ____________ (account email).
>
> Thank you,
> ____________
> Bible Atlas — https://mybibleatlas.com

---

## When the licence arrives

No structural work is needed. Once NKJV appears on the key's authorised list,
the catalogue route `/api/public/get-available-bibles` picks it up automatically
and it shows in the version picker. Optionally add it to `CURATED_CATALOGUE` in
`src/lib/translations.ts` so it renders with a proper name and sorts near the top.
