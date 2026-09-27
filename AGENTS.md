<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Keep mobile audio and chapter actions coordinated through the shared audio-bar context; it prevents stacked fixed controls while retaining the existing desktop player.
- Render verse-place previews inside the existing Atlas dialog using the canonical MapboxAtlas/AtlasMap surfaces; this preserves reader return links and avoids a competing map implementation.
- Generate reader capability cues from actual mapped-place records and 3D blocks into the lightweight Atlas index; this keeps chapter rendering truthful and avoids loading heavy map/model content.
- Scope ambiguous Atlas phrases to their biblical context and regenerate the lightweight index after match edits; generic words must not imply unrelated artifacts elsewhere.
