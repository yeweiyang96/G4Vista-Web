# G4Vista-Web Agent Rules

## BacDive Environment-G4 UI Work

- Before implementing microbial environment-G4 UI changes, read the current plan in `/Users/wzk/Projects/G4Vista/G4Vista-Library/local_artifacts/bacdive_microbial_g4_environment_research_plan_subplans/`.
- Do not build new UI behavior around the retired `microbial_environment_g4_assembly_plan` or `microbial_environment_g4_taxonomy_index` tables. Use the new Server contract once it exposes trait catalog, category catalog, numeric scatter, category box plot, and download endpoints.
- Do not hardcode the old temperature/pH trait and mode list for the redesigned page. Trait options, context axes, category checklist values, allowed outcome metrics, and defaults should come from the options response.
- Default ecological context filters must show canonical categories, not raw sample type or raw host species strings. Raw values may appear only in provenance drilldown, detail panels, table preview, or downloads.
- Category checklist behavior is multi-label. The same assembly may appear in multiple categories, but in one category it should be counted once. Do not present category membership as mutually exclusive unless the Server marks that axis as single-select.
- Category box plots should consume API-ready summary rows with quartiles, whiskers, median, sample size, and status. Do not make the default UI fetch all raw points just to compute quartiles client-side.
- Numeric traits use scatter plots. Categorical and multi-label traits use box plots. Keep these UI states distinct rather than forcing all traits through the old scatter query flow.
- Use the public metric fields from the plan and Server schema: `g4_density_per_mb`, `gene_quadruplex_density_per_mb`, `upstream_quadruplex_density_per_mb`, `downstream_quadruplex_density_per_mb`, and `intergenic_quadruplex_density_per_mb`.
- Do not introduce new front-end-only field names such as `quadruplex_density_per_mb`, `gene_g4_density_per_mb`, `upstream_g4_density_per_mb`, `downstream_g4_density_per_mb`, or `intergenic_g4_density_per_mb`.
- Display text may say `G4 density` or `quadruplex sequence density`, but field names must come from the API schema and not from labels.
- UI copy for ecological context, host association, and environment comparisons must stay non-causal. Prefer distribution, association, stratified comparison, and sensitivity analysis wording.
- Keep taxonomy filters available for ecological context analyses because host association and microbial taxonomy are confounded.
