# Graph Report - crm-prototype  (2026-09-02)

## Corpus Check
- 313 files · ~606,492 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4124 nodes · 11501 edges · 137 communities (123 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- API client layer
- List pages and table UI
- Detector rule checks
- Live browser overlay core
- Forms and référentiels
- Dossier detail and documents
- Shared UI primitives
- Injected browser detector
- Live server and SSE
- App routing and auth pages
- Live browser toolbar events
- Live session and variants
- Static HTML/CSS cascade
- Design-system extraction
- Detector CLI context
- Browser anti-pattern scan
- Svelte component injection
- Hook library and config
- Live browser row builders
- Concept seed catalogs
- Screenshot bundle (vendored)
- Detector CLI entrypoint
- Sidebar and layout shell
- Manual edit commit flow
- Impeccable config store
- Hook admin configuration
- Regex text detector
- Before-edit hook cache
- Live wrap and insert
- Live poll instructions
- CSS pattern scanners
- Manual apply transactions
- New-work and live docs
- DESIGN.md parser
- Live accept flow
- Live roots resolution
- App icon set
- shadcn skill rules
- Page chat and voice
- Doctor and staleness checks
- Manual edit DOM mapping
- Product domain notes
- Global bar and theming
- DOM color checks
- Hook run orchestration
- Copy-edit batch agent
- Svelte variant mounting
- Impeccable paths and locks
- Live event validation
- Live session store
- Insert placement UI
- Manual edit evidence
- Browser CSS scanners
- Pending apply UI state
- Manual edits buffer routes
- Browser finding collection
- Boot staleness artifacts
- App TypeScript config
- URL detector and profiler
- Accept CSS baking
- Svelte AST analysis
- Calendrier and preview
- Dossier status stepper
- Visual contrast analysis
- SvelteKit live adapter
- TanStack live adapter
- shadcn components config
- Runtime dependencies
- Kicker and eyebrow checks
- Live script injection
- Dev dependencies
- Node TypeScript config
- Confirm dialog stack
- Impeccable command reference
- Color and glow checks
- Context signal gathering
- Border and shadow quality
- Steer chat focus guard
- Annotation pin overlay
- Framework detection utils
- Asset prompt embedding
- Workspace target discovery
- Image generation stub
- Surface brief resolution
- Question serving page
- Project context resolution
- Template extension search
- CSP tag strategy
- Live status and resume
- Theme provider and entry
- Routing and typeset docs
- Static element wrapper
- Dossier status feature specs
- Craft floor and overdrive
- Background image sampling
- Finding ignore filters
- Inject journal healing
- Skill pinning
- Advanced filters and spec sync
- Dropdown menu primitives
- Critique snapshot storage
- Live UI DOM helpers
- Framework adapter registry
- Polish and onboarding docs
- Staleness notices
- CSP detection
- Text occlusion checks
- Generation preflight
- Palette seeding
- Inline ignore directives
- Contrast check script
- Nuxt live adapter
- Live target arguments
- npm scripts
- Legacy pré-prospection screens
- Legacy prospect detail screen
- OpenAPI docs sync script
- Searchable select combobox
- Card and layout checks
- Package manifest
- Root TypeScript config
- Stop hook entry
- Design token session notes
- Vite env types
- Harden command docs
- clsx dependency
- react-refresh eslint plugin
- shadcn dependency
- Tailwind vite plugin
- React DOM types
- React vite plugin
- Vite configuration
- Documenter agent doc
- Legacy prospect creation screen
- Legacy prospection-to-dossier screen

## God Nodes (most connected - your core abstractions)
1. `request()` - 132 edges
2. `cn()` - 102 edges
3. `useApi()` - 72 edges
4. `formatDate()` - 53 edges
5. `Button()` - 51 edges
6. `formatCurrency()` - 50 edges
7. `parseAnyColor()` - 37 edges
8. `runHook()` - 37 edges
9. `collectBrowserFindings()` - 36 edges
10. `parseAnyColor()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `useDebouncedValue()` --semantically_similar_to--> `Client-side multi-statut fan-out + merge workaround`  [INFERRED] [semantically similar]
  src/lib/useApi.ts → docs/filtres-avances.md
- `Active-filter chips (filter state invisible once set)` --conceptually_related_to--> `ProspectionFilterBar()`  [INFERRED]
  SESSION_MEMORY.md → src/components/ProspectionFilterBar.tsx
- `11-value Dossier Statut progression pipeline` --semantically_similar_to--> `Derived dossier display-status utility (from milestone dates)`  [INFERRED] [semantically similar]
  instructions/FIX-mock-actions-state.md → CLAUDE.md
- `Active-filter chips (filter state invisible once set)` --conceptually_related_to--> `hasActiveProspectionFilters()`  [INFERRED]
  SESSION_MEMORY.md → src/lib/domain.tsx
- `Filtres avancés — Prospections / Pré-prospections / Prospects` --implements--> `ProspectionFilterBar()`  [EXTRACTED]
  docs/filtres-avances.md → src/components/ProspectionFilterBar.tsx

## Import Cycles
- 1-file cycle: `src/components/ui.tsx -> src/components/ui.tsx`

## Hyperedges (group relationships)
- **Autorisation de versement re-scope: spec diff → api.ts URL → button relocation** — docs_api_docsv4, session_memory_spec_first_diff_workflow, session_memory_autorisation_versement_rescope, src_lib_api_fetchautorisationversementblob, src_pages_dossiers_dossierdetail_autorisationversementbutton [EXTRACTED 1.00]
- **SKILL.md Critical Rules enforced across rule files** — agents_skills_shadcn_skill, agents_skills_shadcn_rules_styling, agents_skills_shadcn_rules_forms, agents_skills_shadcn_rules_composition, agents_skills_shadcn_rules_icons, agents_skills_shadcn_rules_chat, agents_skills_shadcn_rules_base_vs_radix [EXTRACTED 1.00]
- **Dossier detail page field-group enrichment (pricing, milestones, relances)** — instructions_fix_missing_data_fields_dossier_pricing, instructions_fix_missing_data_fields_milestones, instructions_fix_missing_data_fields_relances, claude_dossier_entity [EXTRACTED 1.00]
- **Live-mode session lifecycle scripts (setup, poll, wrap, accept, recovery)** — claude_skills_impeccable_reference_live_setup_liveconfig, claude_skills_impeccable_reference_live_livepollscript, claude_skills_impeccable_reference_live_livewrapscript, claude_skills_impeccable_reference_live_liveacceptscript, claude_skills_impeccable_reference_live_liveresumescript, claude_skills_impeccable_reference_live_liveserverscript [EXTRACTED 1.00]
- **SKILL.md Commands Table Enumerating Sub-Command References** — claude_skills_impeccable_skill, claude_skills_impeccable_reference_adapt, claude_skills_impeccable_reference_animate, claude_skills_impeccable_reference_audit, claude_skills_impeccable_reference_bolder, claude_skills_impeccable_reference_clarify, claude_skills_impeccable_reference_colorize, claude_skills_impeccable_reference_craft, claude_skills_impeccable_reference_critique, claude_skills_impeccable_reference_delight, claude_skills_impeccable_reference_distill, claude_skills_impeccable_reference_doctor [EXTRACTED 1.00]
- **Impeccable Modes Converging on Polish as Final Pass** — claude_skills_impeccable_reference_onboard, claude_skills_impeccable_reference_optimize, claude_skills_impeccable_reference_quieter, claude_skills_impeccable_reference_typeset, claude_skills_impeccable_reference_polish [EXTRACTED 1.00]
- **Web Commands Routing to Native Variant Which Defers to Platform References** — claude_skills_impeccable_reference_adapt, claude_skills_impeccable_reference_adapt_native, claude_skills_impeccable_reference_audit, claude_skills_impeccable_reference_audit_native, claude_skills_impeccable_reference_animate, claude_skills_impeccable_reference_android [EXTRACTED 1.00]
- **Commands That Hand Off to /impeccable polish as Final Step** — claude_skills_impeccable_reference_adapt, claude_skills_impeccable_reference_adapt_native, claude_skills_impeccable_reference_animate, claude_skills_impeccable_reference_audit, claude_skills_impeccable_reference_audit_native, claude_skills_impeccable_reference_bolder, claude_skills_impeccable_reference_clarify, claude_skills_impeccable_reference_colorize, claude_skills_impeccable_reference_critique, claude_skills_impeccable_reference_delight, claude_skills_impeccable_reference_distill [EXTRACTED 1.00]
- **List-page convention: debounce + stale-while-revalidating + branched empty states** — src_lib_useapi_usedebouncedvalue, src_lib_useapi_useapi, src_components_ui_resultsregion, src_components_ui_emptystate, src_lib_domain_hasactiveprospectionfilters, session_memory_stale_while_revalidating_list_convention [EXTRACTED 1.00]
- **Offres globales: GET /api/devis + DevisDto prospection link + page total** — docs_filtres_avances_offres_globale, src_lib_api_listoffres, src_types_devisdto, docs_filtres_avances_page_only_total, src_pages_prospections_offreslist_offreslist [EXTRACTED 1.00]
- **Preset switching workflow (overwrite/merge/skip) described across SKILL.md, cli.md, customization.md** — agents_skills_shadcn_skill, agents_skills_shadcn_cli, agents_skills_shadcn_customization, concept_preset_system [EXTRACTED 1.00]
- **Routing Menu's Signal-Gathering Script Pipeline** — claude_skills_impeccable_reference_routing, claude_skills_impeccable_scripts_context, claude_skills_impeccable_scripts_context_signals, claude_skills_impeccable_scripts_detect [EXTRACTED 1.00]
- **Dossier creation wizard + status progression system** — instructions_feature_plan_financement_entity, instructions_fix_mock_actions_state_dossier_status_pipeline, claude_dossier_entity, claude_status_derivation [INFERRED 0.75]
- **Design detector hook tiering: per-edit mechanical scan, Stop-event deep pass, craft-floor manual reflexes** — claude_skills_impeccable_reference_hooks_hooks, claude_skills_impeccable_reference_hooks_hookadminscript, claude_skills_impeccable_reference_hooks_craftfloor_ref, claude_skills_impeccable_reference_layout_detectscript [INFERRED 0.75]
- **Duplicate shadcn skill installed under .agents and .claude skill directories** — agents_skills_shadcn_skill, agents_skills_shadcn_cli, agents_skills_shadcn_customization, claude_skills_shadcn_skill, claude_skills_shadcn_cli, claude_skills_shadcn_customization [INFERRED 0.85]
- **Pré-Prospection → Prospection → Dossier pipeline flow** — claude_prospection_entity, claude_dossier_entity, instructions_fix_prospection_pipeline_stage_gate, instructions_fix_mock_actions_state_transitions, product_pipeline_workflow [INFERRED 0.85]
- **Visual authority record chain: init (PRODUCT.md) -> new-work (world/direction) -> document (DESIGN.md/sidecar)** — claude_skills_impeccable_reference_init_initflow, claude_skills_impeccable_reference_init_productmd, claude_skills_impeccable_reference_new_work_newworkflow, claude_skills_impeccable_reference_document_document, claude_skills_impeccable_reference_document_designmd_format [INFERRED 0.85]
- **Dossier de Vente Status/Financement Workflow Documentation Set** — instructions_feature_changement_statut, instructions_feature_transformation_prospect, instructions_fix_dossier_vente_corrections, instructions_feature_plan_financement [INFERRED 0.90]

## Communities (137 total, 14 thin omitted)

### Community 0 - "API client layer"
Cohesion: 0.02
Nodes (199): RFC-7807, Retrait de DevisDto.prix (champ inexistant dans le schéma réel), addProspectContact(), addProspectionAutreTranche(), addProspectionCategorie(), addProspectionProfil(), addProspectionTypeBien(), addProspectionVille() (+191 more)

### Community 1 - "List pages and table UI"
Cohesion: 0.06
Nodes (116): DevisPageDto.sommePrixVenteTTCPage — total de la page seulement, Client-side multi-statut fan-out + merge workaround, Active-filter chips (filter state invisible once set), Scripted multi-file rewrite pitfalls (CRLF, regex variants), Shared-primitive-first leverage principle, PageShell owns the page's only <h1>, Stale-while-revalidating list-page convention, ui-ux-pro-max --design-system misroutes on real-estate industry keyword (+108 more)

### Community 2 - "Detector rule checks"
Cohesion: 0.03
Nodes (141): ANIMATION_VALUE_KEYWORDS, borderColorsFromStyle(), borderWidthsFromStyle(), checkBorders(), checkClippedOverflow(), checkCreamPalette(), checkEdgeFlushCardsDOM(), checkElementBlinkingCursorDOM() (+133 more)

### Community 3 - "Live browser overlay core"
Cohesion: 0.03
Nodes (132): applyGlobalBarLabelState(), applyPlaceholderSizingStyles(), averageRgb01(), bindEditBadgeProxy(), bufferToBase64(), buildCollapsible(), buildColorModels(), buildListHtml() (+124 more)

### Community 4 - "Forms and référentiels"
Cohesion: 0.05
Nodes (102): ArticlesList, NewDossier, ArticleCompactPreview(), ArticleResultsList(), CreateProspectForm(), CreateProspectInitial, DevisFormSection(), RefSelect() (+94 more)

### Community 5 - "Dossier detail and documents"
Cohesion: 0.04
Nodes (98): Autorisation de versement re-scoped from échéance to règlement, ConfirmPopoverBody(), DropdownMenu(), DropdownMenuContent(), DropdownMenuTrigger(), Tabs(), TabsContent(), TabsList() (+90 more)

### Community 6 - "Shared UI primitives"
Cohesion: 0.05
Nodes (60): ComingSoon, NotFound, ModuleSwitcher(), Crumb, SearchSelectOption, Avatar(), AvatarBadge(), AvatarFallback() (+52 more)

### Community 7 - "Injected browser detector"
Cohesion: 0.06
Nodes (68): addBrowserFindings(), addVisualContrastFindings(), addVisualContrastResult(), analyzeVisualContrast(), analyzeVisualContrastCandidate(), blendRgba(), browserColorsClose(), browserDesignSystemConfig() (+60 more)

### Community 8 - "Live server and SSE"
Cohesion: 0.06
Nodes (67): assembleLiveBrowserScript(), assertLiveBrowserScriptParts(), LIVE_BROWSER_SCRIPT_PARTS, readLiveBrowserScriptParts(), resolveLiveBrowserScriptParts(), eventPriority(), selectAvailablePendingEvent(), acknowledgePendingEvent() (+59 more)

### Community 9 - "App routing and auth pages"
Cohesion: 0.07
Nodes (55): ArticleDetail, AuthGate(), ClientsList, Dashboard, DossierDetail, DossiersList, EncaissementDetail, EncaissementsList (+47 more)

### Community 10 - "Live browser toolbar events"
Cohesion: 0.08
Nodes (71): abandonForeignSession(), abortSvelteComponentInjection(), buildInsertPlaceholderSnapshotFromDom(), buildPickedAnchorSnapshot(), cancelEditing(), cancelEditingToPicking(), cancelInsertConfigure(), captureAndEmit() (+63 more)

### Community 11 - "Live session and variants"
Cohesion: 0.07
Nodes (70): applyParamDefaults(), applyParamValue(), applyPlaceholderDimensions(), applySavedSessionMeta(), buildParamsPanel(), clampVariantIndex(), clearHandled(), clearSession() (+62 more)

### Community 12 - "Static HTML/CSS cascade"
Cohesion: 0.06
Nodes (45): mergeDesignSystemFindings(), runTextContentAnalyzers(), applyStaticDeclaration(), buildBorderOverrideMap(), buildStaticStyleMap(), buildStaticWindow(), collectStaticCssRules(), collectStaticCssText() (+37 more)

### Community 13 - "Design-system extraction"
Cohesion: 0.07
Nodes (66): addClampEndpoints(), addColorObject(), addDesignColor(), addFontSizeStep(), addRoundedScale(), addRoundedToken(), addSidecarColors(), addSidecarRadii() (+58 more)

### Community 14 - "Detector CLI context"
Cohesion: 0.06
Nodes (58): appendAutonomyCounterDirective(), appendDetectorFallback(), appendImageGenDirective(), appendImageToolsDirective(), appendSubagentAuthorizationDirective(), appendSurfaceBriefContext(), automaticHookMode(), buildMissingTargetDirective() (+50 more)

### Community 15 - "Browser anti-pattern scan"
Cohesion: 0.06
Nodes (53): browserColorsClose(), browserDesignSystemConfig(), browserHasDirectText(), browserPrimaryFont(), browserRadiusTokens(), browserSampleText(), buildSelectorSegment(), checkBrowserDesignSystemSources() (+45 more)

### Community 16 - "Svelte component injection"
Cohesion: 0.07
Nodes (57): collectUnusedSelectors(), verifyAcceptedSource(), buildPropsScriptV2(), loadSvelteCompiler(), appendCssToSvelteStyle(), appendSanitizedCssRule(), applyDeferredSvelteComponentAccepts(), bakeParamValuesInCss() (+49 more)

### Community 17 - "Hook library and config"
Cohesion: 0.05
Nodes (56): ACK_EXTS, ADVISORY_RULES, applyConfigSource(), applyDetectorConfigSource(), applyPatchText(), canonicalPathCache, clampByte(), clampToBudget() (+48 more)

### Community 18 - "Live browser row builders"
Cohesion: 0.07
Nodes (57): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+49 more)

### Community 19 - "Concept seed catalogs"
Cohesion: 0.08
Nodes (49): API_BASE, API_TIMEOUT_MS, apiBudgetMs(), dealCompositions(), driveSelection(), fetchRoll(), here, loadLocal() (+41 more)

### Community 20 - "Screenshot bundle (vendored)"
Cohesion: 0.09
Nodes (52): ae(), be(), bt(), Ce(), Ct(), de(), dt(), _e() (+44 more)

### Community 21 - "Detector CLI entrypoint"
Cohesion: 0.08
Nodes (42): confirm(), detectCli(), dim(), fileUrlToLocalPath(), formatAdvisorySection(), formatFindings(), formatFindingsBody(), formatFindingSummary() (+34 more)

### Community 22 - "Sidebar and layout shell"
Cohesion: 0.06
Nodes (29): Sheet(), SheetContent(), SheetDescription(), SheetHeader(), SheetTitle(), Sidebar(), SidebarContent(), SidebarContext (+21 more)

### Community 23 - "Manual edit commit flow"
Cohesion: 0.10
Nodes (49): allEntryIds(), argVal(), buildRepairBatch(), candidatesForEntry(), changedFilesSinceSnapshot(), collectApplyOwnedFiles(), collectRollbackFiles(), commitManualEdits() (+41 more)

### Community 24 - "Impeccable config store"
Cohesion: 0.10
Nodes (47): applyDetectionConfigSource(), clampByte(), cleanIgnoreValueDisplay(), cloneDetectionConfig(), cloneRawDetectionConfig(), colorIgnoreKey(), DEFAULT_DETECTION_CONFIG, DETECTOR_CONFIG_KEYS (+39 more)

### Community 25 - "Hook admin configuration"
Cohesion: 0.11
Nodes (45): ACTIONS, addIgnoreFile(), addIgnoreRule(), addIgnoreValue(), DETECTOR_CONFIG_KEYS, detectorSection(), fileHasImpeccableHookMarker(), HOOK_MANIFEST_TARGETS (+37 more)

### Community 26 - "Regex text detector"
Cohesion: 0.08
Nodes (40): blankCssComments(), BLOCK_BRACE_PREFIX_KEYWORDS, CSS_IN_JS_EXTENSIONS, detectText(), extFromFilePath(), extractCSSinJS(), extractStyleBlocks(), findCSSinJSTemplates() (+32 more)

### Community 27 - "Before-edit hook cache"
Cohesion: 0.09
Nodes (44): allow(), bumpCursorDenial(), cursorBlockMessage(), deny(), detectProposedHtml(), done(), escapeRegExp(), findingSignature() (+36 more)

### Community 28 - "Live wrap and insert"
Cohesion: 0.13
Nodes (38): hasGeneratedHeader(), HEADER_MARKERS, isGeneratedFile(), isGitIgnored(), resolveSourceTraits(), argVal(), buildInsertWrapperLines(), computeInsertLine() (+30 more)

### Community 29 - "Live poll instructions"
Cohesion: 0.10
Nodes (38): Impeccable Manual Edit Applier Agent, completionAckForAcceptResult(), completionTypeForAcceptResult(), PREVIEW_MODES_WITHOUT_SOURCE_MARKERS, acceptInstructions(), deferredWrapperInstructions(), generateInstructions(), insertScaffoldInstructions() (+30 more)

### Community 30 - "CSS pattern scanners"
Cohesion: 0.10
Nodes (40): buildHtmlPatternCorpora(), checkColors(), checkElementAIPaletteDOM(), checkElementGlow(), checkElementRadialSpotlight(), checkElementRadialSpotlightDOM(), checkGlow(), checkHoverContrast() (+32 more)

### Community 31 - "Manual apply transactions"
Cohesion: 0.12
Nodes (40): addOpToManualApplyChunk(), APPLY_EVENT_HARD_TIMEOUT_MS, APPLY_EVENT_SOFT_DEADLINE_MS, buildManualApplyAgentAction(), clearManualApplyTransaction(), collectManualApplyFiles(), compactManualApplyBatch(), compactManualApplyCandidates() (+32 more)

### Community 32 - "New-work and live docs"
Cohesion: 0.07
Nodes (40): .impeccable/design.json sidecar schema, DESIGN.md format (frontmatter token schema + 8 canonical sections), /impeccable document (DESIGN.md generation flow), Scan mode (auto-extract tokens then confirm language), Seed mode (pre-implementation DESIGN.md scaffold), /impeccable extract (design-system extraction flow), .impeccable/config.json (unified hook + detector config), craft-floor.md (mechanical-scan-independent design reflexes) (+32 more)

### Community 33 - "DESIGN.md parser"
Cohesion: 0.13
Nodes (39): assessCoverage(), buildColor(), CANONICAL_SECTIONS, collectBullets(), collectColorValues(), collectParagraphs(), detectFormat(), extractColors() (+31 more)

### Community 34 - "Live accept flow"
Cohesion: 0.12
Nodes (39): acceptCli(), acceptReceiptPath(), argVal(), buildAcceptedWrappedSource(), buildCarbonizeReplacement(), decodeHtmlAttr(), deindentContent(), detectCommentSyntax() (+31 more)

### Community 35 - "Live roots resolution"
Cohesion: 0.11
Nodes (37): __dirname, ensureServerRunning(), globToRegex(), bootInstructions(), liveCli(), relOrNull(), CANDIDATE_SCAN_IGNORED, consumeTargetArg() (+29 more)

### Community 36 - "App icon set"
Cohesion: 0.05
Nodes (6): base, IconMessage(), IconNote(), IconPhoneIn(), IconPhoneOut(), IconProps

### Community 37 - "shadcn skill rules"
Cohesion: 0.13
Nodes (38): shadcn openai.yml agent interface (.agents), shadcn CLI Reference (.agents), Customization & Theming (.agents), shadcn MCP Server (.agents), Registry Authoring and Addresses (.agents), Base vs Radix rules (.agents), Chat & Messaging rules (.agents), Component Composition rules (.agents) (+30 more)

### Community 38 - "Page chat and voice"
Cohesion: 0.11
Nodes (38): armPageChatForTyping(), buildSteerProcessingDots(), buildSteerQueueHint(), clearSteerAwaitTimer(), collapsePageChat(), expandPageChat(), finishVoiceSession(), focusPageChatInput() (+30 more)

### Community 39 - "Doctor and staleness checks"
Cohesion: 0.12
Nodes (33): applyFixes(), cli(), collect(), parseArgs(), readProjectRootPatterns(), rel(), renderText(), safeRead() (+25 more)

### Community 40 - "Manual edit DOM mapping"
Cohesion: 0.08
Nodes (35): addManualContextText(), applyEditing(), buildLocatorForLeaf(), canRestoreManualEditElement(), collectManualContextPieces(), contextElementForManualEdit(), copyEditContainerContext(), copyEditLeafContext() (+27 more)

### Community 41 - "Product domain notes"
Cohesion: 0.08
Nodes (29): UI/UX Polish — Iterative Enhancement Workflow (skill), CLAUDE.md — Ayad Estate CRM Prototype Project Instructions, Article (lot/unit) entity, Communication (interaction log) entity, Dashboard page, Linear/Stripe Dashboard/Attio design direction, Dossier de vente (sale file) data entity, Dossiers list + detail pages (+21 more)

### Community 42 - "Global bar and theming"
Cohesion: 0.12
Nodes (33): agentHasWorkInFlight(), agentStatusText(), barPaletteForTheme(), brandMarkSvg(), buildDesignHeader(), cursorForInsertAxis(), designPanelCss(), detectPageTheme() (+25 more)

### Community 43 - "DOM color checks"
Cohesion: 0.13
Nodes (32): checkBorders(), checkElementAIPaletteDOM(), checkElementBorders(), checkElementBordersDOM(), checkElementColors(), checkElementColorsDOM(), checkElementGlowDOM(), checkElementHoverContrast() (+24 more)

### Community 44 - "Hook run orchestration"
Cohesion: 0.13
Nodes (31): appendDesignSystemNote(), bumpEditCount(), canonicalPath(), clampGroupedToBudget(), coLocatedStylesheets(), dedupeAgainstCache(), depthIsSet(), ensureFile() (+23 more)

### Community 45 - "Copy-edit batch agent"
Cohesion: 0.13
Nodes (30): applyMockWrites(), buildCopyEditBatchPrompt(), checkFrameworkSourceSyntax(), chooseCopyEditAgent(), COMMAND_AUTH_CACHE, commandAuthed(), commandExists(), compactBatchForPrompt() (+22 more)

### Community 46 - "Svelte variant mounting"
Cohesion: 0.11
Nodes (30): acceptedDomAlreadyClean(), applyOriginalAttrsToSvelteAnchor(), commitAcceptedSvelteComponentToDom(), componentModuleCandidates(), describeMountFailure(), detectDevServerBase(), elementMatchesOriginalMarkup(), ensureAcceptedDomClean() (+22 more)

### Community 47 - "Impeccable paths and locks"
Cohesion: 0.15
Nodes (26): resolveProjectRoot(), CRITIQUE_DIR, firstExisting(), getDesignSidecarCandidates(), getDesignSidecarPath(), getImpeccableDir(), getLegacyLiveAnnotationsDir(), getLegacyLiveConfigPath() (+18 more)

### Community 48 - "Live event validation"
Cohesion: 0.12
Nodes (26): AGENT_PHASE_SET, FORBIDDEN_MANUAL_EDIT_TEXT_CHARS, INSERT_POSITIONS, isValidId(), isValidMountVariant(), isValidVariantId(), MOUNT_ERROR_MAX_LENGTH, MOUNT_URL_MAX_LENGTH (+18 more)

### Community 49 - "Live session store"
Cohesion: 0.14
Nodes (23): getLegacyLiveSessionsDir(), getLiveSessionsDir(), safeSessionId(), FORBIDDEN, verifyAcceptedFile(), completeCli(), completeThroughServer(), parseArgs() (+15 more)

### Community 50 - "Insert placement UI"
Cohesion: 0.09
Nodes (13): canCreateInsert(), clampPlaceholderSize(), computeInsertPosition(), groupSiblingRows(), hitSiblingInsertGap(), horizontalOverlap(), insertCreateDisabledReason(), insertLineCoords() (+5 more)

### Community 51 - "Manual edit evidence"
Cohesion: 0.15
Nodes (26): analyzeSourceHint(), buildCandidatesForOp(), buildContextHintsByRef(), buildManualEditEvidence(), collectSearchFiles(), countOps(), decodeBasicHtml(), escapeRegExp() (+18 more)

### Community 52 - "Browser CSS scanners"
Cohesion: 0.14
Nodes (26): buildHtmlPatternCorpora(), checkHtmlPatterns(), collectCssCustomProps(), collectMarqueeKeyframes(), collectPulseKeyframes(), cssLengthToPx(), cssTextHasDarkRootBg(), extractShadowLengths() (+18 more)

### Community 53 - "Pending apply UI state"
Cohesion: 0.17
Nodes (26): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+18 more)

### Community 54 - "Manual edits buffer routes"
Cohesion: 0.17
Nodes (22): clearAppliedEntries(), args, buffer, cwd, pageUrlFilter, remaining, compactManualLogText(), summarizeManualApplyFailures() (+14 more)

### Community 55 - "Browser finding collection"
Cohesion: 0.11
Nodes (25): browserFindingsFromMap(), checkCreamPalette(), checkEdgeFlushCardsDOM(), checkElementBlinkingCursorDOM(), checkElementTextOverflowDOM(), checkEmDashOveruse(), checkEmDashOveruseDOM(), checkFirstViewportColumnOverflowDOM() (+17 more)

### Community 56 - "Boot staleness artifacts"
Cohesion: 0.17
Nodes (22): DESIGN_SIDECAR_SCHEMA_VERSION, PRODUCT_DEPRECATED_SECTIONS, PRODUCT_SCHEMA_VERSION, PRODUCT_V4_SECTIONS, readProductSchemaVersion(), readSidecarSchemaVersion(), checkConfig(), checkDesignSidecar() (+14 more)

### Community 57 - "App TypeScript config"
Cohesion: 0.08
Nodes (24): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+16 more)

### Community 58 - "URL detector and profiler"
Cohesion: 0.19
Nodes (20): createBrowserDetector(), detectUrl(), launchBrowser(), measureContentHiddenAfterReveal(), runVisualContrastFallback(), serializeDesignSystemForBrowser(), captureVisualContrastCandidate(), compareScreenshotContrast() (+12 more)

### Community 59 - "Accept CSS baking"
Cohesion: 0.20
Nodes (23): bakeParamValues(), collectAllSelectors(), collectSelectorsFromNodes(), escapeRegExp(), formatBody(), isToggleOn(), normalizeSelector(), normalizeToggleForVar() (+15 more)

### Community 60 - "Svelte AST analysis"
Cohesion: 0.21
Nodes (20): Analysis, analyzeAttributes(), analyzeFragment(), analyzeNode(), analyzeSvelteMarkup(), applyReplacements(), classifyEachKey(), classifyRoots() (+12 more)

### Community 61 - "Calendrier and preview"
Cohesion: 0.15
Nodes (20): Calendrier, PreviewProvider(), getEvenementsCalendrier(), isVisiteEvenement(), PreviewContext, PreviewContextValue, PreviewTarget, usePreview() (+12 more)

### Community 62 - "Dossier status stepper"
Cohesion: 0.13
Nodes (16): CONFIANCE_TONE, DossierStatusStepper(), Popover(), PopoverClose(), PopoverContent(), PopoverTrigger(), Textarea(), ALL_STATUSES (+8 more)

### Community 63 - "Visual contrast analysis"
Cohesion: 0.12
Nodes (22): addBrowserFindings(), addVisualContrastFindings(), addVisualContrastResult(), analyzeVisualContrast(), analyzeVisualContrastCandidate(), blendRgba(), clampByte(), clearOverlays() (+14 more)

### Community 64 - "SvelteKit live adapter"
Cohesion: 0.18
Nodes (20): applySvelteKitLiveAdapter(), buildSvelteLiveRootComponent(), defaultSvelteLayout(), detectSvelteKitProject(), ensureSvelteLiveRootComponent(), escapeRegExp(), fileIncludes(), findSvelteKitAppHtml() (+12 more)

### Community 65 - "TanStack live adapter"
Cohesion: 0.16
Nodes (20): tanstackStart, applyTanStackLiveAdapter(), buildTanStackLiveRootComponent(), detectTanStackStartProject(), escapeRegExp(), findRootRouteFile(), insertAfterLastImport(), isManagedComponent() (+12 more)

### Community 66 - "shadcn components config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 67 - "Runtime dependencies"
Cohesion: 0.10
Nodes (21): @base-ui/react, class-variance-authority, @fontsource-variable/geist, lucide-react, dependencies, @base-ui/react, class-variance-authority, @fontsource-variable/geist (+13 more)

### Community 68 - "Kicker and eyebrow checks"
Cohesion: 0.13
Nodes (21): checkElementHeroEyebrow(), checkElementHeroEyebrowDOM(), checkElementQualityDOM(), checkHeroEyebrow(), checkKickerAboveHeading(), checkKickerAboveHeadingDOM(), checkKickerAboveHeadingFromDoc(), checkNumberedSectionLabels() (+13 more)

### Community 69 - "Live script injection"
Cohesion: 0.18
Nodes (20): describeInjectArtifacts(), frameworkIgnorePatterns(), resolveFramework(), clearInjectJournal(), recordInjection(), removeTag(), revertCspMeta(), unpatchTagFile() (+12 more)

### Community 70 - "Dev dependencies"
Cohesion: 0.10
Nodes (21): eslint, @eslint/js, eslint-plugin-react-hooks, globals, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+13 more)

### Community 71 - "Node TypeScript config"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 72 - "Confirm dialog stack"
Cohesion: 0.15
Nodes (15): ConfirmProvider(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader() (+7 more)

### Community 73 - "Impeccable command reference"
Cohesion: 0.27
Nodes (19): Adapt Command (Web), Adapt Command (Native), Android Platform Reference, Animate Command, Audit Command (Web), Audit Command (Native), Bolder Command, Clarify Command (+11 more)

### Community 74 - "Color and glow checks"
Cohesion: 0.16
Nodes (18): checkColors(), checkElementGlow(), checkElementRadialSpotlight(), checkElementRadialSpotlightDOM(), checkGlow(), checkHoverContrast(), checkRadialSpotlight(), colorToHex() (+10 more)

### Community 75 - "Context signal gathering"
Cohesion: 0.21
Nodes (15): extractPlatform(), hasVisualImplementation(), loadContext(), cli(), COMMON_DEV_PORTS, devServerSignals(), gatherSignals(), gitSignals() (+7 more)

### Community 76 - "Border and shadow quality"
Cohesion: 0.15
Nodes (17): borderColorsFromStyle(), borderWidthsFromStyle(), checkElementGptBorderShadow(), checkElementGptBorderShadowDOM(), checkGptThinBorderWideShadow(), checkQuality(), colorsNearlyMatch(), cssColorAlpha() (+9 more)

### Community 77 - "Steer chat focus guard"
Cohesion: 0.21
Nodes (17): attachSteerFocusDebug(), attachSteerFocusGuard(), clearSteerFocusRecoverTimer(), focusConfigureInput(), focusSteerChat(), isInlineEditActive(), isPageEditableActive(), isPageEditableElement() (+9 more)

### Community 78 - "Annotation pin overlay"
Cohesion: 0.20
Nodes (17): beginEditPin(), buildAnnotationsForCapture(), buildPinElement(), cancelEditingPin(), clampPlaceholderSize(), finalizeEditingPin(), initAnnotOverlay(), localCoords() (+9 more)

### Community 79 - "Framework detection utils"
Cohesion: 0.27
Nodes (13): astro, detectAstroProject(), fileExists(), findConfigFile(), firstExistingFile(), hasAnyDependency(), literalConfigFiles(), readPackageDeps() (+5 more)

### Community 80 - "Asset prompt embedding"
Cohesion: 0.14
Nodes (12): impeccable-asset-producer agent, Impeccable Asset Producer Agent, visualize.md — Direction Comps & Asset Production, Implementation Medium Gate (raster vs vector rule), args, buf, crc32(), crcTable (+4 more)

### Community 81 - "Workspace target discovery"
Cohesion: 0.21
Nodes (16): directChildDirs(), discoverRootsForPattern(), discoverTargetCandidates(), expandSimplePattern(), findTargetExample(), isExcludedByWorkspacePattern(), isIgnoredWorkspaceDiscoveryDir(), isSelectableCandidate() (+8 more)

### Community 82 - "Image generation stub"
Cohesion: 0.18
Nodes (12): crc32(), hash32(), hslToRgb(), out, palette(), pngChunk(), pngFake(), promptFile (+4 more)

### Community 83 - "Surface brief resolution"
Cohesion: 0.31
Nodes (12): getSurfaceBriefDir(), listSurfaceBriefs(), normalizeSurfaceTarget(), parseSurfaceBrief(), resolveSurfaceBrief(), SURFACE_BRIEF_VERSION, surfaceBriefPathForTarget(), writeSurfaceBrief() (+4 more)

### Community 84 - "Question serving page"
Cohesion: 0.18
Nodes (13): answerFile(), esc(), loadRound(), localImages, nextFile(), page(), payloadPath, portArg (+5 more)

### Community 85 - "Project context resolution"
Cohesion: 0.17
Nodes (15): contextSourcePath(), contextSourceStatus(), firstExisting(), isCandidateProjectRoot(), isPathInside(), isPathInsideOrEqual(), nearestPackageRootBetween(), nearestTargetContextRoot() (+7 more)

### Community 86 - "Template extension search"
Cohesion: 0.19
Nodes (12): IMPECCABLE_DIR, extensionCache, LIVE_TEMPLATE_EXTENSIONS, matchesTemplateExtension(), normalizeExtensionEntries(), readLiveTemplateExtensions(), resolveLiveTemplateExtensions(), safeReadJson() (+4 more)

### Community 87 - "CSP tag strategy"
Cohesion: 0.22
Nodes (14): appendOriginToDirective(), buildTagBlock(), commentClose(), commentOpen(), detectLineEnding(), findCspMetaTags(), getAttr(), insertTag() (+6 more)

### Community 88 - "Live status and resume"
Cohesion: 0.30
Nodes (13): collectManualApplyFiles(), manualApplyReplyCommand(), manualApplyResumeHint(), mountFailureAction(), parseArgs(), renderSummary(), resumeCli(), summarizeManualApplyEvent() (+5 more)

### Community 89 - "Theme provider and entry"
Cohesion: 0.18
Nodes (12): index.html — App Entry (Ayad Développement CRM), Pre-paint Theme Flash Prevention Script, Ayad Développement brand commitments (logo, accent color), README.md — Vite React TypeScript Template, App(), ThemeToggle(), getInitialTheme(), Theme (+4 more)

### Community 90 - "Routing and typeset docs"
Cohesion: 0.15
Nodes (13): ios.md (referenced), live command (referenced, web-only), live.md Signature Params Contract (referenced), new-work.md (referenced), routing.md — No-Argument Routing Menu, Context-Aware Menu Logic, shape.md — Shape Mode (Discovery), Discovery Interview Cadence (+5 more)

### Community 92 - "Dossier status feature specs"
Cohesion: 0.19
Nodes (13): /clients Page (referenced existing screen), FEATURE-changement-statut.md — Dossier Status Stepper, Horizontal Pipeline Stepper (non-linear transitions), StatutDossier TypeScript Type, TRANSITIONS_VALIDES Lookup Table, FEATURE-transformation-prospect.md — Pré-Prospection → Prospection, Dual-Condition Qualification Rule (prospect + commercial both required), New /prospects List Screen (+5 more)

### Community 93 - "Craft floor and overdrive"
Cohesion: 0.15
Nodes (13): Craft Floor (Quality Checklist), Craft Floor Refuse List (Category Defaults to Reject), Impeccable Finish Reviewer Agent, operate.md — Operate Mode Depth Reference, Earned Familiarity Principle, The Product Slop Test, overdrive.md — Overdrive Mode, Propose Before Building (+5 more)

### Community 94 - "Background image sampling"
Cohesion: 0.24
Nodes (13): firstCssUrl(), getLayerValue(), loadVisualContrastImage(), parseObjectPosition(), parsePositionPair(), parsePositionToken(), pointToImageSource(), resolveObjectImageRect() (+5 more)

### Community 95 - "Finding ignore filters"
Cohesion: 0.23
Nodes (13): cleanIgnoreValueDisplay(), extractFindingIgnoreValue(), extractFindingIgnoreValueRaw(), extractMotionIgnoreValue(), filterFindings(), findingMatchesScopedIgnoreFile(), formatFindingIgnoreCommand(), globToRegex() (+5 more)

### Community 96 - "Inject journal healing"
Cohesion: 0.27
Nodes (12): PATCH_UNDOERS, healArtifact(), healInjectJournal(), INJECT_JOURNAL_RELPATH, INJECT_JOURNAL_VERSION, injectJournalPath(), insideProject(), normalizeRel() (+4 more)

### Community 97 - "Skill pinning"
Cohesion: 0.22
Nodes (11): CODEX_HARNESSES, commandPrefixForSkillsDir(), __dirname, findHarnessDirs(), generatePinnedSkill(), HARNESS_DIRS, loadCommandMetadata(), pin() (+3 more)

### Community 98 - "Advanced filters and spec sync"
Cohesion: 0.21
Nodes (13): docs/api-docsV4.json (OpenAPI snapshot), Panneau de filtres avancés — Dossiers de vente, Captures de référence de l'ancien Omran fournies par le métier, Offres — liste globale cross-prospections (GET /api/devis), Filtre par période (champDate + dateDebut/dateFin), Filtres avancés — Prospections / Pré-prospections / Prospects, Repeatable query parameter convention (?statut=A&statut=B), Filtre par Tranche (vs Entité/Projet) — demande backend (+5 more)

### Community 100 - "Critique snapshot storage"
Cohesion: 0.35
Nodes (10): coerceSlug(), listSnapshotsForSlug(), main(), nowFilenameStamp(), parseFrontmatter(), readLatestSnapshot(), readTrend(), serializeFrontmatter() (+2 more)

### Community 101 - "Live UI DOM helpers"
Cohesion: 0.23
Nodes (10): createLiveBrowserDomHelpers(), activeElementDeep(), appendStyleToLiveUiRoot(), appendToLiveUiRoot(), escapeCssIdent(), getLiveUiElementById(), LIVE_CHROME_MOUNT_CONTRACT, LIVE_UI_COMPONENT_IDS (+2 more)

### Community 102 - "Framework adapter registry"
Cohesion: 0.18
Nodes (10): COMMENT_SYNTAXES, FRAMEWORKS, INJECT_KINDS, PREVIEW_MODES, SOURCE_TRAIT_DEFAULTS, STYLE_MODES, TAG_PATCH_KIND, staticHtml (+2 more)

### Community 103 - "Polish and onboarding docs"
Cohesion: 0.18
Nodes (11): onboard.md — Onboarding Mode Reference, Empty State Design, Guided Tours & Walkthroughs, Onboarding Mode: Time-to-Value Design, Show, Don't Tell Principle, optimize.md — Performance Optimization Mode, Core Web Vitals (LCP/INP/CLS), Measure Before You Optimize (+3 more)

### Community 104 - "Staleness notices"
Cohesion: 0.33
Nodes (10): appendStalenessDirective(), designSidecarCandidatesFor(), buildStalenessDirective(), cachePath(), filterFreshFindings(), pruneCache(), readCache(), readJson() (+2 more)

### Community 105 - "CSP detection"
Cohesion: 0.20
Nodes (10): detectCsp(), INLINE_HEADER_SIGNALS, LAYOUT_EXTS, MONOREPO_HELPER_SIGNALS, NUXT_ROUTE_RULES_SIGNALS, NUXT_SECURITY_SIGNALS, SCAN_EXTS, SKIP_DIRS (+2 more)

### Community 106 - "Text occlusion checks"
Cohesion: 0.22
Nodes (11): checkTextOcclusionDOM(), clippedByInset(), clippedByRect(), elementDirectText(), expandBoxShorthand(), firstMetricLengthPx(), isLayeredElement(), isOpaqueDecoratedBox() (+3 more)

### Community 107 - "Generation preflight"
Cohesion: 0.35
Nodes (9): buildGenerationPreflight(), compactError(), execFileAsync, insertTarget(), normalizeTarget(), replaceTarget(), runGenerationPreflight(), sourceResolutionCache (+1 more)

### Community 108 - "Palette seeding"
Cohesion: 0.24
Nodes (7): args, buildWeights(), hashUnit(), pickSeed(), seed, SEEDS, weightedPick()

### Community 109 - "Inline ignore directives"
Cohesion: 0.40
Nodes (9): addRules(), applyInlineIgnores(), getSet(), hasDirectives(), isInlineIgnored(), normalizeRule(), parseInlineIgnores(), parseRuleList() (+1 more)

### Community 110 - "Contrast check script"
Cohesion: 0.31
Nodes (8): check(), css, lin(), lum(), over(), parseColor(), ratio(), ROOT

### Community 111 - "Nuxt live adapter"
Cohesion: 0.31
Nodes (7): applyNuxtLiveAdapter(), buildNuxtPlugin(), nuxt, NUXT_PLUGIN_MARKER, NUXT_PLUGIN_NAME, removeNuxtLiveAdapter(), buildLiveScriptSrc()

### Community 112 - "Live target arguments"
Cohesion: 0.36
Nodes (5): parseCliOptions(), parseTargetOptions(), parseTargetPath(), TargetArgError, resolveLiveTarget()

### Community 113 - "npm scripts"
Cohesion: 0.29
Nodes (7): scripts, build, check:contrast, dev, docs:update, lint, preview

### Community 114 - "Legacy pré-prospection screens"
Cohesion: 0.33
Nodes (6): Créer Prospect Button, Notes Field Containing Free-Text Budget Data, Omran Estate - Pré-Prospection Detail Popup (Code 50), Omran Estate - Pré-Prospections List View, Transformer en prospection Button, Omran Estate Vente Module Sidebar Navigation

### Community 115 - "Legacy prospect detail screen"
Cohesion: 0.47
Nodes (6): "Général" Tab Form (Titre/Sexe/Nom/Prénom/Mobile/Email etc.), Permanent Record Code Field (e.g. 26/14424), Prospect Contact Record (Omran legacy entity), Related-Module Tabs (Prospections/Dossiers/Recettes/Dépenses/Règlements/Historique), Omran Prospect Detail Screenshot (Saved: Elbaz ELBAZ), Legacy Windows Forms Dense Multi-Tab Modal Pattern

### Community 116 - "OpenAPI docs sync script"
Cohesion: 0.40
Nodes (5): BACKUP_PATH, __dirname, getArgUrl(), main(), TARGET_PATH

### Community 117 - "Searchable select combobox"
Cohesion: 0.53
Nodes (4): SearchableSelectOption, ComboboxContent(), ComboboxItem(), ComboboxTrigger()

### Community 118 - "Card and layout checks"
Cohesion: 0.40
Nodes (5): checkPageLayout(), isCardLike(), isCardLikeFromProps(), parseRadiusToPx(), resolveBorderRadiusPx()

### Community 119 - "Package manifest"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 120 - "Root TypeScript config"
Cohesion: 0.40
Nodes (4): compilerOptions, paths, files, references

### Community 121 - "Stop hook entry"
Cohesion: 0.83
Nodes (3): isStopEvent(), main(), readStdin()

### Community 122 - "Design token session notes"
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
- `index.html — App Entry (Ayad Développement CRM)` → `README.md — Vite React TypeScript Template`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **470 isolated node(s):** `AuthStatus`, `ProspectTab`, `ImportMeta`, `ImportMetaEnv`, `PreviewContextValue` (+465 more)
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
- **What is the exact relationship between `index.html — App Entry (Ayad Développement CRM)` and `README.md — Vite React TypeScript Template`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `createManualEditRoutes()` connect `Manual edits buffer routes` to `Live server and SSE`, `Static HTML/CSS cascade`, `Live event validation`, `Manual edit evidence`, `Manual edit commit flow`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Why does `confirm()` connect `Detector CLI entrypoint` to `Confirm dialog stack`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._