# Graph Report - crm-prototype  (2026-09-02)

## Corpus Check
- 91 files · ~597,781 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4101 nodes · 11446 edges · 139 communities (125 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.68)
- Token cost: 82,969 input · 0 output

## Community Hubs (Navigation)
- API client layer
- Impeccable detector rule checks
- Live browser overlay core
- Dossiers and filter pages
- UI conventions and list primitives
- Prospect and article forms
- App routing and lazy pages
- PageShell and UI primitives
- Browser visual-contrast detector
- Live browser editing session
- Live browser param panel
- Live browser script assembly
- Static HTML/CSS cascade engine
- Design-system extraction
- Dossier detail tabs and menus
- Impeccable hook library
- Browser antipattern config
- Live accept and Svelte pipeline
- Configure bar chrome UI
- Pre-edit hook enforcement
- Impeccable context directives
- Concept seed fixtures
- Screenshot UMD bundle
- Detector CLI entrypoint
- Manual edit commit flow
- Live accept CLI and paths
- Impeccable config loader
- Regex text detection engine
- Doctor diagnostics
- Hook admin and ignore rules
- Live completion and instructions
- Generated-file detection
- Color and glow rule checks
- Manual apply transactions
- Design document reference
- Design markdown parser
- Icon components
- shadcn agent skill docs
- Page chat steering UI
- Browser antipattern checks
- Impeccable path resolution
- Manual edit DOM context
- Prototype domain data docs
- Live session resume
- Live browser design header
- Element border and color checks
- Copy-edit agent
- Svelte component mounting
- Browser findings collection
- Heading and quality checks
- Critique snapshot storage
- Live event validation
- Live root discovery
- Insert placeholder UI
- Manual edit evidence
- Pending apply dock
- Discard manual edits
- Palette and overflow checks
- TypeScript app config
- Dossier status stepper
- Browser URL detector
- Live accept CSS baking
- Svelte AST analysis
- SvelteKit adapter
- TanStack Start adapter
- shadcn components config
- Runtime dependencies
- Framework injection journal
- ESLint dev dependencies
- Sidebar primitive
- Node TypeScript config
- Confirm and alert dialogs
- Impeccable reference flows
- Live server accept verify
- Deep staleness checks
- Project root detection
- Target candidate discovery
- Context signals loading
- Steer chat focus guard
- Annotation pin editing
- Astro framework detection
- Modal and module switcher
- Asset producer and embed
- Image generation script
- Question serving script
- Calendrier page
- Framework tag strategy
- Live routing reference
- Static element shim
- Feature instruction specs
- Craft floor and operate rules
- Gradient and position parsing
- Finding ignore filtering
- Framework inject journal
- Harness pin script
- Advanced filters doc
- Theme toggle and branding
- Dropdown menu primitive
- Live UI DOM helpers
- Framework registry
- Generation preflight
- Layout and sidebar shell
- Onboarding reference
- CSP detection
- Text occlusion checks
- Hook finding budget
- Palette generation script
- Sheet primitive
- Staleness notice cache
- Inline ignore directives
- Contrast check script
- Nuxt adapter
- Border shadow checks
- Radial spotlight checks
- Hook entry and audit log
- Template extension cache
- npm scripts
- Omran pre-prospection screens
- Omran prospection transform
- API docs update script
- Package metadata
- Tooltip primitive
- Root TypeScript config
- Impeccable provider ids
- Motion and type scale rules
- Vite env types
- Harden flow reference
- clsx dependency
- React refresh lint plugin
- shadcn dependency
- Tailwind Vite plugin
- React DOM types
- Vite React plugin
- Vite config
- Degraded documenter
- Omran prospect creation
- Omran prospection to dossier

## God Nodes (most connected - your core abstractions)
1. `request()` - 129 edges
2. `cn()` - 102 edges
3. `useApi()` - 75 edges
4. `formatDate()` - 52 edges
5. `Button()` - 51 edges
6. `formatCurrency()` - 48 edges
7. `parseAnyColor()` - 37 edges
8. `runHook()` - 37 edges
9. `collectBrowserFindings()` - 36 edges
10. `parseAnyColor()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `useDebouncedValue()` --semantically_similar_to--> `Client-side multi-statut fan-out + merge workaround`  [INFERRED] [semantically similar]
  src/lib/useApi.ts → docs/filtres-avances.md
- `11-value Dossier Statut progression pipeline` --semantically_similar_to--> `Derived dossier display-status utility (from milestone dates)`  [INFERRED] [semantically similar]
  instructions/FIX-mock-actions-state.md → CLAUDE.md
- `Active-filter chips (filter state invisible once set)` --conceptually_related_to--> `ProspectionFilterBar()`  [INFERRED]
  SESSION_MEMORY.md → src/components/ProspectionFilterBar.tsx
- `Active-filter chips (filter state invisible once set)` --conceptually_related_to--> `hasActiveProspectionFilters()`  [INFERRED]
  SESSION_MEMORY.md → src/lib/domain.tsx
- `UI/UX Polish — Iterative Enhancement Workflow (skill)` --semantically_similar_to--> `Product Principles (real data, legible rules, honest boundaries)`  [INFERRED] [semantically similar]
  .claude/skills/polish/SKILL.md → PRODUCT.md

## Import Cycles
- 1-file cycle: `src/components/ui.tsx -> src/components/ui.tsx`

## Hyperedges (group relationships)
- **List-page convention: debounce + stale-while-revalidating + branched empty states** — src_lib_useapi_usedebouncedvalue, src_lib_useapi_useapi, src_components_ui_resultsregion, src_components_ui_emptystate, src_lib_domain_hasactiveprospectionfilters, session_memory_stale_while_revalidating_list_convention [EXTRACTED 1.00]
- **Autorisation de versement re-scope: spec diff → api.ts URL → button relocation** — docs_api_docsv4, session_memory_spec_first_diff_workflow, session_memory_autorisation_versement_rescope, src_lib_api_fetchautorisationversementblob, src_pages_dossiers_dossierdetail_autorisationversementbutton [EXTRACTED 1.00]
- **Offres globales: GET /api/devis + DevisDto prospection link + page total** — docs_filtres_avances_offres_globale, src_lib_api_listoffres, src_types_devisdto, docs_filtres_avances_page_only_total, src_pages_prospections_offreslist_offreslist [EXTRACTED 1.00]
- **SKILL.md Critical Rules enforced across rule files** — agents_skills_shadcn_skill, agents_skills_shadcn_rules_styling, agents_skills_shadcn_rules_forms, agents_skills_shadcn_rules_composition, agents_skills_shadcn_rules_icons, agents_skills_shadcn_rules_chat, agents_skills_shadcn_rules_base_vs_radix [EXTRACTED 1.00]
- **Dossier detail page field-group enrichment (pricing, milestones, relances)** — instructions_fix_missing_data_fields_dossier_pricing, instructions_fix_missing_data_fields_milestones, instructions_fix_missing_data_fields_relances, claude_dossier_entity [EXTRACTED 1.00]
- **Live-mode session lifecycle scripts (setup, poll, wrap, accept, recovery)** — claude_skills_impeccable_reference_live_setup_liveconfig, claude_skills_impeccable_reference_live_livepollscript, claude_skills_impeccable_reference_live_livewrapscript, claude_skills_impeccable_reference_live_liveacceptscript, claude_skills_impeccable_reference_live_liveresumescript, claude_skills_impeccable_reference_live_liveserverscript [EXTRACTED 1.00]
- **SKILL.md Commands Table Enumerating Sub-Command References** — claude_skills_impeccable_skill, claude_skills_impeccable_reference_adapt, claude_skills_impeccable_reference_animate, claude_skills_impeccable_reference_audit, claude_skills_impeccable_reference_bolder, claude_skills_impeccable_reference_clarify, claude_skills_impeccable_reference_colorize, claude_skills_impeccable_reference_craft, claude_skills_impeccable_reference_critique, claude_skills_impeccable_reference_delight, claude_skills_impeccable_reference_distill, claude_skills_impeccable_reference_doctor [EXTRACTED 1.00]
- **Impeccable Modes Converging on Polish as Final Pass** — claude_skills_impeccable_reference_onboard, claude_skills_impeccable_reference_optimize, claude_skills_impeccable_reference_quieter, claude_skills_impeccable_reference_typeset, claude_skills_impeccable_reference_polish [EXTRACTED 1.00]
- **Web Commands Routing to Native Variant Which Defers to Platform References** — claude_skills_impeccable_reference_adapt, claude_skills_impeccable_reference_adapt_native, claude_skills_impeccable_reference_audit, claude_skills_impeccable_reference_audit_native, claude_skills_impeccable_reference_animate, claude_skills_impeccable_reference_android [EXTRACTED 1.00]
- **Commands That Hand Off to /impeccable polish as Final Step** — claude_skills_impeccable_reference_adapt, claude_skills_impeccable_reference_adapt_native, claude_skills_impeccable_reference_animate, claude_skills_impeccable_reference_audit, claude_skills_impeccable_reference_audit_native, claude_skills_impeccable_reference_bolder, claude_skills_impeccable_reference_clarify, claude_skills_impeccable_reference_colorize, claude_skills_impeccable_reference_critique, claude_skills_impeccable_reference_delight, claude_skills_impeccable_reference_distill [EXTRACTED 1.00]
- **Preset switching workflow (overwrite/merge/skip) described across SKILL.md, cli.md, customization.md** — agents_skills_shadcn_skill, agents_skills_shadcn_cli, agents_skills_shadcn_customization, concept_preset_system [EXTRACTED 1.00]
- **Routing Menu's Signal-Gathering Script Pipeline** — claude_skills_impeccable_reference_routing, claude_skills_impeccable_scripts_context, claude_skills_impeccable_scripts_context_signals, claude_skills_impeccable_scripts_detect [EXTRACTED 1.00]
- **Dossier creation wizard + status progression system** — instructions_feature_plan_financement_entity, instructions_fix_mock_actions_state_dossier_status_pipeline, claude_dossier_entity, claude_status_derivation [INFERRED 0.75]
- **Design detector hook tiering: per-edit mechanical scan, Stop-event deep pass, craft-floor manual reflexes** — claude_skills_impeccable_reference_hooks_hooks, claude_skills_impeccable_reference_hooks_hookadminscript, claude_skills_impeccable_reference_hooks_craftfloor_ref, claude_skills_impeccable_reference_layout_detectscript [INFERRED 0.75]
- **Duplicate shadcn skill installed under .agents and .claude skill directories** — agents_skills_shadcn_skill, agents_skills_shadcn_cli, agents_skills_shadcn_customization, claude_skills_shadcn_skill, claude_skills_shadcn_cli, claude_skills_shadcn_customization [INFERRED 0.85]
- **Pré-Prospection → Prospection → Dossier pipeline flow** — claude_prospection_entity, claude_dossier_entity, instructions_fix_prospection_pipeline_stage_gate, instructions_fix_mock_actions_state_transitions, product_pipeline_workflow [INFERRED 0.85]
- **Visual authority record chain: init (PRODUCT.md) -> new-work (world/direction) -> document (DESIGN.md/sidecar)** — claude_skills_impeccable_reference_init_initflow, claude_skills_impeccable_reference_init_productmd, claude_skills_impeccable_reference_new_work_newworkflow, claude_skills_impeccable_reference_document_document, claude_skills_impeccable_reference_document_designmd_format [INFERRED 0.85]
- **Dossier de Vente Status/Financement Workflow Documentation Set** — instructions_feature_changement_statut, instructions_feature_transformation_prospect, instructions_fix_dossier_vente_corrections, instructions_feature_plan_financement [INFERRED 0.90]

## Communities (139 total, 14 thin omitted)

### Community 0 - "API client layer"
Cohesion: 0.02
Nodes (190): Retrait de DevisDto.prix (champ inexistant dans le schéma réel), addEcheance(), addProspectContact(), addProspectionCategorie(), addProspectionProfil(), addProspectionTypeBien(), addProspectionVille(), addReglement() (+182 more)

### Community 1 - "Impeccable detector rule checks"
Cohesion: 0.03
Nodes (141): ANIMATION_VALUE_KEYWORDS, borderColorsFromStyle(), borderWidthsFromStyle(), checkBorders(), checkClippedOverflow(), checkCreamPalette(), checkEdgeFlushCardsDOM(), checkElementBlinkingCursorDOM() (+133 more)

### Community 2 - "Live browser overlay core"
Cohesion: 0.03
Nodes (132): applyGlobalBarLabelState(), applyPlaceholderSizingStyles(), averageRgb01(), bindEditBadgeProxy(), bufferToBase64(), buildCollapsible(), buildColorModels(), buildListHtml() (+124 more)

### Community 3 - "Dossiers and filter pages"
Cohesion: 0.05
Nodes (86): DevisPageDto.sommePrixVenteTTCPage — total de la page seulement, Client-side multi-statut fan-out + merge workaround, Active-filter chips (filter state invisible once set), Dashboard, EncaissementDetail, DossierPreviewDialog(), PreviewProvider(), ProspectionFilterBar() (+78 more)

### Community 4 - "UI conventions and list primitives"
Cohesion: 0.09
Nodes (71): Scripted multi-file rewrite pitfalls (CRLF, regex variants), Shared-primitive-first leverage principle, PageShell owns the page's only <h1>, Stale-while-revalidating list-page convention, ui-ux-pro-max --design-system misroutes on real-estate industry keyword, MultiSelectDropdown(), PageShell(), pageWindow() (+63 more)

### Community 5 - "Prospect and article forms"
Cohesion: 0.05
Nodes (86): ArticleCompactPreview(), ArticleResultsList(), CreateProspectForm(), CreateProspectInitial, DevisFormSection(), RefSelect(), SearchableSelect(), addInteraction() (+78 more)

### Community 6 - "App routing and lazy pages"
Cohesion: 0.06
Nodes (59): App(), ArticleDetail, ArticlesList, AuthGate(), ClientsList, ComingSoon, DossierDetail, DossiersList (+51 more)

### Community 7 - "PageShell and UI primitives"
Cohesion: 0.06
Nodes (53): Crumb, SearchableSelectOption, Avatar(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount() (+45 more)

### Community 8 - "Browser visual-contrast detector"
Cohesion: 0.06
Nodes (68): addBrowserFindings(), addVisualContrastFindings(), addVisualContrastResult(), analyzeVisualContrast(), analyzeVisualContrastCandidate(), blendRgba(), browserColorsClose(), browserDesignSystemConfig() (+60 more)

### Community 9 - "Live browser editing session"
Cohesion: 0.08
Nodes (71): abandonForeignSession(), abortSvelteComponentInjection(), buildInsertPlaceholderSnapshotFromDom(), buildPickedAnchorSnapshot(), cancelEditing(), cancelEditingToPicking(), cancelInsertConfigure(), captureAndEmit() (+63 more)

### Community 10 - "Live browser param panel"
Cohesion: 0.07
Nodes (70): applyParamDefaults(), applyParamValue(), applyPlaceholderDimensions(), applySavedSessionMeta(), buildParamsPanel(), clampVariantIndex(), clearHandled(), clearSession() (+62 more)

### Community 11 - "Live browser script assembly"
Cohesion: 0.06
Nodes (66): assembleLiveBrowserScript(), assertLiveBrowserScriptParts(), LIVE_BROWSER_SCRIPT_PARTS, readLiveBrowserScriptParts(), resolveLiveBrowserScriptParts(), eventPriority(), selectAvailablePendingEvent(), acknowledgePendingEvent() (+58 more)

### Community 12 - "Static HTML/CSS cascade engine"
Cohesion: 0.06
Nodes (45): mergeDesignSystemFindings(), runTextContentAnalyzers(), applyStaticDeclaration(), buildBorderOverrideMap(), buildStaticStyleMap(), buildStaticWindow(), collectStaticCssRules(), collectStaticCssText() (+37 more)

### Community 13 - "Design-system extraction"
Cohesion: 0.07
Nodes (66): addClampEndpoints(), addColorObject(), addDesignColor(), addFontSizeStep(), addRoundedScale(), addRoundedToken(), addSidecarColors(), addSidecarRadii() (+58 more)

### Community 14 - "Dossier detail tabs and menus"
Cohesion: 0.06
Nodes (63): Autorisation de versement re-scoped from échéance to règlement, DropdownMenu(), DropdownMenuContent(), DropdownMenuTrigger(), Tabs(), TabsContent(), TabsList(), tabsListVariants (+55 more)

### Community 15 - "Impeccable hook library"
Cohesion: 0.05
Nodes (60): ACK_EXTS, ADVISORY_RULES, applyConfigSource(), applyDetectorConfigSource(), applyPatchText(), canonicalPath(), canonicalPathCache, clampByte() (+52 more)

### Community 16 - "Browser antipattern config"
Cohesion: 0.06
Nodes (52): browserColorsClose(), browserDesignSystemConfig(), browserHasDirectText(), browserPrimaryFont(), browserRadiusTokens(), browserSampleText(), checkBrowserDesignSystemSources(), checkClippedOverflow() (+44 more)

### Community 17 - "Live accept and Svelte pipeline"
Cohesion: 0.07
Nodes (56): collectUnusedSelectors(), verifyAcceptedSource(), applyLegacyDeferredAcceptsOnStartup(), buildPropsScriptV2(), loadSvelteCompiler(), appendCssToSvelteStyle(), appendSanitizedCssRule(), applyDeferredSvelteComponentAccepts() (+48 more)

### Community 18 - "Configure bar chrome UI"
Cohesion: 0.07
Nodes (57): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+49 more)

### Community 19 - "Pre-edit hook enforcement"
Cohesion: 0.09
Nodes (55): bumpCursorDenial(), detectProposedHtml(), escapeRegExp(), findingSignature(), firstMatch(), firstString(), hasFragmentEditContent(), main() (+47 more)

### Community 20 - "Impeccable context directives"
Cohesion: 0.07
Nodes (53): appendAutonomyCounterDirective(), appendDetectorFallback(), appendImageGenDirective(), appendImageToolsDirective(), appendSubagentAuthorizationDirective(), appendSurfaceBriefContext(), automaticHookMode(), buildMissingTargetDirective() (+45 more)

### Community 21 - "Concept seed fixtures"
Cohesion: 0.08
Nodes (49): API_BASE, API_TIMEOUT_MS, apiBudgetMs(), dealCompositions(), driveSelection(), fetchRoll(), here, loadLocal() (+41 more)

### Community 22 - "Screenshot UMD bundle"
Cohesion: 0.09
Nodes (52): ae(), be(), bt(), Ce(), Ct(), de(), dt(), _e() (+44 more)

### Community 23 - "Detector CLI entrypoint"
Cohesion: 0.08
Nodes (42): confirm(), detectCli(), dim(), fileUrlToLocalPath(), formatAdvisorySection(), formatFindings(), formatFindingsBody(), formatFindingSummary() (+34 more)

### Community 24 - "Manual edit commit flow"
Cohesion: 0.10
Nodes (49): allEntryIds(), argVal(), buildRepairBatch(), candidatesForEntry(), changedFilesSinceSnapshot(), collectApplyOwnedFiles(), collectRollbackFiles(), commitManualEdits() (+41 more)

### Community 25 - "Live accept CLI and paths"
Cohesion: 0.09
Nodes (47): IMPECCABLE_DIR, safeSessionId(), matchesTemplateExtension(), resolveLiveTemplateExtensions(), acceptCli(), acceptReceiptPath(), argVal(), buildAcceptedWrappedSource() (+39 more)

### Community 26 - "Impeccable config loader"
Cohesion: 0.10
Nodes (47): applyDetectionConfigSource(), clampByte(), cleanIgnoreValueDisplay(), cloneDetectionConfig(), cloneRawDetectionConfig(), colorIgnoreKey(), DEFAULT_DETECTION_CONFIG, DETECTOR_CONFIG_KEYS (+39 more)

### Community 27 - "Regex text detection engine"
Cohesion: 0.08
Nodes (40): blankCssComments(), BLOCK_BRACE_PREFIX_KEYWORDS, CSS_IN_JS_EXTENSIONS, detectText(), extFromFilePath(), extractCSSinJS(), extractStyleBlocks(), findCSSinJSTemplates() (+32 more)

### Community 28 - "Doctor diagnostics"
Cohesion: 0.11
Nodes (39): resolveTargetSelection(), applyFixes(), cli(), collect(), parseArgs(), readProjectRootPatterns(), rel(), renderText() (+31 more)

### Community 29 - "Hook admin and ignore rules"
Cohesion: 0.12
Nodes (42): ACTIONS, addIgnoreFile(), addIgnoreRule(), addIgnoreValue(), DETECTOR_CONFIG_KEYS, detectorSection(), fileHasImpeccableHookMarker(), HOOK_MANIFEST_TARGETS (+34 more)

### Community 30 - "Live completion and instructions"
Cohesion: 0.10
Nodes (39): Impeccable Manual Edit Applier Agent, completionAckForAcceptResult(), completionTypeForAcceptResult(), PREVIEW_MODES_WITHOUT_SOURCE_MARKERS, acceptInstructions(), bootInstructions(), deferredWrapperInstructions(), generateInstructions() (+31 more)

### Community 31 - "Generated-file detection"
Cohesion: 0.13
Nodes (38): hasGeneratedHeader(), HEADER_MARKERS, isGeneratedFile(), isGitIgnored(), resolveSourceTraits(), argVal(), buildInsertWrapperLines(), computeInsertLine() (+30 more)

### Community 32 - "Color and glow rule checks"
Cohesion: 0.10
Nodes (40): buildHtmlPatternCorpora(), checkColors(), checkElementAIPaletteDOM(), checkElementGlow(), checkElementRadialSpotlight(), checkElementRadialSpotlightDOM(), checkGlow(), checkHoverContrast() (+32 more)

### Community 33 - "Manual apply transactions"
Cohesion: 0.12
Nodes (40): addOpToManualApplyChunk(), APPLY_EVENT_HARD_TIMEOUT_MS, APPLY_EVENT_SOFT_DEADLINE_MS, buildManualApplyAgentAction(), clearManualApplyTransaction(), collectManualApplyFiles(), compactManualApplyBatch(), compactManualApplyCandidates() (+32 more)

### Community 34 - "Design document reference"
Cohesion: 0.07
Nodes (40): .impeccable/design.json sidecar schema, DESIGN.md format (frontmatter token schema + 8 canonical sections), /impeccable document (DESIGN.md generation flow), Scan mode (auto-extract tokens then confirm language), Seed mode (pre-implementation DESIGN.md scaffold), /impeccable extract (design-system extraction flow), .impeccable/config.json (unified hook + detector config), craft-floor.md (mechanical-scan-independent design reflexes) (+32 more)

### Community 35 - "Design markdown parser"
Cohesion: 0.13
Nodes (39): assessCoverage(), buildColor(), CANONICAL_SECTIONS, collectBullets(), collectColorValues(), collectParagraphs(), detectFormat(), extractColors() (+31 more)

### Community 36 - "Icon components"
Cohesion: 0.05
Nodes (6): base, IconMessage(), IconNote(), IconPhoneIn(), IconPhoneOut(), IconProps

### Community 37 - "shadcn agent skill docs"
Cohesion: 0.13
Nodes (38): shadcn openai.yml agent interface (.agents), shadcn CLI Reference (.agents), Customization & Theming (.agents), shadcn MCP Server (.agents), Registry Authoring and Addresses (.agents), Base vs Radix rules (.agents), Chat & Messaging rules (.agents), Component Composition rules (.agents) (+30 more)

### Community 38 - "Page chat steering UI"
Cohesion: 0.11
Nodes (38): armPageChatForTyping(), buildSteerProcessingDots(), buildSteerQueueHint(), clearSteerAwaitTimer(), collapsePageChat(), expandPageChat(), finishVoiceSession(), focusPageChatInput() (+30 more)

### Community 39 - "Browser antipattern checks"
Cohesion: 0.10
Nodes (36): buildHtmlPatternCorpora(), checkColors(), checkElementGlow(), checkGlow(), checkHoverContrast(), checkHtmlPatterns(), collectCssCustomProps(), collectMarqueeKeyframes() (+28 more)

### Community 40 - "Impeccable path resolution"
Cohesion: 0.11
Nodes (30): resolveProjectRoot(), CRITIQUE_DIR, firstExisting(), getDesignSidecarCandidates(), getDesignSidecarPath(), getImpeccableDir(), getLegacyLiveAnnotationsDir(), getLegacyLiveConfigPath() (+22 more)

### Community 41 - "Manual edit DOM context"
Cohesion: 0.08
Nodes (35): addManualContextText(), applyEditing(), buildLocatorForLeaf(), canRestoreManualEditElement(), collectManualContextPieces(), contextElementForManualEdit(), copyEditContainerContext(), copyEditLeafContext() (+27 more)

### Community 42 - "Prototype domain data docs"
Cohesion: 0.08
Nodes (29): UI/UX Polish — Iterative Enhancement Workflow (skill), CLAUDE.md — Ayad Estate CRM Prototype Project Instructions, Article (lot/unit) entity, Communication (interaction log) entity, Dashboard page, Linear/Stripe Dashboard/Attio design direction, Dossier de vente (sale file) data entity, Dossiers list + detail pages (+21 more)

### Community 43 - "Live session resume"
Cohesion: 0.13
Nodes (29): getLegacyLiveSessionsDir(), getLiveSessionsDir(), collectManualApplyFiles(), manualApplyReplyCommand(), manualApplyResumeHint(), mountFailureAction(), parseArgs(), renderSummary() (+21 more)

### Community 44 - "Live browser design header"
Cohesion: 0.12
Nodes (33): agentHasWorkInFlight(), agentStatusText(), barPaletteForTheme(), brandMarkSvg(), buildDesignHeader(), cursorForInsertAxis(), designPanelCss(), detectPageTheme() (+25 more)

### Community 45 - "Element border and color checks"
Cohesion: 0.13
Nodes (32): checkBorders(), checkElementAIPaletteDOM(), checkElementBorders(), checkElementBordersDOM(), checkElementColors(), checkElementColorsDOM(), checkElementGlowDOM(), checkElementHoverContrast() (+24 more)

### Community 46 - "Copy-edit agent"
Cohesion: 0.13
Nodes (30): applyMockWrites(), buildCopyEditBatchPrompt(), checkFrameworkSourceSyntax(), chooseCopyEditAgent(), COMMAND_AUTH_CACHE, commandAuthed(), commandExists(), compactBatchForPrompt() (+22 more)

### Community 47 - "Svelte component mounting"
Cohesion: 0.11
Nodes (30): acceptedDomAlreadyClean(), applyOriginalAttrsToSvelteAnchor(), commitAcceptedSvelteComponentToDom(), componentModuleCandidates(), describeMountFailure(), detectDevServerBase(), elementMatchesOriginalMarkup(), ensureAcceptedDomClean() (+22 more)

### Community 48 - "Browser findings collection"
Cohesion: 0.09
Nodes (29): addBrowserFindings(), addVisualContrastFindings(), addVisualContrastResult(), analyzeVisualContrast(), analyzeVisualContrastCandidate(), blendRgba(), buildSelectorSegment(), clampByte() (+21 more)

### Community 49 - "Heading and quality checks"
Cohesion: 0.09
Nodes (29): checkElementOversizedH1(), checkElementOversizedH1DOM(), checkElementQuality(), checkElementQualityDOM(), checkKickerAboveHeading(), checkKickerAboveHeadingDOM(), checkKickerAboveHeadingFromDoc(), checkNumberedSectionLabels() (+21 more)

### Community 50 - "Critique snapshot storage"
Cohesion: 0.17
Nodes (22): coerceSlug(), listSnapshotsForSlug(), main(), nowFilenameStamp(), parseFrontmatter(), readLatestSnapshot(), readTrend(), serializeFrontmatter() (+14 more)

### Community 51 - "Live event validation"
Cohesion: 0.12
Nodes (26): AGENT_PHASE_SET, FORBIDDEN_MANUAL_EDIT_TEXT_CHARS, INSERT_POSITIONS, isValidId(), isValidMountVariant(), isValidVariantId(), MOUNT_ERROR_MAX_LENGTH, MOUNT_URL_MAX_LENGTH (+18 more)

### Community 52 - "Live root discovery"
Cohesion: 0.15
Nodes (27): CANDIDATE_SCAN_IGNORED, consumeTargetArg(), CONTEXT_FALLBACK_DIRS, DESIGN_NAMES, DEV_CONFIG_MARKERS, discoverAppCandidates(), enterLiveRoot(), exists() (+19 more)

### Community 53 - "Insert placeholder UI"
Cohesion: 0.09
Nodes (13): canCreateInsert(), clampPlaceholderSize(), computeInsertPosition(), groupSiblingRows(), hitSiblingInsertGap(), horizontalOverlap(), insertCreateDisabledReason(), insertLineCoords() (+5 more)

### Community 54 - "Manual edit evidence"
Cohesion: 0.15
Nodes (26): analyzeSourceHint(), buildCandidatesForOp(), buildContextHintsByRef(), buildManualEditEvidence(), collectSearchFiles(), countOps(), decodeBasicHtml(), escapeRegExp() (+18 more)

### Community 55 - "Pending apply dock"
Cohesion: 0.17
Nodes (26): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+18 more)

### Community 56 - "Discard manual edits"
Cohesion: 0.17
Nodes (22): clearAppliedEntries(), args, buffer, cwd, pageUrlFilter, remaining, compactManualLogText(), summarizeManualApplyFailures() (+14 more)

### Community 57 - "Palette and overflow checks"
Cohesion: 0.11
Nodes (25): browserFindingsFromMap(), checkCreamPalette(), checkEdgeFlushCardsDOM(), checkElementBlinkingCursorDOM(), checkElementTextOverflowDOM(), checkEmDashOveruse(), checkEmDashOveruseDOM(), checkFirstViewportColumnOverflowDOM() (+17 more)

### Community 58 - "TypeScript app config"
Cohesion: 0.08
Nodes (24): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+16 more)

### Community 59 - "Dossier status stepper"
Cohesion: 0.12
Nodes (18): CONFIANCE_TONE, ConfirmPopoverBody(), DossierStatusStepper(), Popover(), PopoverClose(), PopoverContent(), PopoverTrigger(), Textarea() (+10 more)

### Community 60 - "Browser URL detector"
Cohesion: 0.19
Nodes (20): createBrowserDetector(), detectUrl(), launchBrowser(), measureContentHiddenAfterReveal(), runVisualContrastFallback(), serializeDesignSystemForBrowser(), captureVisualContrastCandidate(), compareScreenshotContrast() (+12 more)

### Community 61 - "Live accept CSS baking"
Cohesion: 0.20
Nodes (23): bakeParamValues(), collectAllSelectors(), collectSelectorsFromNodes(), escapeRegExp(), formatBody(), isToggleOn(), normalizeSelector(), normalizeToggleForVar() (+15 more)

### Community 62 - "Svelte AST analysis"
Cohesion: 0.21
Nodes (20): Analysis, analyzeAttributes(), analyzeFragment(), analyzeNode(), analyzeSvelteMarkup(), applyReplacements(), classifyEachKey(), classifyRoots() (+12 more)

### Community 63 - "SvelteKit adapter"
Cohesion: 0.18
Nodes (20): applySvelteKitLiveAdapter(), buildSvelteLiveRootComponent(), defaultSvelteLayout(), detectSvelteKitProject(), ensureSvelteLiveRootComponent(), escapeRegExp(), fileIncludes(), findSvelteKitAppHtml() (+12 more)

### Community 64 - "TanStack Start adapter"
Cohesion: 0.16
Nodes (20): tanstackStart, applyTanStackLiveAdapter(), buildTanStackLiveRootComponent(), detectTanStackStartProject(), escapeRegExp(), findRootRouteFile(), insertAfterLastImport(), isManagedComponent() (+12 more)

### Community 65 - "shadcn components config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 66 - "Runtime dependencies"
Cohesion: 0.10
Nodes (21): @base-ui/react, class-variance-authority, @fontsource-variable/geist, lucide-react, dependencies, @base-ui/react, class-variance-authority, @fontsource-variable/geist (+13 more)

### Community 67 - "Framework injection journal"
Cohesion: 0.18
Nodes (20): describeInjectArtifacts(), frameworkIgnorePatterns(), resolveFramework(), clearInjectJournal(), recordInjection(), removeTag(), revertCspMeta(), unpatchTagFile() (+12 more)

### Community 68 - "ESLint dev dependencies"
Cohesion: 0.10
Nodes (21): eslint, @eslint/js, eslint-plugin-react-hooks, globals, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+13 more)

### Community 69 - "Sidebar primitive"
Cohesion: 0.12
Nodes (9): Sidebar(), SidebarContext, SidebarContextProps, SidebarMenuButton(), sidebarMenuButtonVariants, SidebarRail(), SidebarTrigger(), useSidebar() (+1 more)

### Community 70 - "Node TypeScript config"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 71 - "Confirm and alert dialogs"
Cohesion: 0.15
Nodes (14): ConfirmProvider(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader() (+6 more)

### Community 72 - "Impeccable reference flows"
Cohesion: 0.27
Nodes (19): Adapt Command (Web), Adapt Command (Native), Android Platform Reference, Animate Command, Audit Command (Web), Audit Command (Native), Bolder Command, Clarify Command (+11 more)

### Community 73 - "Live server accept verify"
Cohesion: 0.20
Nodes (16): readLiveServerInfo(), FORBIDDEN, verifyAcceptedFile(), completeCli(), completeThroughServer(), parseArgs(), readServerInfo(), __dirname (+8 more)

### Community 74 - "Deep staleness checks"
Cohesion: 0.19
Nodes (18): checkDesignCoverage(), checkDesignDrift(), checkDetectorIgnores(), checkHookInstallation(), checkLegacyLiveState(), collectHookCommands(), finding(), git() (+10 more)

### Community 75 - "Project root detection"
Cohesion: 0.14
Nodes (18): contextSourcePath(), contextSourceStatus(), findMonorepoRoot(), firstExisting(), hasGitBoundary(), isCandidateProjectRoot(), isPathInside(), isPathInsideOrEqual() (+10 more)

### Community 76 - "Target candidate discovery"
Cohesion: 0.18
Nodes (18): directChildDirs(), discoverRootsForPattern(), discoverTargetCandidates(), expandSimplePattern(), findTargetExample(), hasFallbackWorkspaceChildren(), isExcludedByWorkspacePattern(), isIgnoredWorkspaceDiscoveryDir() (+10 more)

### Community 77 - "Context signals loading"
Cohesion: 0.21
Nodes (15): extractPlatform(), hasVisualImplementation(), loadContext(), cli(), COMMON_DEV_PORTS, devServerSignals(), gatherSignals(), gitSignals() (+7 more)

### Community 78 - "Steer chat focus guard"
Cohesion: 0.21
Nodes (17): attachSteerFocusDebug(), attachSteerFocusGuard(), clearSteerFocusRecoverTimer(), focusConfigureInput(), focusSteerChat(), isInlineEditActive(), isPageEditableActive(), isPageEditableElement() (+9 more)

### Community 79 - "Annotation pin editing"
Cohesion: 0.20
Nodes (17): beginEditPin(), buildAnnotationsForCapture(), buildPinElement(), cancelEditingPin(), clampPlaceholderSize(), finalizeEditingPin(), initAnnotOverlay(), localCoords() (+9 more)

### Community 80 - "Astro framework detection"
Cohesion: 0.27
Nodes (13): astro, detectAstroProject(), fileExists(), findConfigFile(), firstExistingFile(), hasAnyDependency(), literalConfigFiles(), readPackageDeps() (+5 more)

### Community 81 - "Modal and module switcher"
Cohesion: 0.19
Nodes (7): ModuleSwitcher(), Dialog(), DialogContent(), DialogHeader(), DialogTitle(), APP_MODULES, AppModule

### Community 82 - "Asset producer and embed"
Cohesion: 0.14
Nodes (12): impeccable-asset-producer agent, Impeccable Asset Producer Agent, visualize.md — Direction Comps & Asset Production, Implementation Medium Gate (raster vs vector rule), args, buf, crc32(), crcTable (+4 more)

### Community 83 - "Image generation script"
Cohesion: 0.18
Nodes (12): crc32(), hash32(), hslToRgb(), out, palette(), pngChunk(), pngFake(), promptFile (+4 more)

### Community 84 - "Question serving script"
Cohesion: 0.18
Nodes (13): answerFile(), esc(), loadRound(), localImages, nextFile(), page(), payloadPath, portArg (+5 more)

### Community 85 - "Calendrier page"
Cohesion: 0.23
Nodes (15): Calendrier, getEvenementsCalendrier(), isVisiteEvenement(), usePreview(), addDays(), addMonths(), buildGrid(), Calendrier() (+7 more)

### Community 86 - "Framework tag strategy"
Cohesion: 0.22
Nodes (14): appendOriginToDirective(), buildTagBlock(), commentClose(), commentOpen(), detectLineEnding(), findCspMetaTags(), getAttr(), insertTag() (+6 more)

### Community 87 - "Live routing reference"
Cohesion: 0.15
Nodes (13): ios.md (referenced), live command (referenced, web-only), live.md Signature Params Contract (referenced), new-work.md (referenced), routing.md — No-Argument Routing Menu, Context-Aware Menu Logic, shape.md — Shape Mode (Discovery), Discovery Interview Cadence (+5 more)

### Community 89 - "Feature instruction specs"
Cohesion: 0.19
Nodes (13): /clients Page (referenced existing screen), FEATURE-changement-statut.md — Dossier Status Stepper, Horizontal Pipeline Stepper (non-linear transitions), StatutDossier TypeScript Type, TRANSITIONS_VALIDES Lookup Table, FEATURE-transformation-prospect.md — Pré-Prospection → Prospection, Dual-Condition Qualification Rule (prospect + commercial both required), New /prospects List Screen (+5 more)

### Community 90 - "Craft floor and operate rules"
Cohesion: 0.15
Nodes (13): Craft Floor (Quality Checklist), Craft Floor Refuse List (Category Defaults to Reject), Impeccable Finish Reviewer Agent, operate.md — Operate Mode Depth Reference, Earned Familiarity Principle, The Product Slop Test, overdrive.md — Overdrive Mode, Propose Before Building (+5 more)

### Community 91 - "Gradient and position parsing"
Cohesion: 0.24
Nodes (13): firstCssUrl(), getLayerValue(), loadVisualContrastImage(), parseObjectPosition(), parsePositionPair(), parsePositionToken(), pointToImageSource(), resolveObjectImageRect() (+5 more)

### Community 92 - "Finding ignore filtering"
Cohesion: 0.26
Nodes (13): cleanIgnoreValueDisplay(), extractFindingIgnoreValue(), extractFindingIgnoreValueRaw(), extractMotionIgnoreValue(), filterFindings(), findingMatchesScopedIgnoreFile(), formatFindingIgnoreCommand(), isAdvisoryFinding() (+5 more)

### Community 93 - "Framework inject journal"
Cohesion: 0.27
Nodes (12): PATCH_UNDOERS, healArtifact(), healInjectJournal(), INJECT_JOURNAL_RELPATH, INJECT_JOURNAL_VERSION, injectJournalPath(), insideProject(), normalizeRel() (+4 more)

### Community 94 - "Harness pin script"
Cohesion: 0.22
Nodes (11): CODEX_HARNESSES, commandPrefixForSkillsDir(), __dirname, findHarnessDirs(), generatePinnedSkill(), HARNESS_DIRS, loadCommandMetadata(), pin() (+3 more)

### Community 95 - "Advanced filters doc"
Cohesion: 0.21
Nodes (13): docs/api-docsV4.json (OpenAPI snapshot), Panneau de filtres avancés — Dossiers de vente, Captures de référence de l'ancien Omran fournies par le métier, Offres — liste globale cross-prospections (GET /api/devis), Filtre par période (champDate + dateDebut/dateFin), Filtres avancés — Prospections / Pré-prospections / Prospects, Repeatable query parameter convention (?statut=A&statut=B), Filtre par Tranche (vs Entité/Projet) — demande backend (+5 more)

### Community 96 - "Theme toggle and branding"
Cohesion: 0.19
Nodes (11): index.html — App Entry (Ayad Développement CRM), Pre-paint Theme Flash Prevention Script, Ayad Développement brand commitments (logo, accent color), README.md — Vite React TypeScript Template, ThemeToggle(), getInitialTheme(), Theme, ThemeContext (+3 more)

### Community 98 - "Live UI DOM helpers"
Cohesion: 0.23
Nodes (10): createLiveBrowserDomHelpers(), activeElementDeep(), appendStyleToLiveUiRoot(), appendToLiveUiRoot(), escapeCssIdent(), getLiveUiElementById(), LIVE_CHROME_MOUNT_CONTRACT, LIVE_UI_COMPONENT_IDS (+2 more)

### Community 99 - "Framework registry"
Cohesion: 0.18
Nodes (10): COMMENT_SYNTAXES, FRAMEWORKS, INJECT_KINDS, PREVIEW_MODES, SOURCE_TRAIT_DEFAULTS, STYLE_MODES, TAG_PATCH_KIND, staticHtml (+2 more)

### Community 100 - "Generation preflight"
Cohesion: 0.30
Nodes (10): buildGenerationPreflight(), compactError(), execFileAsync, insertTarget(), normalizeTarget(), replaceTarget(), runGenerationPreflight(), sourceResolutionCache (+2 more)

### Community 101 - "Layout and sidebar shell"
Cohesion: 0.18
Nodes (11): Layout(), SidebarContent(), SidebarFooter(), SidebarGroup(), SidebarGroupLabel(), SidebarHeader(), SidebarInset(), SidebarMenu() (+3 more)

### Community 102 - "Onboarding reference"
Cohesion: 0.18
Nodes (11): onboard.md — Onboarding Mode Reference, Empty State Design, Guided Tours & Walkthroughs, Onboarding Mode: Time-to-Value Design, Show, Don't Tell Principle, optimize.md — Performance Optimization Mode, Core Web Vitals (LCP/INP/CLS), Measure Before You Optimize (+3 more)

### Community 103 - "CSP detection"
Cohesion: 0.20
Nodes (10): detectCsp(), INLINE_HEADER_SIGNALS, LAYOUT_EXTS, MONOREPO_HELPER_SIGNALS, NUXT_ROUTE_RULES_SIGNALS, NUXT_SECURITY_SIGNALS, SCAN_EXTS, SKIP_DIRS (+2 more)

### Community 104 - "Text occlusion checks"
Cohesion: 0.22
Nodes (11): checkTextOcclusionDOM(), clippedByInset(), clippedByRect(), elementDirectText(), expandBoxShorthand(), firstMetricLengthPx(), isLayeredElement(), isOpaqueDecoratedBox() (+3 more)

### Community 105 - "Hook finding budget"
Cohesion: 0.24
Nodes (11): cursorBlockMessage(), clampGroupedToBudget(), clampToBudget(), directiveFooter(), formatFindingLine(), quoteCommandArg(), relativize(), renderCleanAck() (+3 more)

### Community 106 - "Palette generation script"
Cohesion: 0.24
Nodes (7): args, buildWeights(), hashUnit(), pickSeed(), seed, SEEDS, weightedPick()

### Community 107 - "Sheet primitive"
Cohesion: 0.18
Nodes (5): Sheet(), SheetContent(), SheetDescription(), SheetHeader(), SheetTitle()

### Community 108 - "Staleness notice cache"
Cohesion: 0.38
Nodes (9): appendStalenessDirective(), buildStalenessDirective(), cachePath(), filterFreshFindings(), pruneCache(), readCache(), readJson(), stalenessCheckDisabled() (+1 more)

### Community 109 - "Inline ignore directives"
Cohesion: 0.40
Nodes (9): addRules(), applyInlineIgnores(), getSet(), hasDirectives(), isInlineIgnored(), normalizeRule(), parseInlineIgnores(), parseRuleList() (+1 more)

### Community 110 - "Contrast check script"
Cohesion: 0.31
Nodes (8): check(), css, lin(), lum(), over(), parseColor(), ratio(), ROOT

### Community 111 - "Nuxt adapter"
Cohesion: 0.31
Nodes (7): applyNuxtLiveAdapter(), buildNuxtPlugin(), nuxt, NUXT_PLUGIN_MARKER, NUXT_PLUGIN_NAME, removeNuxtLiveAdapter(), buildLiveScriptSrc()

### Community 112 - "Border shadow checks"
Cohesion: 0.32
Nodes (8): borderColorsFromStyle(), borderWidthsFromStyle(), checkElementGptBorderShadow(), checkElementGptBorderShadowDOM(), checkGptThinBorderWideShadow(), cssColorAlpha(), shadowLayerAlpha(), shadowMaxBlurPx()

### Community 113 - "Radial spotlight checks"
Cohesion: 0.32
Nodes (8): checkElementRadialSpotlight(), checkElementRadialSpotlightDOM(), checkRadialSpotlight(), elementGradientValue(), parseColorMix(), parseRadialGradientStops(), splitTopLevelCommas(), spotlightLabel()

### Community 114 - "Hook entry and audit log"
Cohesion: 0.39
Nodes (7): allow(), deny(), done(), isStopEvent(), writeAuditLog(), main(), readStdin()

### Community 115 - "Template extension cache"
Cohesion: 0.36
Nodes (6): extensionCache, LIVE_TEMPLATE_EXTENSIONS, mergeExtensions(), normalizeExtensionEntries(), readLiveTemplateExtensions(), safeReadJson()

### Community 116 - "npm scripts"
Cohesion: 0.29
Nodes (7): scripts, build, check:contrast, dev, docs:update, lint, preview

### Community 117 - "Omran pre-prospection screens"
Cohesion: 0.33
Nodes (6): Créer Prospect Button, Notes Field Containing Free-Text Budget Data, Omran Estate - Pré-Prospection Detail Popup (Code 50), Omran Estate - Pré-Prospections List View, Transformer en prospection Button, Omran Estate Vente Module Sidebar Navigation

### Community 118 - "Omran prospection transform"
Cohesion: 0.47
Nodes (6): "Général" Tab Form (Titre/Sexe/Nom/Prénom/Mobile/Email etc.), Permanent Record Code Field (e.g. 26/14424), Prospect Contact Record (Omran legacy entity), Related-Module Tabs (Prospections/Dossiers/Recettes/Dépenses/Règlements/Historique), Omran Prospect Detail Screenshot (Saved: Elbaz ELBAZ), Legacy Windows Forms Dense Multi-Tab Modal Pattern

### Community 119 - "API docs update script"
Cohesion: 0.40
Nodes (5): BACKUP_PATH, __dirname, getArgUrl(), main(), TARGET_PATH

### Community 120 - "Package metadata"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 121 - "Tooltip primitive"
Cohesion: 0.40
Nodes (3): Tooltip(), TooltipContent(), TooltipTrigger()

### Community 122 - "Root TypeScript config"
Cohesion: 0.40
Nodes (4): compilerOptions, paths, files, references

### Community 123 - "Impeccable provider ids"
Cohesion: 0.50
Nodes (3): IMPECCABLE_COMMAND, IMPECCABLE_COMMAND_PREFIX, IMPECCABLE_PROVIDER_ID

### Community 124 - "Motion and type scale rules"
Cohesion: 0.67
Nodes (3): prefers-reduced-motion global block, Semantic type scale (--text-micro/body/label/title/page/hero), Verify compiled dist CSS, not just source

## Ambiguous Edges - Review These
- `/impeccable document (DESIGN.md generation flow)` → `shape.md (task-brief interview flow)`  [AMBIGUOUS]
  .claude/skills/impeccable/reference/document.md · relation: references
- `craft-floor.md (contrast/spacing/type floors applied during live generation)` → `new-work flow (new visual work / identity replacement)`  [AMBIGUOUS]
  .claude/skills/impeccable/reference/new-work.md · relation: references
- `shadcn MCP Server (.agents)` → `shadcn/ui SKILL.md (.agents)`  [AMBIGUOUS]
  .agents/skills/shadcn/SKILL.md · relation: conceptually_related_to
- `shadcn MCP Server (.claude)` → `shadcn/ui SKILL.md (.claude)`  [AMBIGUOUS]
  .claude/skills/shadcn/SKILL.md · relation: conceptually_related_to
- `README.md — Vite React TypeScript Template` → `index.html — App Entry (Ayad Développement CRM)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **468 isolated node(s):** `ConfirmContextValue`, `IconProps`, `Theme`, `ThemeContextValue`, `ANIMATION_VALUE_KEYWORDS` (+463 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `/impeccable document (DESIGN.md generation flow)` and `shape.md (task-brief interview flow)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `craft-floor.md (contrast/spacing/type floors applied during live generation)` and `new-work flow (new visual work / identity replacement)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `shadcn MCP Server (.agents)` and `shadcn/ui SKILL.md (.agents)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `shadcn MCP Server (.claude)` and `shadcn/ui SKILL.md (.claude)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `README.md — Vite React TypeScript Template` and `index.html — App Entry (Ayad Développement CRM)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `createManualEditRoutes()` connect `Discard manual edits` to `Live browser script assembly`, `Static HTML/CSS cascade engine`, `Live event validation`, `Manual edit evidence`, `Manual edit commit flow`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **Why does `confirm()` connect `Detector CLI entrypoint` to `Confirm and alert dialogs`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._