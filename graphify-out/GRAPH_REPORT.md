# Graph Report - crm-prototype  (2026-08-14)

## Corpus Check
- Large corpus: 316 files · ~525,620 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 3505 nodes · 9239 edges · 129 communities (117 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 106 edges (avg confidence: 0.66)
- Token cost: 410,239 input · 0 output

## Community Hubs (Navigation)
- Checks
- Live Browser
- App Shell & Navigation
- Live Browser
- Index
- Css Cascade
- Design System
- App Root & Communication Icons
- Detect Antipatterns Browser
- Staleness Deep
- Live Server
- Context
- Live Browser
- Concept Seed
- Live Browser
- Modern Screenshot.umd
- Hook Lib
- Main
- Live Commit Manual Edits
- Impeccable Config
- Hook Admin
- Detect Text
- Live Poll
- Client & Dossier Status Logic
- Checks
- Manual Apply
- New Work
- Hook Before Edit
- Design Parser
- Live Accept
- Page Shell & Input Group UI
- Chat
- Live Browser
- Svelte Component
- Live Wrap
- Form Fields & Financing UI
- Avatar UI Components
- CRM Data Model & Scope
- Live Manual Edit Evidence
- Live Browser
- Detect Antipatterns Browser
- Live Copy Edit Agent
- Icon Library
- Hook Lib
- Generate Image
- Event Validation
- Roots
- Detect Antipatterns Browser
- Manual Edits Buffer
- Insert Ui
- Critique
- Detect Antipatterns Browser
- Live Browser
- Live Browser
- Detect Antipatterns Browser
- Tsconfig.app
- Profiler
- Svelte Ast
- Sveltekit Adapter
- Tanstack Adapter
- Components
- Detect Antipatterns Browser
- Accept Css
- Live Inject
- Package
- Prospect Creation & Modals
- Interaction Form & Select UI
- Tsconfig.node
- Package
- Live
- Impeccable Paths
- Session Store
- Live Browser
- Confirm Dialog UI
- Context
- Detect Antipatterns Browser
- Live Browser
- Live Browser
- Live Browser
- Detect Utils
- Live Resume
- Serve Question
- Context
- Critique Storage
- Svelte Component
- Tag Strategy
- Context Signals
- Detect Antipatterns Browser
- Css Cascade
- Detect Antipatterns Browser
- Surface Briefs
- Journal
- Pin
- Hook Lib
- Ui Core
- Index
- Generation Preflight
- Detect Csp
- Palette
- Staleness Notice
- Inline Ignores
- Template Extensions
- Svelte Component
- Package
- Source Search
- Live Complete
- Nuxt
- Detect Antipatterns Browser
- Hook Lib
- Source Lock
- Browser Script Parts
- Detect Antipatterns Browser
- Tsconfig
- Hook
- Provider
- Poll Lanes
- Brand & Template Identity
- Package
- Harden
- Package
- Package
- Package
- Package
- Package
- Vite.config
- Documenter

## God Nodes (most connected - your core abstractions)
1. `cn()` - 167 edges
2. `parseAnyColor()` - 37 edges
3. `runHook()` - 37 edges
4. `collectBrowserFindings()` - 36 edges
5. `parseAnyColor()` - 34 edges
6. `setLiveState()` - 32 edges
7. `connectSSE()` - 30 edges
8. `showToast()` - 29 edges
9. `formatCurrency()` - 29 edges
10. `detectHtml()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `11-value Dossier Statut progression pipeline` --semantically_similar_to--> `Derived dossier display-status utility (from milestone dates)`  [INFERRED] [semantically similar]
  instructions/FIX-mock-actions-state.md → CLAUDE.md
- `UI/UX Polish — Iterative Enhancement Workflow (skill)` --semantically_similar_to--> `Product Principles (real data, legible rules, honest boundaries)`  [INFERRED] [semantically similar]
  .claude/skills/polish/SKILL.md → PRODUCT.md
- `ConfirmProvider()` --indirect_call--> `confirm()`  [INFERRED]
  src/components/ConfirmModal.tsx → .claude/skills/impeccable/scripts/detector/cli/main.mjs
- `Dossier 'Détail du prix' pricing breakdown section` --shares_data_with--> `CLAUDE.md — Ayad Estate CRM Prototype Project Instructions`  [INFERRED]
  instructions/FIX-missing-data-fields.md → CLAUDE.md
- `README.md — Vite React TypeScript Template` --conceptually_related_to--> `index.html — App Shell`  [AMBIGUOUS]
  README.md → index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SKILL.md Critical Rules enforced across rule files** — agents_skills_shadcn_skill, agents_skills_shadcn_rules_styling, agents_skills_shadcn_rules_forms, agents_skills_shadcn_rules_composition, agents_skills_shadcn_rules_icons, agents_skills_shadcn_rules_chat, agents_skills_shadcn_rules_base_vs_radix [EXTRACTED 1.00]
- **Duplicate shadcn skill installed under .agents and .claude skill directories** — agents_skills_shadcn_skill, agents_skills_shadcn_cli, agents_skills_shadcn_customization, claude_skills_shadcn_skill, claude_skills_shadcn_cli, claude_skills_shadcn_customization [INFERRED 0.85]
- **Preset switching workflow (overwrite/merge/skip) described across SKILL.md, cli.md, customization.md** — agents_skills_shadcn_skill, agents_skills_shadcn_cli, agents_skills_shadcn_customization, concept_preset_system [EXTRACTED 1.00]
- **Commands That Hand Off to /impeccable polish as Final Step** — claude_skills_impeccable_reference_adapt, claude_skills_impeccable_reference_adapt_native, claude_skills_impeccable_reference_animate, claude_skills_impeccable_reference_audit, claude_skills_impeccable_reference_audit_native, claude_skills_impeccable_reference_bolder, claude_skills_impeccable_reference_clarify, claude_skills_impeccable_reference_colorize, claude_skills_impeccable_reference_critique, claude_skills_impeccable_reference_delight, claude_skills_impeccable_reference_distill [EXTRACTED 1.00]
- **Web Commands Routing to Native Variant Which Defers to Platform References** — claude_skills_impeccable_reference_adapt, claude_skills_impeccable_reference_adapt_native, claude_skills_impeccable_reference_audit, claude_skills_impeccable_reference_audit_native, claude_skills_impeccable_reference_animate, claude_skills_impeccable_reference_android [EXTRACTED 1.00]
- **SKILL.md Commands Table Enumerating Sub-Command References** — claude_skills_impeccable_skill, claude_skills_impeccable_reference_adapt, claude_skills_impeccable_reference_animate, claude_skills_impeccable_reference_audit, claude_skills_impeccable_reference_bolder, claude_skills_impeccable_reference_clarify, claude_skills_impeccable_reference_colorize, claude_skills_impeccable_reference_craft, claude_skills_impeccable_reference_critique, claude_skills_impeccable_reference_delight, claude_skills_impeccable_reference_distill, claude_skills_impeccable_reference_doctor [EXTRACTED 1.00]
- **Visual authority record chain: init (PRODUCT.md) -> new-work (world/direction) -> document (DESIGN.md/sidecar)** — claude_skills_impeccable_reference_init_initflow, claude_skills_impeccable_reference_init_productmd, claude_skills_impeccable_reference_new_work_newworkflow, claude_skills_impeccable_reference_document_document, claude_skills_impeccable_reference_document_designmd_format [INFERRED 0.85]
- **Live-mode session lifecycle scripts (setup, poll, wrap, accept, recovery)** — claude_skills_impeccable_reference_live_setup_liveconfig, claude_skills_impeccable_reference_live_livepollscript, claude_skills_impeccable_reference_live_livewrapscript, claude_skills_impeccable_reference_live_liveacceptscript, claude_skills_impeccable_reference_live_liveresumescript, claude_skills_impeccable_reference_live_liveserverscript [EXTRACTED 1.00]
- **Design detector hook tiering: per-edit mechanical scan, Stop-event deep pass, craft-floor manual reflexes** — claude_skills_impeccable_reference_hooks_hooks, claude_skills_impeccable_reference_hooks_hookadminscript, claude_skills_impeccable_reference_hooks_craftfloor_ref, claude_skills_impeccable_reference_layout_detectscript [INFERRED 0.75]
- **Pré-Prospection → Prospection → Dossier pipeline flow** — claude_prospection_entity, claude_dossier_entity, instructions_fix_prospection_pipeline_stage_gate, instructions_fix_mock_actions_state_transitions, product_pipeline_workflow [INFERRED 0.85]
- **Dossier detail page field-group enrichment (pricing, milestones, relances)** — instructions_fix_missing_data_fields_dossier_pricing, instructions_fix_missing_data_fields_milestones, instructions_fix_missing_data_fields_relances, claude_dossier_entity [EXTRACTED 1.00]
- **Dossier creation wizard + status progression system** — instructions_feature_plan_financement_entity, instructions_fix_mock_actions_state_dossier_status_pipeline, claude_dossier_entity, claude_status_derivation [INFERRED 0.75]

## Communities (129 total, 12 thin omitted)

### Community 0 - "Checks"
Cohesion: 0.03
Nodes (141): ANIMATION_VALUE_KEYWORDS, borderColorsFromStyle(), borderWidthsFromStyle(), checkBorders(), checkClippedOverflow(), checkCreamPalette(), checkEdgeFlushCardsDOM(), checkElementBlinkingCursorDOM() (+133 more)

### Community 1 - "Live Browser"
Cohesion: 0.03
Nodes (135): addManualContextText(), applyEditing(), applyGlobalBarLabelState(), applyPlaceholderSizingStyles(), bindEditBadgeProxy(), bufferToBase64(), buildCollapsible(), buildColorModels() (+127 more)

### Community 2 - "App Shell & Navigation"
Cohesion: 0.04
Nodes (76): ModuleSwitcher(), Crumb, Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage() (+68 more)

### Community 3 - "Live Browser"
Cohesion: 0.06
Nodes (87): applyParamDefaults(), applyParamValue(), applyPlaceholderDimensions(), applySavedSessionMeta(), buildInsertPlaceholderSnapshotFromDom(), buildParamsPanel(), buildPickedAnchorSnapshot(), captureAndEmit() (+79 more)

### Community 4 - "Index"
Cohesion: 0.06
Nodes (68): addBrowserFindings(), addVisualContrastFindings(), addVisualContrastResult(), analyzeVisualContrast(), analyzeVisualContrastCandidate(), blendRgba(), browserColorsClose(), browserDesignSystemConfig() (+60 more)

### Community 5 - "Css Cascade"
Cohesion: 0.06
Nodes (45): mergeDesignSystemFindings(), runTextContentAnalyzers(), applyStaticDeclaration(), buildBorderOverrideMap(), buildStaticStyleMap(), buildStaticWindow(), collectStaticCssRules(), collectStaticCssText() (+37 more)

### Community 6 - "Design System"
Cohesion: 0.07
Nodes (66): addClampEndpoints(), addColorObject(), addDesignColor(), addFontSizeStep(), addRoundedScale(), addRoundedToken(), addSidecarColors(), addSidecarRadii() (+58 more)

### Community 7 - "App Root & Communication Icons"
Cohesion: 0.09
Nodes (51): App(), IconMail(), IconMessage(), IconNote(), IconPhoneIn(), IconPhoneOut(), IconVisit(), IconWeb() (+43 more)

### Community 8 - "Detect Antipatterns Browser"
Cohesion: 0.06
Nodes (54): browserColorsClose(), browserDesignSystemConfig(), browserHasDirectText(), browserPrimaryFont(), browserRadiusTokens(), browserSampleText(), checkBrowserDesignSystemSources(), checkClippedOverflow() (+46 more)

### Community 9 - "Staleness Deep"
Cohesion: 0.08
Nodes (55): applyFixes(), cli(), collect(), parseArgs(), readProjectRootPatterns(), rel(), renderText(), safeRead() (+47 more)

### Community 10 - "Live Server"
Cohesion: 0.07
Nodes (56): acknowledgePendingEvent(), activeSessionSummaries(), agentPollingConnected(), annotRoot, args, broadcast(), broadcastAgentPollingIfChanged(), cancelQueuedAnonymousExitEvents() (+48 more)

### Community 11 - "Context"
Cohesion: 0.06
Nodes (56): appendAutonomyCounterDirective(), appendDetectorFallback(), appendImageGenDirective(), appendImageToolsDirective(), appendSubagentAuthorizationDirective(), appendSurfaceBriefContext(), automaticHookMode(), buildMissingTargetDirective() (+48 more)

### Community 12 - "Live Browser"
Cohesion: 0.07
Nodes (57): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+49 more)

### Community 13 - "Concept Seed"
Cohesion: 0.08
Nodes (49): API_BASE, API_TIMEOUT_MS, apiBudgetMs(), dealCompositions(), driveSelection(), fetchRoll(), here, loadLocal() (+41 more)

### Community 14 - "Live Browser"
Cohesion: 0.11
Nodes (54): abandonForeignSession(), abortSvelteComponentInjection(), cancelEditing(), cancelEditingToPicking(), cancelInsertConfigure(), cleanup(), cleanupAcceptedSession(), clearAnnotations() (+46 more)

### Community 15 - "Modern Screenshot.umd"
Cohesion: 0.09
Nodes (52): ae(), be(), bt(), Ce(), Ct(), de(), dt(), _e() (+44 more)

### Community 16 - "Hook Lib"
Cohesion: 0.06
Nodes (51): ACK_EXTS, ADVISORY_RULES, applyConfigSource(), applyDetectorConfigSource(), applyPatchText(), canonicalPath(), canonicalPathCache, clampByte() (+43 more)

### Community 17 - "Main"
Cohesion: 0.08
Nodes (42): confirm(), detectCli(), dim(), fileUrlToLocalPath(), formatAdvisorySection(), formatFindings(), formatFindingsBody(), formatFindingSummary() (+34 more)

### Community 18 - "Live Commit Manual Edits"
Cohesion: 0.11
Nodes (48): allEntryIds(), argVal(), buildRepairBatch(), candidatesForEntry(), changedFilesSinceSnapshot(), clearAppliedEntries(), collectApplyOwnedFiles(), collectRollbackFiles() (+40 more)

### Community 19 - "Impeccable Config"
Cohesion: 0.10
Nodes (47): applyDetectionConfigSource(), clampByte(), cleanIgnoreValueDisplay(), cloneDetectionConfig(), cloneRawDetectionConfig(), colorIgnoreKey(), DEFAULT_DETECTION_CONFIG, DETECTOR_CONFIG_KEYS (+39 more)

### Community 20 - "Hook Admin"
Cohesion: 0.11
Nodes (45): ACTIONS, addIgnoreFile(), addIgnoreRule(), addIgnoreValue(), DETECTOR_CONFIG_KEYS, detectorSection(), fileHasImpeccableHookMarker(), HOOK_MANIFEST_TARGETS (+37 more)

### Community 21 - "Detect Text"
Cohesion: 0.08
Nodes (40): blankCssComments(), BLOCK_BRACE_PREFIX_KEYWORDS, CSS_IN_JS_EXTENSIONS, detectText(), extFromFilePath(), extractCSSinJS(), extractStyleBlocks(), findCSSinJSTemplates() (+32 more)

### Community 22 - "Live Poll"
Cohesion: 0.10
Nodes (39): Impeccable Manual Edit Applier Agent, completionAckForAcceptResult(), completionTypeForAcceptResult(), PREVIEW_MODES_WITHOUT_SOURCE_MARKERS, acceptInstructions(), bootInstructions(), deferredWrapperInstructions(), generateInstructions() (+31 more)

### Community 23 - "Client & Dossier Status Logic"
Cohesion: 0.12
Nodes (35): buildClientRows(), ClientRow, computeAge(), isPreProspection(), deriveInitialDossierStatus(), DOSSIER_STATUS_PIPELINE, MILESTONE_FIELD_BY_STATUS, TONE_BY_STATUS (+27 more)

### Community 24 - "Checks"
Cohesion: 0.10
Nodes (40): buildHtmlPatternCorpora(), checkColors(), checkElementAIPaletteDOM(), checkElementGlow(), checkElementRadialSpotlight(), checkElementRadialSpotlightDOM(), checkGlow(), checkHoverContrast() (+32 more)

### Community 25 - "Manual Apply"
Cohesion: 0.12
Nodes (40): addOpToManualApplyChunk(), APPLY_EVENT_HARD_TIMEOUT_MS, APPLY_EVENT_SOFT_DEADLINE_MS, buildManualApplyAgentAction(), clearManualApplyTransaction(), collectManualApplyFiles(), compactManualApplyBatch(), compactManualApplyCandidates() (+32 more)

### Community 26 - "New Work"
Cohesion: 0.07
Nodes (40): .impeccable/design.json sidecar schema, DESIGN.md format (frontmatter token schema + 8 canonical sections), /impeccable document (DESIGN.md generation flow), Scan mode (auto-extract tokens then confirm language), Seed mode (pre-implementation DESIGN.md scaffold), /impeccable extract (design-system extraction flow), .impeccable/config.json (unified hook + detector config), craft-floor.md (mechanical-scan-independent design reflexes) (+32 more)

### Community 27 - "Hook Before Edit"
Cohesion: 0.11
Nodes (39): allow(), bumpCursorDenial(), deny(), detectProposedHtml(), done(), escapeRegExp(), findingSignature(), firstMatch() (+31 more)

### Community 28 - "Design Parser"
Cohesion: 0.13
Nodes (39): assessCoverage(), buildColor(), CANONICAL_SECTIONS, collectBullets(), collectColorValues(), collectParagraphs(), detectFormat(), extractColors() (+31 more)

### Community 29 - "Live Accept"
Cohesion: 0.12
Nodes (38): acceptCli(), acceptReceiptPath(), argVal(), buildAcceptedWrappedSource(), buildCarbonizeReplacement(), decodeHtmlAttr(), deindentContent(), detectCommentSyntax() (+30 more)

### Community 30 - "Page Shell & Input Group UI"
Cohesion: 0.18
Nodes (27): PageShell(), EmptyState(), ErrorState(), InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants (+19 more)

### Community 31 - "Chat"
Cohesion: 0.13
Nodes (38): shadcn openai.yml agent interface (.agents), shadcn CLI Reference (.agents), Customization & Theming (.agents), shadcn MCP Server (.agents), Registry Authoring and Addresses (.agents), Base vs Radix rules (.agents), Chat & Messaging rules (.agents), Component Composition rules (.agents) (+30 more)

### Community 32 - "Live Browser"
Cohesion: 0.11
Nodes (38): armPageChatForTyping(), buildSteerProcessingDots(), buildSteerQueueHint(), clearSteerAwaitTimer(), collapsePageChat(), expandPageChat(), finishVoiceSession(), focusPageChatInput() (+30 more)

### Community 33 - "Svelte Component"
Cohesion: 0.09
Nodes (35): buildPropsScriptV2(), appendCssToSvelteStyle(), appendSanitizedCssRule(), bakeParamValuesInCss(), buildInsertVariantStub(), buildPropContract(), buildPropsScript(), buildVariantStub() (+27 more)

### Community 34 - "Live Wrap"
Cohesion: 0.14
Nodes (34): resolveSourceTraits(), argVal(), buildInsertWrapperLines(), computeInsertLine(), INSERT_POSITIONS, insertCli(), isInsertPosition(), resolveElementMatch() (+26 more)

### Community 35 - "Form Fields & Financing UI"
Cohesion: 0.14
Nodes (29): FieldLabel(), FieldGrid(), Input(), Card(), Field(), useConfirm(), deriveFinancingSignal(), FEE_CATEGORY_CODES (+21 more)

### Community 36 - "Avatar UI Components"
Cohesion: 0.11
Nodes (25): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), Badge(), badgeVariants (+17 more)

### Community 37 - "CRM Data Model & Scope"
Cohesion: 0.08
Nodes (29): UI/UX Polish — Iterative Enhancement Workflow (skill), CLAUDE.md — Ayad Estate CRM Prototype Project Instructions, Article (lot/unit) entity, Communication (interaction log) entity, Dashboard page, Linear/Stripe Dashboard/Attio design direction, Dossier de vente (sale file) data entity, Dossiers list + detail pages (+21 more)

### Community 38 - "Live Manual Edit Evidence"
Cohesion: 0.12
Nodes (31): hasGeneratedHeader(), HEADER_MARKERS, isGeneratedFile(), isGitIgnored(), normalizeProjectSourcePath(), analyzeSourceHint(), buildCandidatesForOp(), buildContextHintsByRef() (+23 more)

### Community 39 - "Live Browser"
Cohesion: 0.12
Nodes (33): agentHasWorkInFlight(), agentStatusText(), barPaletteForTheme(), brandMarkSvg(), buildDesignHeader(), cursorForInsertAxis(), designPanelCss(), detectPageTheme() (+25 more)

### Community 40 - "Detect Antipatterns Browser"
Cohesion: 0.13
Nodes (32): checkBorders(), checkElementAIPaletteDOM(), checkElementBorders(), checkElementBordersDOM(), checkElementColors(), checkElementColorsDOM(), checkElementGlowDOM(), checkElementHoverContrast() (+24 more)

### Community 41 - "Live Copy Edit Agent"
Cohesion: 0.14
Nodes (31): applyMockWrites(), buildCopyEditBatchPrompt(), checkFrameworkSourceSyntax(), chooseCopyEditAgent(), COMMAND_AUTH_CACHE, commandAuthed(), commandExists(), compactBatchForPrompt() (+23 more)

### Community 43 - "Hook Lib"
Cohesion: 0.12
Nodes (30): extractPlatform(), loadContext(), cursorBlockMessage(), appendDesignSystemNote(), bumpEditCount(), clampGroupedToBudget(), clampToBudget(), dedupeAgainstCache() (+22 more)

### Community 44 - "Generate Image"
Cohesion: 0.09
Nodes (20): Impeccable Asset Producer Agent, args, buf, crc32(), crcTable, file, pngChunk(), readMode (+12 more)

### Community 45 - "Event Validation"
Cohesion: 0.12
Nodes (26): AGENT_PHASE_SET, FORBIDDEN_MANUAL_EDIT_TEXT_CHARS, INSERT_POSITIONS, isValidId(), isValidMountVariant(), isValidVariantId(), MOUNT_ERROR_MAX_LENGTH, MOUNT_URL_MAX_LENGTH (+18 more)

### Community 46 - "Roots"
Cohesion: 0.15
Nodes (27): CANDIDATE_SCAN_IGNORED, consumeTargetArg(), CONTEXT_FALLBACK_DIRS, DESIGN_NAMES, DEV_CONFIG_MARKERS, discoverAppCandidates(), enterLiveRoot(), exists() (+19 more)

### Community 47 - "Detect Antipatterns Browser"
Cohesion: 0.10
Nodes (27): addBrowserFindings(), addVisualContrastFindings(), addVisualContrastResult(), analyzeVisualContrast(), analyzeVisualContrastCandidate(), blendRgba(), buildSelectorSegment(), clampByte() (+19 more)

### Community 48 - "Manual Edits Buffer"
Cohesion: 0.16
Nodes (23): getLiveDir(), args, buffer, cwd, pageUrlFilter, remaining, compactManualLogText(), summarizeManualApplyFailures() (+15 more)

### Community 49 - "Insert Ui"
Cohesion: 0.09
Nodes (13): canCreateInsert(), clampPlaceholderSize(), computeInsertPosition(), groupSiblingRows(), hitSiblingInsertGap(), horizontalOverlap(), insertCreateDisabledReason(), insertLineCoords() (+5 more)

### Community 50 - "Critique"
Cohesion: 0.17
Nodes (25): Adapt Command (Web), Adapt Command (Native), Android Platform Reference, Animate Command, Audit Command (Web), Audit Command (Native), Bolder Command, Clarify Command (+17 more)

### Community 51 - "Detect Antipatterns Browser"
Cohesion: 0.14
Nodes (26): buildHtmlPatternCorpora(), checkHtmlPatterns(), collectCssCustomProps(), collectMarqueeKeyframes(), collectPulseKeyframes(), cssLengthToPx(), cssTextHasDarkRootBg(), extractShadowLengths() (+18 more)

### Community 52 - "Live Browser"
Cohesion: 0.11
Nodes (26): acceptedDomAlreadyClean(), applyOriginalAttrsToSvelteAnchor(), clearMountErrorCard(), commitAcceptedSvelteComponentToDom(), componentModuleCandidates(), describeMountFailure(), detectDevServerBase(), ensureAcceptedDomClean() (+18 more)

### Community 53 - "Live Browser"
Cohesion: 0.17
Nodes (26): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+18 more)

### Community 54 - "Detect Antipatterns Browser"
Cohesion: 0.11
Nodes (25): browserFindingsFromMap(), checkCreamPalette(), checkEdgeFlushCardsDOM(), checkElementBlinkingCursorDOM(), checkElementTextOverflowDOM(), checkEmDashOveruse(), checkEmDashOveruseDOM(), checkFirstViewportColumnOverflowDOM() (+17 more)

### Community 55 - "Tsconfig.app"
Cohesion: 0.08
Nodes (24): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+16 more)

### Community 56 - "Profiler"
Cohesion: 0.19
Nodes (20): createBrowserDetector(), detectUrl(), launchBrowser(), measureContentHiddenAfterReveal(), runVisualContrastFallback(), serializeDesignSystemForBrowser(), captureVisualContrastCandidate(), compareScreenshotContrast() (+12 more)

### Community 57 - "Svelte Ast"
Cohesion: 0.21
Nodes (20): Analysis, analyzeAttributes(), analyzeFragment(), analyzeNode(), analyzeSvelteMarkup(), applyReplacements(), classifyEachKey(), classifyRoots() (+12 more)

### Community 58 - "Sveltekit Adapter"
Cohesion: 0.18
Nodes (20): applySvelteKitLiveAdapter(), buildSvelteLiveRootComponent(), defaultSvelteLayout(), detectSvelteKitProject(), ensureSvelteLiveRootComponent(), escapeRegExp(), fileIncludes(), findSvelteKitAppHtml() (+12 more)

### Community 59 - "Tanstack Adapter"
Cohesion: 0.16
Nodes (20): tanstackStart, applyTanStackLiveAdapter(), buildTanStackLiveRootComponent(), detectTanStackStartProject(), escapeRegExp(), findRootRouteFile(), insertAfterLastImport(), isManagedComponent() (+12 more)

### Community 60 - "Components"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 61 - "Detect Antipatterns Browser"
Cohesion: 0.13
Nodes (21): checkElementHeroEyebrow(), checkElementHeroEyebrowDOM(), checkElementQualityDOM(), checkHeroEyebrow(), checkKickerAboveHeading(), checkKickerAboveHeadingDOM(), checkKickerAboveHeadingFromDoc(), checkNumberedSectionLabels() (+13 more)

### Community 62 - "Accept Css"
Cohesion: 0.24
Nodes (20): bakeParamValues(), collectAllSelectors(), collectSelectorsFromNodes(), escapeRegExp(), formatBody(), isToggleOn(), normalizeSelector(), normalizeToggleForVar() (+12 more)

### Community 63 - "Live Inject"
Cohesion: 0.18
Nodes (20): describeInjectArtifacts(), frameworkIgnorePatterns(), resolveFramework(), clearInjectJournal(), recordInjection(), removeTag(), revertCspMeta(), unpatchTagFile() (+12 more)

### Community 64 - "Package"
Cohesion: 0.10
Nodes (21): eslint, @eslint/js, globals, devDependencies, eslint, @eslint/js, globals, @types/node (+13 more)

### Community 65 - "Prospect Creation & Modals"
Cohesion: 0.16
Nodes (13): CreateProspectForm(), Layout(), Modal(), Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader() (+5 more)

### Community 66 - "Interaction Form & Select UI"
Cohesion: 0.16
Nodes (16): InteractionForm(), RESULT_OPTIONS, Chip(), SelectContent(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton() (+8 more)

### Community 67 - "Tsconfig.node"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 68 - "Package"
Cohesion: 0.11
Nodes (19): class-variance-authority, clsx, @fontsource-variable/geist, lucide-react, dependencies, class-variance-authority, clsx, @fontsource-variable/geist (+11 more)

### Community 69 - "Live"
Cohesion: 0.19
Nodes (15): parseCliOptions(), resolveTargetSelection(), parseTargetOptions(), parseTargetPath(), TargetArgError, __dirname, ensureServerRunning(), globToRegex() (+7 more)

### Community 70 - "Impeccable Paths"
Cohesion: 0.18
Nodes (18): resolveProjectRoot(), CRITIQUE_DIR, firstExisting(), getDesignSidecarCandidates(), getDesignSidecarPath(), getImpeccableDir(), getLegacyLiveAnnotationsDir(), getLegacyLiveConfigPath() (+10 more)

### Community 71 - "Session Store"
Cohesion: 0.20
Nodes (17): getLegacyLiveSessionsDir(), getLiveSessionsDir(), safeSessionId(), applyEvent(), baseSnapshot(), COMPLETED_PHASES, createLiveSessionStore(), deriveRenderState() (+9 more)

### Community 72 - "Live Browser"
Cohesion: 0.16
Nodes (19): buildSvelteExpressionTextMap(), buildSveltePropValuesFromLiveElement(), buildSveltePropValuesV2(), cloneWithoutElements(), collectTextNodes(), collectVisibleTexts(), cssEscapeIdent(), elementMatchesOriginalMarkup() (+11 more)

### Community 73 - "Confirm Dialog UI"
Cohesion: 0.16
Nodes (14): ConfirmProvider(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader() (+6 more)

### Community 74 - "Context"
Cohesion: 0.18
Nodes (18): directChildDirs(), discoverRootsForPattern(), discoverTargetCandidates(), escapeRegExp(), expandSimplePattern(), extractSectionValue(), findTargetExample(), isExcludedByWorkspacePattern() (+10 more)

### Community 75 - "Detect Antipatterns Browser"
Cohesion: 0.16
Nodes (18): checkColors(), checkElementGlow(), checkElementRadialSpotlight(), checkElementRadialSpotlightDOM(), checkGlow(), checkHoverContrast(), checkRadialSpotlight(), colorToHex() (+10 more)

### Community 76 - "Live Browser"
Cohesion: 0.21
Nodes (17): attachSteerFocusDebug(), attachSteerFocusGuard(), clearSteerFocusRecoverTimer(), focusConfigureInput(), focusSteerChat(), isInlineEditActive(), isPageEditableActive(), isPageEditableElement() (+9 more)

### Community 77 - "Live Browser"
Cohesion: 0.16
Nodes (17): averageRgb01(), captureChromeNodes(), captureElementFromRenderedAncestor(), captureElementToBlob(), cssColorToRgb01(), dominantRgb01(), findBackdropAncestor(), findShaderProxyCaptureRoot() (+9 more)

### Community 78 - "Live Browser"
Cohesion: 0.20
Nodes (17): beginEditPin(), buildAnnotationsForCapture(), buildPinElement(), cancelEditingPin(), clampPlaceholderSize(), finalizeEditingPin(), initAnnotOverlay(), localCoords() (+9 more)

### Community 79 - "Detect Utils"
Cohesion: 0.27
Nodes (13): astro, detectAstroProject(), fileExists(), findConfigFile(), firstExistingFile(), hasAnyDependency(), literalConfigFiles(), readPackageDeps() (+5 more)

### Community 80 - "Live Resume"
Cohesion: 0.28
Nodes (14): readLiveServerInfo(), collectManualApplyFiles(), manualApplyReplyCommand(), manualApplyResumeHint(), mountFailureAction(), parseArgs(), renderSummary(), resumeCli() (+6 more)

### Community 81 - "Serve Question"
Cohesion: 0.18
Nodes (13): answerFile(), esc(), loadRound(), localImages, nextFile(), page(), payloadPath, portArg (+5 more)

### Community 82 - "Context"
Cohesion: 0.17
Nodes (15): contextSourcePath(), contextSourceStatus(), firstExisting(), isCandidateProjectRoot(), isPathInside(), isPathInsideOrEqual(), nearestPackageRootBetween(), nearestTargetContextRoot() (+7 more)

### Community 83 - "Critique Storage"
Cohesion: 0.29
Nodes (12): coerceSlug(), listSnapshotsForSlug(), main(), nowFilenameStamp(), parseFrontmatter(), readLatestSnapshot(), readTrend(), serializeFrontmatter() (+4 more)

### Community 84 - "Svelte Component"
Cohesion: 0.18
Nodes (15): collectUnusedSelectors(), indentCssBlock(), inlineSvelteComponentAccept(), inlineSvelteComponentInsertAccept(), matchOpeningTag(), mergeCssIntoSvelteSource(), mergeOriginalTopLevelAttrs(), mergeStaticClassAttr() (+7 more)

### Community 85 - "Tag Strategy"
Cohesion: 0.22
Nodes (14): appendOriginToDirective(), buildTagBlock(), commentClose(), commentOpen(), detectLineEnding(), findCspMetaTags(), getAttr(), insertTag() (+6 more)

### Community 86 - "Context Signals"
Cohesion: 0.24
Nodes (12): cli(), COMMON_DEV_PORTS, devServerSignals(), gatherSignals(), gitSignals(), hasCode(), isVendoredPath(), latestCritique() (+4 more)

### Community 87 - "Detect Antipatterns Browser"
Cohesion: 0.16
Nodes (14): checkElementOversizedH1(), checkElementOversizedH1DOM(), checkElementQuality(), checkOversizedH1(), checkQuality(), colorsNearlyMatch(), cssColorIsTransparent(), getComputedStyleFor() (+6 more)

### Community 89 - "Detect Antipatterns Browser"
Cohesion: 0.24
Nodes (13): firstCssUrl(), getLayerValue(), loadVisualContrastImage(), parseObjectPosition(), parsePositionPair(), parsePositionToken(), pointToImageSource(), resolveObjectImageRect() (+5 more)

### Community 90 - "Surface Briefs"
Cohesion: 0.38
Nodes (10): getSurfaceBriefDir(), listSurfaceBriefs(), normalizeSurfaceTarget(), parseSurfaceBrief(), resolveSurfaceBrief(), SURFACE_BRIEF_VERSION, surfaceBriefPathForTarget(), writeSurfaceBrief() (+2 more)

### Community 91 - "Journal"
Cohesion: 0.27
Nodes (12): PATCH_UNDOERS, healArtifact(), healInjectJournal(), INJECT_JOURNAL_RELPATH, INJECT_JOURNAL_VERSION, injectJournalPath(), insideProject(), normalizeRel() (+4 more)

### Community 92 - "Pin"
Cohesion: 0.22
Nodes (11): CODEX_HARNESSES, commandPrefixForSkillsDir(), __dirname, findHarnessDirs(), generatePinnedSkill(), HARNESS_DIRS, loadCommandMetadata(), pin() (+3 more)

### Community 93 - "Hook Lib"
Cohesion: 0.29
Nodes (12): cleanIgnoreValueDisplay(), extractFindingIgnoreValue(), extractFindingIgnoreValueRaw(), extractMotionIgnoreValue(), filterFindings(), formatFindingIgnoreCommand(), isAdvisoryFinding(), isIgnoredFindingValue() (+4 more)

### Community 94 - "Ui Core"
Cohesion: 0.23
Nodes (10): createLiveBrowserDomHelpers(), activeElementDeep(), appendStyleToLiveUiRoot(), appendToLiveUiRoot(), escapeCssIdent(), getLiveUiElementById(), LIVE_CHROME_MOUNT_CONTRACT, LIVE_UI_COMPONENT_IDS (+2 more)

### Community 95 - "Index"
Cohesion: 0.18
Nodes (10): COMMENT_SYNTAXES, FRAMEWORKS, INJECT_KINDS, PREVIEW_MODES, SOURCE_TRAIT_DEFAULTS, STYLE_MODES, TAG_PATCH_KIND, staticHtml (+2 more)

### Community 96 - "Generation Preflight"
Cohesion: 0.30
Nodes (10): buildGenerationPreflight(), compactError(), execFileAsync, insertTarget(), normalizeTarget(), replaceTarget(), runGenerationPreflight(), sourceResolutionCache (+2 more)

### Community 97 - "Detect Csp"
Cohesion: 0.20
Nodes (10): detectCsp(), INLINE_HEADER_SIGNALS, LAYOUT_EXTS, MONOREPO_HELPER_SIGNALS, NUXT_ROUTE_RULES_SIGNALS, NUXT_SECURITY_SIGNALS, SCAN_EXTS, SKIP_DIRS (+2 more)

### Community 98 - "Palette"
Cohesion: 0.24
Nodes (7): args, buildWeights(), hashUnit(), pickSeed(), seed, SEEDS, weightedPick()

### Community 99 - "Staleness Notice"
Cohesion: 0.38
Nodes (9): appendStalenessDirective(), buildStalenessDirective(), cachePath(), filterFreshFindings(), pruneCache(), readCache(), readJson(), stalenessCheckDisabled() (+1 more)

### Community 100 - "Inline Ignores"
Cohesion: 0.40
Nodes (9): addRules(), applyInlineIgnores(), getSet(), hasDirectives(), isInlineIgnored(), normalizeRule(), parseInlineIgnores(), parseRuleList() (+1 more)

### Community 101 - "Template Extensions"
Cohesion: 0.29
Nodes (8): shouldEmitAckForFile(), extensionCache, LIVE_TEMPLATE_EXTENSIONS, matchConfiguredExtension(), mergeExtensions(), normalizeExtensionEntries(), readLiveTemplateExtensions(), safeReadJson()

### Community 102 - "Svelte Component"
Cohesion: 0.24
Nodes (10): applyLegacyDeferredAcceptsOnStartup(), loadSvelteCompiler(), applyDeferredSvelteComponentAccepts(), bumpSvelteComponentPreviewRevision(), compileCheckVariants(), deferredAcceptsPath(), findSvelteComponentManifest(), readDeferredAccepts() (+2 more)

### Community 103 - "Package"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 104 - "Source Search"
Cohesion: 0.28
Nodes (8): IMPECCABLE_DIR, matchesTemplateExtension(), resolveLiveTemplateExtensions(), findSessionFile(), findSourceFile(), NEVER_SOURCE_DIRS, SOURCE_SEARCH_DIRS, walk()

### Community 105 - "Live Complete"
Cohesion: 0.39
Nodes (7): FORBIDDEN, verifyAcceptedFile(), verifyAcceptedSource(), completeCli(), completeThroughServer(), parseArgs(), readServerInfo()

### Community 106 - "Nuxt"
Cohesion: 0.31
Nodes (7): applyNuxtLiveAdapter(), buildNuxtPlugin(), nuxt, NUXT_PLUGIN_MARKER, NUXT_PLUGIN_NAME, removeNuxtLiveAdapter(), buildLiveScriptSrc()

### Community 107 - "Detect Antipatterns Browser"
Cohesion: 0.32
Nodes (8): borderColorsFromStyle(), borderWidthsFromStyle(), checkElementGptBorderShadow(), checkElementGptBorderShadowDOM(), checkGptThinBorderWideShadow(), cssColorAlpha(), shadowLayerAlpha(), shadowMaxBlurPx()

### Community 108 - "Hook Lib"
Cohesion: 0.36
Nodes (8): coLocatedStylesheets(), expandScanTargets(), hasPathTraversal(), isInsideProject(), looksLikeProjectRoot(), normalizeScanTargets(), parseStaticStyleImports(), resolveCacheCwd()

### Community 109 - "Source Lock"
Cohesion: 0.50
Nodes (7): isLiveServerPidReachable(), clearStaleLock(), readLock(), releaseOwnLock(), sleepSync(), sourceLockPath(), withSourceLockSync()

### Community 110 - "Browser Script Parts"
Cohesion: 0.33
Nodes (6): assembleLiveBrowserScript(), assertLiveBrowserScriptParts(), LIVE_BROWSER_SCRIPT_PARTS, readLiveBrowserScriptParts(), resolveLiveBrowserScriptParts(), loadBrowserScripts()

### Community 111 - "Detect Antipatterns Browser"
Cohesion: 0.40
Nodes (5): checkPageLayout(), isCardLike(), isCardLikeFromProps(), parseRadiusToPx(), resolveBorderRadiusPx()

### Community 112 - "Tsconfig"
Cohesion: 0.40
Nodes (4): compilerOptions, paths, files, references

### Community 113 - "Hook"
Cohesion: 0.83
Nodes (3): isStopEvent(), main(), readStdin()

### Community 114 - "Provider"
Cohesion: 0.50
Nodes (3): IMPECCABLE_COMMAND, IMPECCABLE_COMMAND_PREFIX, IMPECCABLE_PROVIDER_ID

### Community 116 - "Brand & Template Identity"
Cohesion: 0.67
Nodes (3): index.html — App Shell, Ayad Développement brand commitments (logo, accent color), README.md — Vite React TypeScript Template

## Ambiguous Edges - Review These
- `shadcn/ui SKILL.md (.agents)` → `shadcn MCP Server (.agents)`  [AMBIGUOUS]
  .agents/skills/shadcn/SKILL.md · relation: conceptually_related_to
- `shadcn/ui SKILL.md (.claude)` → `shadcn MCP Server (.claude)`  [AMBIGUOUS]
  .claude/skills/shadcn/SKILL.md · relation: conceptually_related_to
- `/impeccable document (DESIGN.md generation flow)` → `shape.md (task-brief interview flow)`  [AMBIGUOUS]
  .claude/skills/impeccable/reference/document.md · relation: references
- `craft-floor.md (contrast/spacing/type floors applied during live generation)` → `new-work flow (new visual work / identity replacement)`  [AMBIGUOUS]
  .claude/skills/impeccable/reference/new-work.md · relation: references
- `README.md — Vite React TypeScript Template` → `index.html — App Shell`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **389 isolated node(s):** `here`, `API_BASE`, `API_TIMEOUT_MS`, `localStates`, `SEED_MODES` (+384 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `shadcn/ui SKILL.md (.agents)` and `shadcn MCP Server (.agents)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `shadcn/ui SKILL.md (.claude)` and `shadcn MCP Server (.claude)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `/impeccable document (DESIGN.md generation flow)` and `shape.md (task-brief interview flow)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `craft-floor.md (contrast/spacing/type floors applied during live generation)` and `new-work flow (new visual work / identity replacement)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `README.md — Vite React TypeScript Template` and `index.html — App Shell`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `createManualEditRoutes()` connect `Manual Edits Buffer` to `Css Cascade`, `Live Manual Edit Evidence`, `Live Server`, `Event Validation`, `Live Commit Manual Edits`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `confirm()` connect `Main` to `Confirm Dialog UI`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._