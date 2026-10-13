// Contenu de la section Aide (FEATURE-aide.md). Chaque libellé entre « » est celui de l'écran : le vérifier dans
// la page concernée avant de le changer.

type ThemeAide = 'prise-en-main' | 'journee' | 'prospections' | 'dossiers' | 'equipe' | 'resultats';

export interface GuideAide {
  slug: string;
  theme: ThemeAide;
  titre: string;
  /** La phrase « À quoi ça sert ». */
  resume: string;
  etapes: readonly string[];
  bonASavoir?: readonly string[];
  attention?: readonly string[];
  /** Route de l'écran décrit, pour le lien « Ouvrir l'écran ». */
  ecran?: string;
  /** `chefs` : chefs d'équipe, administration et direction générale seulement. */
  public: 'tous' | 'chefs';
  /** Adresse d'une vidéo (lot 2) ; rien n'est affiché tant qu'elle est absente. */
  video?: string;
}

export const THEMES_AIDE: readonly { cle: ThemeAide; titre: string }[] = [
  { cle: 'prise-en-main', titre: 'Prise en main' },
  { cle: 'journee', titre: 'Ma journée de commercial' },
  { cle: 'prospections', titre: 'Pré-prospections et prospections' },
  { cle: 'dossiers', titre: 'Dossiers de vente et encaissements' },
  { cle: 'equipe', titre: "Mon équipe (chefs d'équipe)" },
  { cle: 'resultats', titre: 'Mes résultats' },
];

export const GUIDES_AIDE: readonly GuideAide[] = [
  {
    slug: 'premiere-connexion',
    theme: 'prise-en-main',
    titre: 'Première connexion : mot de passe et profil',
    resume: 'Ouvrir votre session, choisir votre mot de passe et compléter vos informations personnelles.',
    etapes: [
      "Sur l'écran « Connexion », saisissez votre « Nom d'utilisateur » et votre « Mot de passe ». Cliquez sur « Se connecter ».",
      'Cliquez sur votre nom, en bas de la barre latérale. La page « Mon profil » s\'ouvre.',
      'Dans la carte « Sécurité », saisissez le « Mot de passe actuel », puis deux fois le nouveau. Cliquez sur « Changer le mot de passe ».',
      'Dans la carte « Informations personnelles », cliquez sur « Modifier ».',
      'Renseignez prénom, nom, téléphone mobile, email et date de naissance. L\'adresse est facultative. Cliquez sur « Enregistrer ».',
      "Pour quitter l'application, cliquez sur l'icône de sortie à côté de votre nom (« Se déconnecter »).",
    ],
    bonASavoir: [
      'Le nouveau mot de passe doit faire au moins 8 caractères.',
      "Le téléphone, la date de naissance et l'adresse ne sont pas réaffichés : ressaisissez-les à chaque modification.",
      'La carte « Projets affectés » montre les projets que vous voyez. Seul un administrateur peut la changer.',
    ],
    attention: [
      'Message « Identifiants invalides ou compte désactivé » : vérifiez votre saisie. Si le problème continue, un administrateur peut réinitialiser votre mot de passe.',
      'Message « Votre session a expiré » : reconnectez-vous simplement.',
    ],
    ecran: '/profil',
    public: 'tous',
  },
  {
    slug: 'se-reperer',
    theme: 'prise-en-main',
    titre: "Se repérer dans l'application",
    resume: 'Comprendre la barre latérale, les modules, le thème clair ou sombre et la cloche des notifications.',
    etapes: [
      'La barre latérale, à gauche, liste les écrans du module en cours, rangés par rubriques (« Mon activité », « Pipeline », « Dossiers »…).',
      'Cliquez sur le titre d\'une rubrique pour la replier ou la déplier.',
      'Le bouton en haut à gauche de chaque page (« Afficher/masquer la barre latérale ») réduit la barre ou la fait revenir.',
      'Pour changer de module (Vente, Patrimoine…), cliquez sur l\'icône en grille en haut à droite (« Changer de module »), puis sur le module voulu.',
      "Pour passer en thème sombre ou clair, cliquez sur l'icône lune ou soleil en haut à droite.",
      'La cloche, en haut à droite, ouvre vos notifications. La pastille rouge donne le nombre de non lues. Cliquez sur une notification pour aller sur l\'écran concerné.',
      'En bas de la barre latérale, « Actions récentes » rappelle vos dernières opérations (onglets « Mes actions » et « Équipe »). « Ouvrir » affiche la fiche concernée.',
    ],
    bonASavoir: [
      'Le menu dépend de votre rôle. Un commercial arrive directement sur « Ma journée ».',
      'Dans la cloche, « Tout marquer comme lu » efface la pastille. « Activer les notifications » autorise votre navigateur à vous prévenir.',
      'Le thème choisi et les rubriques repliées sont gardés sur ce navigateur.',
    ],
    public: 'tous',
  },
  {
    slug: 'ma-journee',
    theme: 'journee',
    titre: 'Ma journée : par où commencer',
    resume: "Votre page d'accueil : tout ce qui est à faire aujourd'hui, en quatre cartes.",
    etapes: [
      'Ouvrez « Ma journée ». Le bandeau du haut résume vos leads à trier, vos appels, vos visites et vos retards.',
      'Commencez par « À faire maintenant » : ce sont vos nouveaux leads. Cliquez sur « Trier » pour les traiter dans la Boîte de tri.',
      'Passez ensuite à « Appels et relances du jour ». Les boutons téléphone et WhatsApp lancent l\'appel ou le message, puis le formulaire « Ajouter une action » s\'ouvre pour noter l\'échange.',
      'Dans « Visites du jour », cliquez sur « Visite faite » après la visite. Complétez le formulaire et cliquez sur « Enregistrer ».',
      'Finissez par « En retard » : les relances prévues avant aujourd\'hui et pas encore faites.',
      'Cliquez sur un nom pour ouvrir sa fiche sans quitter la page.',
    ],
    bonASavoir: [
      'Plus un lead attend, moins il répond : traitez les nouveaux leads en premier.',
      'Chaque carte montre les premières lignes. La mention « + N autres » indique qu\'il en reste.',
      'Un chef d\'équipe peut choisir un commercial dans la liste « Commercial » pour voir sa journée.',
    ],
    ecran: '/journee',
    public: 'tous',
  },
  {
    slug: 'boite-de-tri',
    theme: 'journee',
    titre: 'La boîte de tri : trier les nouveaux leads',
    resume: 'Traiter vos nouveaux leads un par un, au clavier ou à la souris.',
    etapes: [
      'Ouvrez « Boîte de tri ». Un seul lead s\'affiche à la fois, le plus récent d\'abord, avec son téléphone, sa source et le « Message du formulaire ».',
      'Touche 1, « Appeler / WhatsApp » : contactez le lead, puis notez l\'échange dans le formulaire qui s\'ouvre.',
      'Touche 2, « Pas joignable » : le lead quitte la boîte et revient demain à 10:00 dans « Ma journée ».',
      'Touche 3, « Qualifier et attribuer » : choisissez le « Commercial » et la « Tranche », puis cliquez sur « Transformer ». Le lead devient une prospection.',
      "Touche 4, « Archiver » : choisissez la « Raison », puis cliquez sur « Confirmer l'archivage ».",
      'Le lead suivant arrive dès que le précédent est enregistré. La barre de progression montre où vous en êtes.',
    ],
    bonASavoir: [
      'Par défaut, seuls les leads de moins de 6 mois sont proposés. Cochez « Inclure les leads de plus de 6 mois » pour voir les autres.',
      'Au clavier, la touche 1 lance aussi l\'appel.',
      'Les touches 1 à 4 ne réagissent pas pendant que vous écrivez dans un champ.',
      "Si le lead n'a pas encore de fiche prospect, la touche 3 ouvre d'abord « Créer la fiche prospect ».",
    ],
    attention: [
      "L'encadré « Doublon possible » signale une fiche avec le même numéro, le même e-mail ou le même nom. Vérifiez-la avant de qualifier.",
      'Pour un doublon, l\'archivage propose la raison « PROSPECTION EN DOUBLE ».',
    ],
    ecran: '/tri',
    public: 'tous',
  },
  {
    slug: 'calendrier-et-relances',
    theme: 'journee',
    titre: 'Le calendrier et les relances',
    resume: 'Programmer une relance et retrouver vos rendez-vous et visites.',
    etapes: [
      'Pour programmer une relance, ouvrez la prospection et cliquez sur « Ajouter une action ». Renseignez la « Date alerte ».',
      'Le jour venu, la relance apparaît dans « Appels et relances du jour » de « Ma journée ». Si elle n\'est pas faite, elle passe ensuite dans « En retard ».',
      'Si le « Résultat » choisi est un rendez-vous, le champ « Date et heure du rendez-vous » apparaît : il est obligatoire.',
      'Ouvrez « Calendrier » : vos rendez-vous et visites s\'affichent sur le mois.',
      'Cliquez sur un jour pour voir le détail à droite. « Voir la prospection » ouvre la fiche.',
      "Changez de mois avec les flèches. « Aujourd'hui » revient au mois en cours. La carte « À venir » liste les prochains rendez-vous.",
    ],
    bonASavoir: [
      'Certains résultats rendent la « Date alerte » obligatoire : le formulaire l\'indique.',
      'Dans le détail du jour, chaque événement porte la mention « Rendez-vous » ou « Visite ».',
    ],
    ecran: '/calendrier',
    public: 'tous',
  },
  {
    slug: 'hotline',
    theme: 'journee',
    titre: 'La hotline : retrouver un contact',
    resume: 'Identifier un appelant en quelques secondes, par son numéro ou par son nom.',
    etapes: [
      'Ouvrez « Hotline ». Choisissez « Téléphone » ou « Nom ».',
      'Saisissez le numéro, ou une partie du nom. Cliquez sur « Rechercher » ou appuyez sur Entrée.',
      'Si la personne est connue, sa fiche s\'affiche avec les onglets « Général », « Prospections », « Dossiers », « Règlements », « Interactions » et « Historique ».',
      'Cliquez sur une prospection ou un dossier pour le déplier sans quitter l\'écran. « Fiche complète » ouvre la page entière.',
      'Si ce numéro a déjà appelé sans avoir de fiche, la carte « Appels antérieurs sans fiche » s\'affiche. Cliquez sur « Créer une fiche » pour l\'enregistrer.',
    ],
    bonASavoir: [
      'Espaces, tirets et indicatif sont ignorés : « +212 6 12 34 56 78 » et « 0612345678 » donnent le même résultat.',
      'La recherche par nom ignore majuscules et accents. Il faut au moins 2 caractères.',
      'Au-delà de 20 fiches portant ce nom, seules les 20 premières s\'affichent : précisez le nom ou cherchez par téléphone.',
    ],
    ecran: '/hotline',
    public: 'tous',
  },
  {
    slug: 'saisir-pre-prospection',
    theme: 'prospections',
    titre: 'Saisir ou importer des pré-prospections',
    resume: 'Enregistrer un nouveau lead à la main, ou importer tout un fichier de leads.',
    etapes: [
      'Ouvrez « Pré-prospections » et cliquez sur « Nouvelle pré-prospection ».',
      'Seul le « Nom » est obligatoire. Complétez si possible le téléphone, l\'email, le projet, la tranche, la « Source de contact » et le « Support ».',
      'Cliquez sur « Créer la pré-prospection ». Un message indique à quel commercial elle est attribuée.',
      'Pour importer un fichier, cliquez sur « Importer des leads ». Choisissez le fichier CSV, puis cliquez sur « Analyser le fichier ».',
      'Lisez l\'aperçu : chaque ligne est « Nouvelle », « Doublon », « Déjà importée » ou « Erreur ». Rien n\'est encore enregistré.',
      'Choisissez la « Tranche » (obligatoire) et cochez les lignes à importer. Cliquez sur le bouton « Importer … lignes ».',
    ],
    bonASavoir: [
      "Un doublon n'est jamais refusé : la pré-prospection est créée et les fiches existantes vous sont signalées.",
      "Le fichier attendu est l'export CSV des leads (Meta / Leads Center), tel quel, avec 5 000 lignes au plus.",
      'Les lignes « Déjà importée » et « Erreur » ne sont jamais importées.',
    ],
    attention: [
      'Toutes les lignes du fichier sont rattachées à la même tranche. Découpez avant l\'import un fichier qui mélange plusieurs tranches.',
    ],
    ecran: '/pre-prospections',
    public: 'tous',
  },
  {
    slug: 'transformer-en-prospection',
    theme: 'prospections',
    titre: 'Transformer une pré-prospection en prospection',
    resume: 'Qualifier un lead : créer sa fiche prospect, puis en faire une prospection suivie.',
    etapes: [
      'Ouvrez la pré-prospection depuis « Pré-prospections ».',
      'Cliquez sur « Créer prospect ». Vérifiez l\'identité pré-remplie : « Prénom », « Nom » et « Téléphone » sont obligatoires. Cliquez sur « Créer ».',
      'Si des fiches existantes ressemblent à cette personne, elles s\'affichent. Cliquez sur « Rattacher » si c\'est la même, sinon sur « Nouveau contact ».',
      'Cliquez ensuite sur « Transformer ». Choisissez le « Commercial » et la « Tranche ». L\'« Article » est facultatif.',
      'Cliquez sur « Transformer ». La fiche devient une prospection et se retrouve dans « Prospections ».',
    ],
    bonASavoir: [
      'Dans la liste, le menu d\'actions d\'une ligne (les trois points) propose aussi « Transformer en prospect », puis « Transformer en prospection ».',
      'La Boîte de tri fait la même chose avec la touche 3.',
    ],
    attention: [
      "Un prospect n'a qu'une prospection ouverte par projet. Si elle existe déjà, l'écran le dit et propose « Ouvrir la prospection ».",
    ],
    ecran: '/pre-prospections',
    public: 'tous',
  },
  {
    slug: 'suivre-prospection',
    theme: 'prospections',
    titre: 'Suivre une prospection',
    resume: 'Faire avancer une prospection : étapes, actions, relances, archivage.',
    etapes: [
      'Ouvrez « Prospections ». Les filtres du haut (étape, origine, tranche, commercial, dates) aident à la retrouver. Le bouton « Kanban » les range en colonnes.',
      'Onglet « Étape » : choisissez la nouvelle étape dans « Changer d\'étape ». Cliquez ensuite sur « Enregistrer » dans le bandeau « modification non enregistrée ».',
      'Onglet « Actions » : après chaque appel, visite ou note, cliquez sur « Ajouter une action ». Choisissez l\'« Action », le « Résultat », écrivez le « Message » et enregistrez.',
      'Pour être relancé, remplissez la « Date alerte » de l\'action. La relance apparaîtra dans « Ma journée ».',
      "Pour une prospection perdue, cliquez sur « Archiver ». Choisissez la « Raison » et cliquez sur « Confirmer l'archivage ».",
      'Pour la reprendre, ouvrez-la et cliquez sur « Désarchiver ».',
    ],
    bonASavoir: [
      'Le badge « N j sans action », en tête de fiche, dit depuis combien de jours rien n\'a été fait.',
      'La mention « Relance jusqu\'au … » rappelle une alerte en cours.',
      'Par défaut, la liste montre le mois en cours, sans les prospections archivées. Changez les dates ou le filtre « Archivé » pour en voir plus.',
      'Pour une note, le « Message » est obligatoire et le « Résultat » ne l\'est pas.',
    ],
    ecran: '/prospections',
    public: 'tous',
  },
  {
    slug: 'offre-de-prix',
    theme: 'prospections',
    titre: 'Envoyer une offre de prix, créer une offre',
    resume: 'Envoyer un prix au prospect par email et WhatsApp, ou préparer une offre (devis) détaillée.',
    etapes: [
      'Ouvrez la prospection, onglet « Choix article ». Si aucun lot n\'est rattaché, ouvrez la sélection (« Modifier »), choisissez la tranche et l\'article, puis cliquez sur « Modifier » sous la liste.',
      'À partir de l\'étape « 4 APRES VISITES », la ligne « Offre de prix » apparaît. Cliquez sur « Envoyer l\'offre au prospect » : le formulaire s\'ouvre et le bouton devient « Fermer ».',
      'Renseignez si besoin une « Remise (%) », un « Prix imposé TTC », le « Mode de paiement » et une note. Cliquez sur « Établir et envoyer l\'offre ».',
      "L'écran affiche le numéro de l'offre, son montant, et pour l'email comme pour WhatsApp si l'envoi est parti.",
      'Pour préparer une offre sans l\'envoyer, ouvrez l\'onglet « Offres » et cliquez sur « Nouvelle offre ». Choisissez la tranche, l\'article, le prix et la remise, puis cliquez sur « Créer l\'offre ».',
      'Cliquez sur « Fiche offre » pour voir le document de l\'offre.',
    ],
    bonASavoir: [
      'Sans remise ni prix imposé, l\'offre part au plein tarif du lot, et une offre déjà établie est renvoyée telle quelle.',
      'Une offre sans article (« Aucun — offre libre ») exige un prix.',
      'Toutes les offres se retrouvent dans l\'écran « Offres ».',
    ],
    attention: [
      "Si un envoi n'est pas parti (pas d'adresse email, numéro inutilisable), corrigez la fiche, puis relancez l'envoi.",
    ],
    ecran: '/offres',
    public: 'tous',
  },
  {
    slug: 'prospects',
    theme: 'prospections',
    titre: 'Les prospects : fiche, contacts, historique',
    resume: "Consulter et mettre à jour la fiche d'une personne, et tout ce qui la concerne.",
    etapes: [
      'Ouvrez « Prospects ». Cherchez par nom, téléphone ou email dans la barre de recherche.',
      'Cliquez sur une ligne pour ouvrir la fiche. L\'onglet « Général » montre les coordonnées. Cliquez sur « Modifier » pour les corriger, puis sur « Enregistrer ».',
      'Onglet « Contacts » : cliquez sur « Ajouter un contact » pour lier une autre personne, déjà connue (« Tiers existant ») ou non (« Nouvelle personne »).',
      'Onglet « Prospections » : ses prospections. « Nouvelle prospection » en crée une pour ce prospect.',
      'Les onglets « Dossiers », « Règlements » et « Historique » retracent ses achats, ses paiements et son historique.',
      'Pour créer un prospect directement, cliquez sur « Nouveau prospect » dans la liste.',
    ],
    bonASavoir: [
      'Cliquez sur une ligne de prospection ou de dossier pour la déplier. « Ouvrir → » ouvre la fiche complète.',
    ],
    ecran: '/prospects',
    public: 'tous',
  },
  {
    slug: 'creer-dossier',
    theme: 'dossiers',
    titre: 'Créer un dossier de vente',
    resume: 'Passer une prospection aboutie en dossier de vente, avec la simulation du financement.',
    etapes: [
      'Ouvrez la prospection et cliquez sur « Créer un dossier », en haut à droite.',
      'Carte « Sélectionner un article » : les lots de la prospection sont déjà choisis. Pour en changer, cliquez sur « Modifier » et cochez les lots dans la liste.',
      'Carte « Prix & remise » : vérifiez le prix, la « Remise commerciale » éventuelle, le « CIN du client » et le « Mode de paiement ». Ces deux derniers sont obligatoires.',
      'La carte « Schéma de financement » calcule les montants dus (avance, frais de syndic…) et le « Total général ».',
      'Cliquez sur « Créer le dossier ». La fiche du dossier s\'ouvre.',
      'Si le schéma de financement est vide, complétez-le : onglet « Schéma de financement », bouton « Ajouter une échéance ».',
    ],
    bonASavoir: [
      'Le prix, la remise et les notes sont repris de la dernière offre de la prospection, quand elle existe.',
      'Rien n\'est créé ni réservé avant le clic sur « Créer le dossier ».',
      'Une remise de plus de 30 % est signalée : vérifiez-la avant de valider.',
      'Le bouton « Créer un dossier » apparaît sur une prospection déjà transformée. Il est grisé si elle est archivée.',
    ],
    attention: [
      'Vérifiez le prix avant de valider : il ne se modifie pas ensuite depuis la fiche du dossier.',
    ],
    ecran: '/prospections',
    public: 'tous',
  },
  {
    slug: 'avancer-dossier',
    theme: 'dossiers',
    titre: 'Faire avancer un dossier : statuts et documents',
    resume: 'Passer le dossier d\'une étape à la suivante et sortir ses documents PDF.',
    etapes: [
      'Ouvrez le dossier depuis « Dossiers de vente ». Son statut s\'affiche en tête de fiche.',
      'Onglet « Statut » : cliquez sur l\'étape voulue (Concrétisation, Compromis, Envoi au notaire…).',
      'Dans la fenêtre « Passer à … ? », indiquez la date si elle est demandée et un motif si besoin. Cliquez sur « Confirmer ».',
      'Pour une annulation ou un désistement, cliquez sur « Annulé » ou « Désistement », sur la ligne « Sorties ».',
      'Onglet « Documents générés » : « Aperçu » affiche le document (fiche de réservation, acte de réservation, fiche bancaire…). « Télécharger » l\'enregistre en PDF, ou en Word quand c\'est proposé.',
      'Onglet « Pièces jointes » : cliquez sur « Ajouter une pièce jointe », choisissez le fichier, puis cliquez sur « Envoyer ».',
    ],
    bonASavoir: [
      'Les documents sont générés à partir des données du dossier, au moment du clic.',
      'L\'onglet « Historique » garde la trace des événements du dossier.',
    ],
    attention: [
      'Si la fenêtre indique que « le saut sera forcé », l\'étape choisie n\'est pas la suite normale : vérifiez avant de confirmer.',
      'La suppression d\'une pièce jointe est définitive.',
    ],
    ecran: '/dossiers',
    public: 'tous',
  },
  {
    slug: 'echeancier-et-reglements',
    theme: 'dossiers',
    titre: 'Échéancier, règlements et preuves de paiement',
    resume: 'Enregistrer les paiements du client et les justifier.',
    etapes: [
      'Ouvrez le dossier, onglet « Schéma de financement ». Chaque ligne est une échéance, avec son montant et son statut.',
      'Pour un paiement, cliquez sur « + Règlement » sur la ligne de l\'échéance.',
      'Renseignez le « Montant », « Réglé par » et le « Type de règlement », plus la banque ou la référence si elles sont demandées. Cliquez sur « Ok ».',
      'Cliquez sur la ligne de l\'échéance pour voir ses règlements. Le trombone (« Preuves de paiement ») ouvre le dépôt : choisissez le fichier, ajoutez une légende, cliquez sur « Déposer ».',
      'Une fois l\'argent reçu, cliquez sur « Pointer ». Vérifiez la « Date d\'encaissement », puis cliquez sur « Pointer ».',
      'Les icônes en forme d\'œil affichent le reçu et l\'autorisation d\'encaissement. Les flèches les téléchargent.',
    ],
    bonASavoir: [
      'Le montant d\'un règlement ne peut pas dépasser le reste à régler de l\'échéance.',
      'Les mêmes gestes existent dans « Encaissements » : ouvrez un règlement, onglet « Documents joints ».',
    ],
    attention: [
      'Pour pointer un règlement, il faut au moins une preuve de paiement (chèque scanné, avis de virement…).',
      '« Pointé » et « Annulé » sont des états définitifs.',
      'Sans acquéreur rattaché au dossier, aucun règlement ne peut être enregistré.',
    ],
    ecran: '/dossiers',
    public: 'tous',
  },
  {
    slug: 'distribuer-leads',
    theme: 'equipe',
    titre: 'Distribuer les nouveaux leads',
    resume: 'Attribuer les pré-prospections sans commercial, à la main ou automatiquement.',
    etapes: [
      'Ouvrez « Mon équipe ». En haut, choisissez la « Période » et, si besoin, un « Projet ».',
      'La carte « À distribuer » liste les pré-prospections sans commercial, les plus anciennes d\'abord.',
      'À la main : cochez des lignes (ou « Tout cocher »), choisissez un commercial, puis cliquez sur « Distribuer ».',
      'Automatiquement : cliquez sur « Répartir automatiquement ». Un aperçu dit qui reçoit quoi. Cliquez sur « Confirmer » pour valider.',
      'Cliquez sur le nom d\'un lead pour ouvrir sa fiche sans quitter l\'écran.',
    ],
    bonASavoir: [
      'Par défaut, la période couvre les 30 derniers jours.',
      'Seules les pré-prospections jamais traitées sont listées. Cochez « Voir tout (y compris déjà traitées) » pour tout afficher.',
      'Sans ligne cochée, « Répartir automatiquement » porte sur toute la liste filtrée. Avec des lignes cochées, seulement sur elles.',
      'La répartition automatique donne chaque lead au commercial le moins chargé de son projet.',
      'Les dates « Reçues du … au … » de la carte se changent à part. « Effacer » revient à la période du haut.',
    ],
    ecran: '/equipe',
    public: 'chefs',
  },
  {
    slug: 'reaffecter-leads',
    theme: 'equipe',
    titre: "Réaffecter les leads d'un commercial et lire leur état",
    resume: 'Reprendre les leads d\'un commercial et les confier à un autre, en repérant ceux qui dorment.',
    etapes: [
      'Dans « Mon équipe », la carte « Par commercial » donne pour chacun : portefeuille ouvert, « Sans action > 7 j », relances en retard, dossiers.',
      'Cliquez sur la ligne d\'un commercial. La fenêtre « Leads de … » s\'ouvre, avec les onglets « Pré-prospections » et « Prospections ».',
      'Chaque lead indique son nombre d\'actions et sa dernière activité. En rouge : jamais traité, ou sans action depuis plus de 7 jours.',
      'Les filtres « Jamais traitées » et « Endormies » isolent ces leads. Cochez-les, ou cliquez sur « Tout cocher ».',
      'Choisissez le « Nouveau commercial », ajoutez un motif si besoin, puis cliquez sur « Réaffecter ».',
    ],
    bonASavoir: [
      'Les leads cochés dans les deux onglets partent en une seule fois.',
      'Seuls les leads ouverts, reçus sur la période et le projet choisis en haut de l\'écran, sont listés.',
    ],
    ecran: '/equipe',
    public: 'chefs',
  },
  {
    slug: 'affecter-projets',
    theme: 'equipe',
    titre: 'Affecter les commerciaux aux projets',
    resume: 'Choisir les projets sur lesquels travaille chaque commercial.',
    etapes: [
      'Dans « Mon équipe », descendez jusqu\'à la carte « Affectation aux projets ». Une coche indique qu\'un commercial est affecté au projet.',
      'Cliquez sur « Modifier » sur la ligne du commercial.',
      'Cochez ou décochez les projets, puis cliquez sur « Enregistrer ».',
    ],
    bonASavoir: [
      'Seuls vos projets sont listés. Ses autres affectations ne changent pas.',
      'Un commercial garde toujours au moins un projet.',
      'Les commerciaux marqués « (hors équipe) » peuvent être ajoutés à vos projets.',
      'La mention « géré par l\'administrateur » signale une ligne qui ne se modifie pas ici.',
    ],
    ecran: '/equipe',
    public: 'chefs',
  },
  {
    slug: 'mes-performances',
    theme: 'resultats',
    titre: 'Mes performances et le suivi de mes actions',
    resume: 'Mesurer votre activité et retrouver toutes les actions que vous avez saisies.',
    etapes: [
      'Ouvrez « Mes performances ».',
      'Choisissez la période : « 30 jours », « 90 jours », « Ce mois », ou deux dates.',
      '« Activité réalisée » compte ce que vous avez saisi : appels, rendez-vous, visites, actions.',
      '« Portefeuille confié » montre les prospections qui vous sont assignées et votre délai de première réponse.',
      '« Résultat » donne vos dossiers créés, le montant total et vos taux de conversion.',
      'Ouvrez « Mes actions » pour la liste de vos actions. Filtrez par période (« Aujourd\'hui », « Ce mois »), par action ou par tranche. Cliquez sur une ligne pour voir le détail.',
    ],
    bonASavoir: [
      'Par défaut, la période couvre les 30 derniers jours.',
      'Sur une période courte, les taux sont peu fiables : lisez-les avec les nombres affichés dessous.',
      'Des compteurs à zéro ne sont pas une erreur : aucune activité n\'a été enregistrée sur la période.',
    ],
    ecran: '/mes-performances',
    public: 'tous',
  },
];
