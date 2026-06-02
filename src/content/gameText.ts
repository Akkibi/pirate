export const gameText = {
  landing: {
    title: 'Cap’taine !',
    intro: 'L’équipage se prépare à reprendre la mer.',
    primaryButton: 'Commencer la partie',
    resumeButton: 'Reprendre la partie',
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
        body: 'Place des éléments en respectant les règles de placement.',
        caption:
          'Choisissez une des possibilités suivantes : placer au maximum 1 monstre + 1 île + 1 typhon ; placer 2 monstres ou 2 îles ou 2 typhons ; déplacer 1 monstre ou 1 île ou 1 typhon ; échanger 2 éléments entre eux. En plus de cela, vous pouvez indiquer la dernière position connue de la frégate corsaire.',
        primaryButton: 'Passer le téléphone à l’Équipage',
      },
    },
    crew: {
      morningIntro: {
        title: 'Matin salin...',
        body: 'À ton tour, fidèle équipage !',
      },
      diceRoll: {
        title: 'Mesure du vent',
        body: 'Observation en cours...',
      },
      afterRoll: {
        noMovementButton: 'Passer à l’après-midi',
        moveButton: 'Mettre les voiles',
        secondaryButton: 'J’ai une carte dé',
      },
      chooseCard: {
        title: 'Laquelle ?',
        body: 'Appuie sur l’une des trois cartes.',
        undoLabel: 'Undo',
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
        body: 'Tu as encore XX déplacement.',
        primaryButton: 'Révéler la case',
        secondaryButton: 'Retour',
      },
      nightFalls: {
        title: 'La nuit tombe !',
        body: 'Avec la tombée du jour, vous êtes en manque de rhum...',
      },
    },
  },
  turn2Plus: {
    parrot: {
      dawnIntro: {
        title: 'Debout, c’est l’aurore !',
        body: 'À ton tour, fidèle perroquet !',
        primaryButton: "On passe à l'action!",
        undoLabel: 'Retour',
      },
      dawnWithFoodCheck: {
        title: 'Debout, c’est l’aurore !',
        body: 'Perroquet, veux-tu manger une cacahuète ?',
        primaryButton: 'Oui',
        secondaryButton: 'Non',
      },
      foodChoice: {
        title: 'De la nourriture ?',
        undoLabel: 'Undo',
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
        undoLabel: 'Undo',
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
        lastActionBody:
          'Tu ne peux pas communiquer cette position à l’Équipage. Tu pourras lui indiquer au prochain tour si tu choisis l’action “Partager des informations”.',
        remainingActionsBody:
          'Tu ne peux pas communiquer cette position à l’Équipage. Tu pourras lui indiquer à la prochaine action si tu choisis l’action “Partager des informations”.',
      },
    },
    crew: {
      morningIntro: {
        title: 'Matin salin...',
        body: 'À ton tour, fidèle équipage !',
      },
      diceRoll: {
        title: 'Mesure du vent',
        body: 'Observation en cours...',
      },
      afterRoll: {
        noMovementButton: 'Passer à l’après-midi',
        moveButton: 'Mettre les voiles',
        secondaryButton: 'J’ai une carte dé',
      },
      chooseCard: {
        title: 'Laquelle ?',
        body: 'Appuie sur l’une des trois cartes.',
        undoLabel: 'Undo',
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
        body: 'Tu as encore XX déplacement.',
        primaryButton: 'Révéler la case',
        secondaryButton: 'Retour',
      },
      nightFalls: {
        title: 'La nuit tombe !',
        body: 'Avec la tombée du jour, vous êtes en manque de rhum...',
      },
    },
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
      primaryButton: 'Suivant',
    },
    corsair: {
      title: 'Les corsaires vous capturent et vous exilent.',
      body: '',
      primaryButton: 'Suivant',
    },
    lootChoice: {
      title: 'Choisis ton butin',
      body: 'Ta capacité de transport est limitée. Choisis la carte que tu veux garder.',
    },
    bomb: {
      title: 'Lancer de bombe artisanale !',
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
    lostTitle: 'Vous avez perdu !',
    revealMapButton: 'Voir la carte complète',
    primaryButton: 'Retour au menu principal',
  },
} as const;
