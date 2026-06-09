import { reactive, watch } from 'vue';
import { appSettings, type LanguageCode } from '../utils/appSettings';

const frenchCrewText = {
  morningIntro: {
    title: 'Matin salin...',
    body: 'À ton tour, fidèle équipage !',
  },
  diceRoll: {
    title: 'Mesure du vent',
    body: 'Observation en cours...',
    primaryButton: 'Mesurer le vent',
  },
  afterRoll: {
    noMovementButton: 'Passer à l’après-midi',
    moveButton: 'Mettre les voiles',
    secondaryButton: 'J’ai une carte dé',
  },
  chooseCard: {
    title: 'Laquelle ?',
    body: 'Appuie sur l’une des trois cartes.',
    undoLabel: 'Retour',
    cards: [
      {
        title: 'On n’a rien vu',
        caption: 'Rien à signaler pour l’instant.',
      },
      {
        title: 'Coup de burst',
        caption: 'Effet à préciser.',
      },
      {
        title: 'Accalmie',
        caption: 'La mer se calme un instant.',
      },
    ],
  },
  afternoonIntro: {
    title: 'Midi passé, mettons le cap sur...',
    body: 'Choisis la direction de ton déplacement.',
    undoLabel: 'Retour',
    primaryButton: 'Suivant',
  },
  directionConfirm: {
    title: 'T’es sûr.e de ton choix ?',
    body: 'Il te reste XX mouvement.',
    primaryButton: 'Révéler la case',
    secondaryButton: 'Retour',
  },
  nightFalls: {
    title: 'La nuit tombe !',
    body: 'Avec la tombée du jour, vous êtes en manque de rhum...',
  },
} as const;

const englishCrewText = {
  morningIntro: {
    title: 'Briny morning...',
    body: 'Your turn, loyal crew!',
  },
  diceRoll: {
    title: 'Reading the wind',
    body: 'Observation in progress...',
    primaryButton: 'Read the wind',
  },
  afterRoll: {
    noMovementButton: 'Skip to afternoon',
    moveButton: 'Set sail',
    secondaryButton: 'I have a die card',
  },
  chooseCard: {
    title: 'Which one?',
    body: 'Tap one of the three cards.',
    undoLabel: 'Back',
    cards: [
      {
        title: 'We saw nothing',
        caption: 'Nothing to report for now.',
      },
      {
        title: 'Burst move',
        caption: 'Effect to define.',
      },
      {
        title: 'Calm spell',
        caption: 'The sea calms down for a moment.',
      },
    ],
  },
  afternoonIntro: {
    title: 'After noon, set a course...',
    body: 'Choose your movement direction.',
    undoLabel: 'Back',
    primaryButton: 'Next',
  },
  directionConfirm: {
    title: 'Are you sure?',
    body: 'You have XX move left.',
    primaryButton: 'Reveal the tile',
    secondaryButton: 'Back',
  },
  nightFalls: {
    title: 'Night falls!',
    body: 'As night falls, the crew starts craving rum...',
  },
} as const;

const translations = {
  fr: {
    common: {
      next: 'Suivant',
      back: 'Retour',
      undo: 'Retour',
      cancel: 'Annuler',
      confirm: 'Valider',
      close: 'Fermer',
      useCard: 'Utiliser une carte',
      suffer: 'Subir',
      notPlayable: 'Non jouable',
      alreadyPlayedThisTurn: 'Déjà jouée ce tour',
      playableIn: 'Jouable en',
      noDangerToEliminate: 'Pas de danger à éliminer',
      notEnoughRhum: 'Pas assez de rhum',
    },
    ui: {
      orientationTitle: 'Tourne ton téléphone',
      orientationBody: 'Passe en mode paysage pour continuer.',
      menuButtonLabel: 'Menu',
      fullscreenButtonLabel: 'Plein écran',
    },
    settings: {
      title: 'Paramètres',
      music: 'Musique',
      soundEffects: 'Effets audio',
      language: 'Langue',
      french: 'Français',
      english: 'English',
      performanceMode: 'Mode performance',
      closeLabel: 'Fermer les paramètres',
    },
    gameMenu: {
      title: 'Menu',
      saveAndQuit: 'Sauvegarder et quitter',
      parameters: 'Paramètres',
      closeLabel: 'Fermer le menu',
    },
    landing: {
      title: 'Cap’taine !',
      intro: 'L’équipage se prépare à reprendre la mer.',
      primaryButton: 'Commencer la partie',
      resumeButton: 'Reprendre la partie',
      demoButton: 'Partie démo',
      secondaryButton: 'Paramètres',
    },
    setup: {
      gameStart: {
        title: 'Le capitaine a été exilé !',
        body: 'Son équipage et son fidèle perroquet doivent partir à sa recherche...',
        primaryButton: 'Larguer les amarres',
      },
      difficulty: {
        title: 'L’Arrachée doit charger sa cale',
        body: 'Choisis le niveau de difficulté. Moins de rhum rend la partie plus difficile. 6 bouteilles sont conseillées pour une première partie.',
        primaryButton: 'Remplir la cale',
      },
      boatPlacement: {
        title: 'L’Arrachée se situe en',
        body: 'Place la figurine bateau L’Arrachée sur la case correspondante du plateau.',
        primaryButton: 'Suivant',
      },
      initialCardChoice: {
        title: 'L’équipage s’équipe',
        body: 'Choisissez une carte à ajouter à votre main. Les autres seront défaussées.',
      },
    },
    tutorial: {
      nextButton: 'Suivant',
      skipButton: 'Passer le tuto',
      perroquet: {
        title: 'Le Perroquet',
        body: 'Désespéré, il n’arrive pas à communiquer oralement les informations de navigation et doit se contenter de montrer sur la carte.',
      },
      equipage: {
        title: 'L’Équipage',
        body: "Ils souffrent d'une incapacité collective à fonctionner efficacement sans boire régulièrement du rhum. Et leurs réserves sont limitées...",
      },
      corsaires: {
        title: 'Les Corsaires',
        body: 'Ils ont banni le capitaine et naviguent à bord de leur frégate afin de capturer son Équipage pour compléter l’opération.',
        caption: 'Ils avancent de 1 case aléatoirement chaque nuit.',
      },
      miseEnPlace: {
        title: 'Mise en place',
        body: '',
        items: [
          '- Choisissez chacun un rôle',
          '- Placez le plateau entre vous',
          '- Placez les éléments (îles, typhons, monstres, frégate corsaire) en tas côté perroquet',
        ],
      },
    },
    turn1: {
      parrot: {
        dawnIntro: {
          title: 'Debout, c’est l’aurore !',
          body: 'À ton tour, fidèle perroquet !',
          primaryButton: 'Observer et mémoriser les alentours',
          undoLabel: 'Retour',
        },
        observeSurroundings: {
          primaryButton: 'Observer et mémoriser les alentours',
          undoLabel: 'Retour',
        },
        lookAroundTimer: {
          title: 'Observe les alentours',
        },
        helpCrew: {
          title: 'Tu peux désormais aider l’Équipage',
          body: 'Place les éléments en respectant les règles. Choisis une des possibilités suivantes :',
          caption:
            '\nplacer au maximum 1 monstre + 1 île + 1 typhon ; \nplacer 2 monstres ou 2 îles ou 2 typhons ; \ndéplacer 1 monstre ou 1 île ou 1 typhon ; \néchanger 2 éléments entre eux. En plus de cela, vous pouvez indiquer la dernière position connue de la frégate corsaire.',
          primaryButton: 'Passer le téléphone à l’Équipage',
          details: {
            placeTitle: 'Placer',
            oneMonster: '1 monstre',
            oneIsland: '1 île',
            oneTyphoon: '1 typhon',
            twoMonsters: '2 monstres',
            twoIslands: '2 îles',
            twoTyphoons: '2 typhons',
            moveTitle: 'Déplacer un élément',
            swapTitle: 'Échanger deux éléments entre eux',
            or: 'ou',
            footer:
              'En plus de cela vous pouvez indiquer la dernière position connue des corsaires.',
          },
        },
      },
      crew: frenchCrewText,
    },
    turn2Plus: {
      parrot: {
        dawnIntro: {
          title: 'Debout, c’est l’aurore !',
          body: 'À ton tour, fidèle perroquet !',
          primaryButton: "On passe à l'action !",
          undoLabel: 'Retour',
        },
        dawnWithFoodCheck: {
          title: 'Debout, c’est l’aurore !',
          body: 'Perroquet, veux-tu manger une cacahuète ?',
          ownedCountPrefix: 'Tu en possèdes',
          ownedCountSuffix: '.',
          primaryButton: 'Oui',
          secondaryButton: 'Non',
        },
        foodChoice: {
          title: 'De la nourriture ?',
          undoLabel: 'Retour',
          cards: [
            {
              title: 'Cacahuète',
              caption: 'Tu peux effectuer deux actions dans ton tour.',
            },
            {
              title: 'Ver',
              caption: 'Effet à préciser.',
            },
          ],
        },
        dawnChoice: {
          title: 'Que veux-tu faire aujourd’hui ?',
          body: 'Tu peux faire 1 action à ce tour.',
          actionCountPrefix: 'Tu peux faire',
          actionCountSuffix: 'à ce tour.',
          cards: [
            {
              title: 'Observer les alentours',
              caption: 'Regarde les 12 cases proches du bateau pendant 5 secondes.',
            },
            {
              title: 'Repérer la frégate corsaire',
              caption: 'Affiche la case où se situe actuellement la frégate.',
            },
            {
              title: 'Partager des informations',
              caption: 'Utilise les tuiles et pions physiques pour transmettre des indices.',
            },
          ],
          undoLabel: 'Retour',
        },
        dawnChoiceWithHint: {
          title: 'C’est l’aurore !',
          body: 'Quand tu auras terminé, dis-le à ton équipage.',
          cards: [
            {
              title: 'Observer les alentours',
              caption: 'Révèle les environs du navire.',
            },
            {
              title: 'Placer des tuiles',
              caption: 'Une ou deux tuiles. L’équipage ne doit rien voir.',
            },
          ],
          footer: 'à l’équipage',
          undoLabel: 'Retour',
        },
        lookAroundTimer: {
          title: 'Observe les alentours',
        },
        exhaustedAfterObservation: {
          title: 'Épuisé, il te faut te reposer à présent',
          body: 'Tu ne peux pas communiquer ce que tu as découvert durant ton exploration à l’Équipage. Tu pourras lui indiquer au prochain tour si tu choisis l’action “Partager des informations”.',
          primaryButton: 'Passer le téléphone à l’Équipage',
          continueButton: 'Suivant',
        },
        corsairLocation: {
          title: 'La frégate corsaire est en',
          onBoat: 'La frégate corsaire est sur la case du bateau.',
          relativePrefix: 'La frégate corsaire est à',
          relativeJoin: ' et ',
          fromBoatSuffix: 'du bateau.',
          right: 'à droite',
          left: 'à gauche',
          up: 'en haut',
          down: 'en bas',
          lastActionBody:
            'Tu ne peux pas communiquer cette position à l’Équipage. Tu pourras lui indiquer au prochain tour si tu choisis l’action “Partager des informations”.',
          remainingActionsBody:
            'Tu ne peux pas communiquer cette position à l’Équipage. Tu pourras lui indiquer à la prochaine action si tu choisis l’action “Partager des informations”.',
        },
      },
      crew: frenchCrewText,
    },
    reveal: {
      calmSea: {
        title: 'La mer est calme...',
        body: 'Vous voguez sans encombre.',
        primaryButton: 'Suivant',
      },
      encounterGeneric: {
        title: 'Ouch ! L’Équipage rencontre un XX',
        primaryButton: 'Utiliser une carte',
        secondaryButton: 'Subir',
      },
      typhoon: {
        title: 'Typhon ! Le bateau tangue violemment !!!!',
        cardBody: 'Tu peux utiliser une carte. Si tu subis le typhon, tu perds 1 rhum.',
        sufferOnlyBody: 'Si tu subis le typhon, tu perds 1 rhum.',
        bottleBody: 'La bouteille autour du bateau absorbe le choc. Aucun rhum n’est perdu.',
        cannonBody: 'Le canon ne peut pas arrêter un typhon. Il reste chargé.',
        sufferTitle: 'Dans la tempête, une bouteille passe par-dessus bord',
        sufferBody: 'Tu perds 1 bouteille de rhum.',
      },
      monster: {
        title: 'Un monstre vous menace !',
        cardBody: 'Tu peux utiliser une carte. Si tu subis le monstre, tu perds 2 rhum.',
        sufferOnlyBody: 'Si tu subis le monstre, tu perds 2 rhum.',
        bottleBody: 'La bouteille autour du bateau absorbe le choc. Aucun rhum n’est perdu.',
        cannonBody:
          'Le canon tire et l’élimine définitivement. Retirez le monstre du plateau. Aucun rhum n’est perdu.',
        sufferTitle: 'Tu l’as échappé belle, mais tu es en état de choc.',
        sufferBody:
          'L’Équipage apaise son effroi en consommant du rhum. Tu perds 2 bouteilles de rhum.',
      },
      island: {
        title: 'C’est une île ! Capitaine ?',
        body: 'Tu recharges 3 bouteilles de rhum en pillant l’île.',
        gainedBodyPrefix: 'Tu recharges',
        gainedBodySuffix: 'en pillant l’île.',
        exhaustedTitle: 'Île déjà explorée',
        exhaustedBody: 'La cale et les trésors ont déjà été récupérés ici.',
        primaryButton: 'Suivant',
      },
      corsair: {
        title: 'Les corsaires vous capturent et vous exilent.',
        body: '',
        imageAlt: 'Portrait des corsaires',
        primaryButton: 'Suivant',
      },
      lootChoice: {
        title: 'Choisis ton butin',
        body: 'Ta capacité de transport est limitée. Choisis la carte que tu veux garder.',
      },
      equipmentChoice: {
        title: 'Quel équipement utiliser ?',
        body: 'Les deux jetons peuvent réagir à ce monstre.',
        bottleCaption: 'Absorbe le choc. Le monstre reste sur la case.',
        cannonCaption: 'Élimine le monstre définitivement.',
      },
      treasureRecovered: {
        title: 'Trésor récupéré',
        bodySuffix: 'rejoint votre main.',
      },
      bottle: {
        title: 'Bateau en bouteille !',
        body: 'Le danger est absorbé. Aucun rhum n’est perdu.',
      },
      bomb: {
        title: 'Lancer de bombe artisanale !',
        bodyPrefix: 'Tu élimines définitivement le',
        bodySuffix: 'en sacrifiant 1 bouteille de rhum.\nRetirez-le du plateau.',
      },
      powder: {
        title: 'Poudre à canon !',
        body: 'Le monstre est éliminé. Aucun rhum n’est perdu.',
      },
    },
    cards: {
      usePhaseTitlePrefix: 'Carte de',
      usePhaseBody: 'Tu ne peux utiliser qu’1 seule carte par tour.',
      confirmTitle: 'Utiliser cette carte ?',
      confirmBody: 'Tu ne peux utiliser qu’1 seule carte par tour.',
    },
    evening: {
      promptWithCard: {
        title: 'La nuit tombe !',
        body: 'Tu peux utiliser une carte de soirée avant la tournée de rhum.',
        primaryButton: 'Utiliser une carte',
        secondaryButton: 'Boire du rhum',
      },
      promptWithoutCard: {
        title: 'La nuit tombe !',
        body: 'Avec la tombée du jour, vous êtes en manque de rhum...',
        primaryButton: 'Boire du rhum',
      },
      rhumRound: {
        title: 'Tournée de rhum !!!',
        body: 'Tu bois 1 bouteille de rhum pour te remettre de tes aventures. Les corsaires se déplacent dans l’obscurité.',
        primaryButton: 'Passer le téléphone au perroquet',
      },
      tequila: {
        title: 'Tequilaaaa !!!',
        body: 'Tu bois de la téquila pour finir cette journée en beauté. Les corsaires se déplacent dans l’obscurité.',
        primaryButton: 'Passer le téléphone au perroquet',
      },
    },
    gameOver: {
      wonTitle: 'Félicitations, vous avez gagné !',
      wonBody: 'Le capitaine a été retrouvé !',
      lostTitle: 'Vous avez perdu !',
      lostCorsairBody: 'Les corsaires vous capturent et vous exilent.',
      lostRhumBody: 'L’Équipage n’a plus de rhum et renonce à l’expédition.',
      elapsedTimeLabel: 'Temps écoulé',
      rhumConsumedLabel: 'Rhum consommé',
      captainCardAlt: 'Carte Capitaine',
      endMatchButton: 'Terminer la partie',
      revealMapButton: 'Voir la carte complète',
      primaryButton: 'Retour au menu principal',
    },
    units: {
      actionSingular: 'action',
      actionPlural: 'actions',
      caseSingular: 'case',
      casePlural: 'cases',
      movementSingular: 'mouvement',
      movementPlural: 'mouvements',
      rhumBottleSingular: 'bouteille de rhum',
      rhumBottlePlural: 'bouteilles de rhum',
      tileMonster: 'monstre',
      tileTyphoon: 'typhon',
      tileIsland: 'île',
      tileCorsair: 'corsaires',
      tileWater: 'mer calme',
    },
    treasurePhases: {
      morning: 'Matinée',
      afternoon: 'Journée',
      evening: 'Soirée',
      captain: 'Capitaine',
    },
    treasureCards: {
      'jeter-ancre': {
        title: 'Jeter l’ancre',
        effect: 'Réduit de 1 le lancer de dé.',
      },
      'de-pipe': {
        title: 'Dé pipé',
        effect: 'Relance le dé du vent.',
      },
      envollee: {
        title: 'L’envolée',
        effect: 'Augmente de 1 le lancer de dé.',
      },
      'bombe-artisanale': {
        title: 'Bombe artisanale',
        effect: 'Sacrifie 1 rhum pour éliminer définitivement un monstre ou un typhon.',
      },
      'bateau-en-bouteille': {
        title: 'Bateau en bouteille',
        effect: 'Équipe une protection qui absorbe le prochain monstre ou typhon.',
      },
      'poudre-a-canon': {
        title: 'Poudre à canon',
        effect: 'Équipe un tir qui éliminera le prochain monstre rencontré.',
      },
      cacahuete: {
        title: 'Cacahuète',
        effect: 'Ajoute un jeton cacahuète à la réserve du Perroquet.',
      },
      tequilaaaa: {
        title: 'Tequilaaaa!',
        effect: 'Remplace la ration de rhum du soir. L’Équipage ne boit pas de rhum ce tour.',
      },
      capitaine: {
        title: 'Capitaine, mon capitaine !',
        effect: 'Le Capitaine est retrouvé. Vous gagnez la partie.',
      },
    },
    statusHud: {
      rhum: 'Rhum',
      card: 'Carte',
      cardPlayed: 'jouée',
      cardAvailable: 'dispo',
      hand: 'Main',
      peanuts: 'Cacahuètes',
      equipment: 'Équip.',
      bottle: 'bouteille',
      cannon: 'canon',
      none: 'aucun',
    },
    screenChrome: {
      phaseLabels: {
        aurore: 'Aurore',
        matinee: 'Matinée',
        journee: 'Journée',
        soiree: 'Soirée',
      },
      peanutsLabel: 'Cacahuètes',
      peanutAlt: 'Cacahuète',
      remainingTreasureCards: 'Cartes trésor restantes',
      deck: 'Pioche',
      cardsRemaining: 'Cartes restantes',
      viewHand: 'Voir les cartes trésor en main',
      rhum: 'Rhum',
      fullRhumBottle: 'Bouteille de rhum pleine',
      emptyRhumBottle: 'Bouteille de rhum vide',
      treasureCards: 'Cartes trésor',
      closeCards: 'Fermer les cartes',
    },
  },
  en: {
    common: {
      next: 'Next',
      back: 'Back',
      undo: 'Back',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      useCard: 'Use a card',
      suffer: 'Take the hit',
      notPlayable: 'Not playable',
      alreadyPlayedThisTurn: 'Already played this turn',
      playableIn: 'Playable in',
      noDangerToEliminate: 'No danger to eliminate',
      notEnoughRhum: 'Not enough rum',
    },
    ui: {
      orientationTitle: 'Rotate your phone',
      orientationBody: 'Switch to landscape mode to continue.',
      menuButtonLabel: 'Menu',
      fullscreenButtonLabel: 'Fullscreen',
    },
    settings: {
      title: 'Settings',
      music: 'Music',
      soundEffects: 'Sound effects',
      language: 'Language',
      french: 'Français',
      english: 'English',
      performanceMode: 'Performance mode',
      closeLabel: 'Close settings',
    },
    gameMenu: {
      title: 'Menu',
      saveAndQuit: 'Save and quit',
      parameters: 'Settings',
      closeLabel: 'Close menu',
    },
    landing: {
      title: 'Captain!',
      intro: 'The crew is preparing to sail again.',
      primaryButton: 'Start game',
      resumeButton: 'Resume game',
      demoButton: 'Demo game',
      secondaryButton: 'Settings',
    },
    setup: {
      gameStart: {
        title: 'The captain has been exiled!',
        body: 'His crew and faithful parrot must set out to find him...',
        primaryButton: 'Cast off',
      },
      difficulty: {
        title: 'L’Arrachée must load her hold',
        body: 'Choose the difficulty level. Less rum makes the game harder. 6 bottles are recommended for a first game.',
        primaryButton: 'Fill the hold',
      },
      boatPlacement: {
        title: 'L’Arrachée is located at',
        body: 'Place the L’Arrachée boat figure on the matching board tile.',
        primaryButton: 'Next',
      },
      initialCardChoice: {
        title: 'The crew gears up',
        body: 'Choose one card to add to your hand. The others will be discarded.',
      },
    },
    tutorial: {
      nextButton: 'Next',
      skipButton: 'Skip tutorial',
      perroquet: {
        title: 'The Parrot',
        body: 'Desperate, he cannot communicate navigation information out loud and must point things out on the map.',
      },
      equipage: {
        title: 'The Crew',
        body: 'They collectively struggle to function without regular rum. Their reserves are limited...',
      },
      corsaires: {
        title: 'The Corsairs',
        body: 'They banished the captain and sail their frigate to capture his Crew and finish the job.',
        caption: 'They randomly move 1 tile each night.',
      },
      miseEnPlace: {
        title: 'Setup',
        body: '',
        items: [
          '- Each player chooses a role',
          '- Place the board between you',
          '- Place the elements (islands, typhoons, monsters, corsair frigate) in piles on the parrot side',
        ],
      },
    },
    turn1: {
      parrot: {
        dawnIntro: {
          title: 'Wake up, dawn is here!',
          body: 'Your turn, faithful parrot!',
          primaryButton: 'Observe and memorize the surroundings',
          undoLabel: 'Back',
        },
        observeSurroundings: {
          primaryButton: 'Observe and memorize the surroundings',
          undoLabel: 'Back',
        },
        lookAroundTimer: {
          title: 'Observe the surroundings',
        },
        helpCrew: {
          title: 'You can now help the Crew',
          body: 'Place elements while respecting the placement rules. Choose one of the following options:',
          caption:
            'Choose one option: place up to 1 monster + 1 island + 1 typhoon; place 2 monsters, 2 islands, or 2 typhoons; move 1 monster, island, or typhoon; swap 2 elements. You may also indicate the last known position of the corsair frigate.',
          primaryButton: 'Pass the phone to the Crew',
          details: {
            placeTitle: 'Place',
            oneMonster: '1 monster',
            oneIsland: '1 island',
            oneTyphoon: '1 typhoon',
            twoMonsters: '2 monsters',
            twoIslands: '2 islands',
            twoTyphoons: '2 typhoons',
            moveTitle: 'Move one element',
            swapTitle: 'Swap two elements',
            or: 'or',
            footer: 'You may also indicate the last known position of the corsairs.',
          },
        },
      },
      crew: englishCrewText,
    },
    turn2Plus: {
      parrot: {
        dawnIntro: {
          title: 'Wake up, dawn is here!',
          body: 'Your turn, faithful parrot!',
          primaryButton: 'Take action!',
          undoLabel: 'Back',
        },
        dawnWithFoodCheck: {
          title: 'Wake up, dawn is here!',
          body: 'Parrot, do you want to eat a peanut?',
          ownedCountPrefix: 'You have',
          ownedCountSuffix: '.',
          primaryButton: 'Yes',
          secondaryButton: 'No',
        },
        foodChoice: {
          title: 'Food?',
          undoLabel: 'Back',
          cards: [
            {
              title: 'Peanut',
              caption: 'You can take two actions this turn.',
            },
            {
              title: 'Worm',
              caption: 'Effect to define.',
            },
          ],
        },
        dawnChoice: {
          title: 'What do you want to do today?',
          body: 'You can take 1 action this turn.',
          actionCountPrefix: 'You can take',
          actionCountSuffix: 'this turn.',
          cards: [
            {
              title: 'Observe the surroundings',
              caption: 'Look at the 12 tiles near the boat for 5 seconds.',
            },
            {
              title: 'Locate the corsair frigate',
              caption: 'Show the tile where the frigate currently is.',
            },
            {
              title: 'Share information',
              caption: 'Use the physical tiles and tokens to pass along clues.',
            },
          ],
          undoLabel: 'Back',
        },
        dawnChoiceWithHint: {
          title: 'Dawn is here!',
          body: 'When you are done, tell your crew.',
          cards: [
            {
              title: 'Observe the surroundings',
              caption: 'Reveal the area around the ship.',
            },
            {
              title: 'Place tiles',
              caption: 'One or two tiles. The crew must not see.',
            },
          ],
          footer: 'to the crew',
          undoLabel: 'Back',
        },
        lookAroundTimer: {
          title: 'Observe the surroundings',
        },
        exhaustedAfterObservation: {
          title: 'Exhausted, you now need to rest',
          body: 'You cannot tell the Crew what you discovered during your exploration. You can show it next turn if you choose “Share information”.',
          primaryButton: 'Pass the phone to the Crew',
          continueButton: 'Next',
        },
        corsairLocation: {
          title: 'The corsair frigate is at',
          onBoat: 'The corsair frigate is on the boat tile.',
          relativePrefix: 'The corsair frigate is',
          relativeJoin: ' and ',
          fromBoatSuffix: 'from the boat.',
          right: 'to the right',
          left: 'to the left',
          up: 'above',
          down: 'below',
          lastActionBody:
            'You cannot tell the Crew this position. You can show it next turn if you choose “Share information”.',
          remainingActionsBody:
            'You cannot tell the Crew this position. You can show it on the next action if you choose “Share information”.',
        },
      },
      crew: englishCrewText,
    },
    reveal: {
      calmSea: {
        title: 'The sea is calm...',
        body: 'You sail without trouble.',
        primaryButton: 'Next',
      },
      encounterGeneric: {
        title: 'Ouch! The Crew encounters a XX',
        primaryButton: 'Use a card',
        secondaryButton: 'Take the hit',
      },
      typhoon: {
        title: 'Typhoon! The boat rocks violently!',
        cardBody: 'You can use a card. If you take the typhoon hit, you lose 1 rum.',
        sufferOnlyBody: 'If you take the typhoon hit, you lose 1 rum.',
        bottleBody: 'The bottle around the boat absorbs the shock. No rum is lost.',
        cannonBody: 'The cannon cannot stop a typhoon. It stays loaded.',
        sufferTitle: 'In the storm, a bottle goes overboard',
        sufferBody: 'You lose 1 bottle of rum.',
      },
      monster: {
        title: 'A monster threatens you!',
        cardBody: 'You can use a card. If you take the monster hit, you lose 2 rum.',
        sufferOnlyBody: 'If you take the monster hit, you lose 2 rum.',
        bottleBody: 'The bottle around the boat absorbs the shock. No rum is lost.',
        cannonBody:
          'The cannon fires and destroys it permanently. Remove the monster from the board. No rum is lost.',
        sufferTitle: 'That was close, but you are shaken.',
        sufferBody: 'The Crew calms its fright by drinking rum. You lose 2 bottles of rum.',
      },
      island: {
        title: 'It’s an island! Captain?',
        body: 'You refill 3 bottles of rum by looting the island.',
        gainedBodyPrefix: 'You refill',
        gainedBodySuffix: 'by looting the island.',
        exhaustedTitle: 'Island already explored',
        exhaustedBody: 'The hold and treasures have already been collected here.',
        primaryButton: 'Next',
      },
      corsair: {
        title: 'The corsairs capture and exile you.',
        body: '',
        imageAlt: 'Portrait of the corsairs',
        primaryButton: 'Next',
      },
      lootChoice: {
        title: 'Choose your loot',
        body: 'Your carrying capacity is limited. Choose the card you want to keep.',
      },
      equipmentChoice: {
        title: 'Which equipment should you use?',
        body: 'Both tokens can react to this monster.',
        bottleCaption: 'Absorbs the shock. The monster stays on the tile.',
        cannonCaption: 'Eliminates the monster permanently.',
      },
      treasureRecovered: {
        title: 'Treasure recovered',
        bodySuffix: 'joins your hand.',
      },
      bottle: {
        title: 'Ship in a bottle!',
        body: 'The danger is absorbed. No rum is lost.',
      },
      bomb: {
        title: 'Homemade bomb throw!',
        bodyPrefix: 'You permanently eliminate the',
        bodySuffix: 'by sacrificing 1 bottle of rum. Remove it from the board.',
      },
      powder: {
        title: 'Gunpowder!',
        body: 'The monster is eliminated. No rum is lost.',
      },
    },
    cards: {
      usePhaseTitlePrefix: 'Card for',
      usePhaseBody: 'You can only use 1 card per turn.',
      confirmTitle: 'Use this card?',
      confirmBody: 'You can only use 1 card per turn.',
    },
    evening: {
      promptWithCard: {
        title: 'Night falls!',
        body: 'You can use an evening card before the rum round.',
        primaryButton: 'Use a card',
        secondaryButton: 'Drink rum',
      },
      promptWithoutCard: {
        title: 'Night falls!',
        body: 'As night falls, the crew starts craving rum...',
        primaryButton: 'Drink rum',
      },
      rhumRound: {
        title: 'Rum round!',
        body: 'You drink 1 bottle of rum to recover from your adventures. The corsairs move in the dark.',
        primaryButton: 'Pass the phone to the parrot',
      },
      tequila: {
        title: 'Tequilaaaa!',
        body: 'You drink tequila to end the day in style. The corsairs move in the dark.',
        primaryButton: 'Pass the phone to the parrot',
      },
    },
    gameOver: {
      wonTitle: 'Congratulations, you won!',
      wonBody: 'The captain has been found!',
      lostTitle: 'You lost!',
      lostCorsairBody: 'The corsairs capture and exile you.',
      lostRhumBody: 'The Crew has no rum left and gives up the expedition.',
      elapsedTimeLabel: 'Elapsed time',
      rhumConsumedLabel: 'Rum consumed',
      captainCardAlt: 'Captain card',
      endMatchButton: 'End match',
      revealMapButton: 'Reveal the full map',
      primaryButton: 'Back to main menu',
    },
    units: {
      actionSingular: 'action',
      actionPlural: 'actions',
      caseSingular: 'tile',
      casePlural: 'tiles',
      movementSingular: 'move',
      movementPlural: 'moves',
      rhumBottleSingular: 'bottle of rum',
      rhumBottlePlural: 'bottles of rum',
      tileMonster: 'monster',
      tileTyphoon: 'typhoon',
      tileIsland: 'island',
      tileCorsair: 'corsairs',
      tileWater: 'calm sea',
    },
    treasurePhases: {
      morning: 'Morning',
      afternoon: 'Day',
      evening: 'Evening',
      captain: 'Captain',
    },
    treasureCards: {
      'jeter-ancre': {
        title: 'Drop anchor',
        effect: 'Reduce the die roll by 1.',
      },
      'de-pipe': {
        title: 'Loaded die',
        effect: 'Reroll the wind die.',
      },
      envollee: {
        title: 'Take flight',
        effect: 'Increase the die roll by 1.',
      },
      'bombe-artisanale': {
        title: 'Homemade bomb',
        effect: 'Sacrifice 1 rum to permanently eliminate a monster or typhoon.',
      },
      'bateau-en-bouteille': {
        title: 'Ship in a bottle',
        effect: 'Equip protection that absorbs the next monster or typhoon.',
      },
      'poudre-a-canon': {
        title: 'Gunpowder',
        effect: 'Equip a shot that will eliminate the next monster encountered.',
      },
      cacahuete: {
        title: 'Peanut',
        effect: 'Add one peanut token to the Parrot’s reserve.',
      },
      tequilaaaa: {
        title: 'Tequilaaaa!',
        effect: 'Replace the evening rum ration. The Crew does not drink rum this turn.',
      },
      capitaine: {
        title: 'Captain, my captain!',
        effect: 'The Captain has been found. You win the game.',
      },
    },
    statusHud: {
      rhum: 'Rum',
      card: 'Card',
      cardPlayed: 'played',
      cardAvailable: 'ready',
      hand: 'Hand',
      peanuts: 'Peanuts',
      equipment: 'Gear',
      bottle: 'bottle',
      cannon: 'cannon',
      none: 'none',
    },
    screenChrome: {
      phaseLabels: {
        aurore: 'Dawn',
        matinee: 'Morning',
        journee: 'Day',
        soiree: 'Evening',
      },
      peanutsLabel: 'Peanuts',
      peanutAlt: 'Peanut',
      remainingTreasureCards: 'Treasure cards remaining',
      deck: 'Deck',
      cardsRemaining: 'Cards remaining',
      viewHand: 'View treasure cards in hand',
      rhum: 'Rum',
      fullRhumBottle: 'Full rum bottle',
      emptyRhumBottle: 'Empty rum bottle',
      treasureCards: 'Treasure cards',
      closeCards: 'Close cards',
    },
  },
} as const;

export type GameText = (typeof translations)[LanguageCode];

function cloneGameText(language: LanguageCode): GameText {
  return JSON.parse(JSON.stringify(translations[language])) as GameText;
}

function replaceGameText(language: LanguageCode): void {
  const nextText = cloneGameText(language);

  for (const key of Object.keys(gameText)) {
    delete (gameText as Record<string, unknown>)[key];
  }

  Object.assign(gameText, nextText);
}

export const gameText = reactive(cloneGameText(appSettings.language)) as GameText;

watch(
  () => appSettings.language,
  (language) => replaceGameText(language)
);
