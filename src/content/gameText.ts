export const gameText = {
  landing: {
    title: "Titre du Jeu",
    intro: "L’équipage se prépare à reprendre la mer.",
    primaryButton: "Commencer la partie",
    secondaryButton: "Paramètres",
    tertiaryButton: "Voir le tutoriel",
  },
  setup: {
    gameStart: {
      title: "Le capitaine a été exilé !",
      body: "Son fidèle équipage doit partir à sa recherche.",
      primaryButton: "Commencer la partie",
    },
    boatPlacement: {
      title: "Le navire se situe en XX",
      body: "Place le bateau sur la case correspondante.",
      primaryButton: "Suivant",
    },
  },
  turn1: {
    parrot: {
      dawnIntro: {
        title: "C’est l’aurore !",
        body: "À ton tour, fidèle perroquet !",
        primaryButton: "Suivant",
        undoLabel: "Undo",
      },
      observeSurroundings: {
        primaryButton: "Observer les alentours",
        undoLabel: "Undo",
      },
      lookAroundTimer: {
        title: "Observe les alentours",
      },
      helpCrew: {
        title: "Tu peux désormais aider l’équipage",
        body: "Place deux ou trois tuiles en respectant les règles de placement.",
        primaryButton: "Passer",
      },
    },
    crew: {
      morningIntro: {
        title: "C’est le matin !",
        body: "À ton tour, fidèle équipage !",
        caption: "Premier tour : choisis une carte parmi celles disponibles.",
      },
      diceRoll: {
        title: "Lancé de dés",
        body: "Fais rouler le dé pour connaître ton déplacement.",
      },
      afterRoll: {
        primaryButton: "Passer à l’après-midi",
        secondaryButton: "J’ai une carte clé",
      },
      chooseCard: {
        title: "Laquelle ?",
        body: "Appuie sur l’une des trois cartes.",
        undoLabel: "Undo",
        cards: [
          {
            title: "On n’a rien vu",
            caption: "Rien à signaler pour l’instant.",
          },
          {
            title: "Coup de burst",
            caption: "Effet à préciser.",
          },
          {
            title: "Accalmie",
            caption: "La mer se calme un instant.",
          },
        ],
      },
      afternoonIntro: {
        title: "C’est l’après-midi",
        body: "Cap vers... ?",
        undoLabel: "Undo",
      },
      directionConfirm: {
        title: "T’es sûr de ton choix ?",
        body: "Clique sur une autre flèche pour changer.",
        primaryButton: "Confirmer",
      },
    },
  },
  transition: {
    nightFalls: {
      title: "La nuit tombe !",
      body: "TOURNÉE DE RHUM !",
    },
  },
  turn2Plus: {
    parrot: {
      dawnWithFoodCheck: {
        title: "C’est l’aurore !",
        body: "À ton tour, fidèle perroquet !",
        primaryButton: "J’ai de quoi me nourrir !",
        secondaryButton: "Je n’ai rien",
      },
      foodChoice: {
        title: "De la nourriture ?",
        undoLabel: "Undo",
        cards: [
          {
            title: "Cacahuète",
            caption: "Effet à préciser.",
          },
          {
            title: "Ver",
            caption: "Effet à préciser.",
          },
        ],
      },
      dawnChoice: {
        title: "C’est l’aurore !",
        cards: [
          {
            title: "Observer les alentours",
            caption: "Révèle les environs du navire.",
          },
          {
            title: "Placer des tuiles",
            caption: "Aide l’équipage en complétant le plateau.",
          },
        ],
        undoLabel: "Undo",
      },
      dawnChoiceWithHint: {
        title: "C’est l’aurore !",
        body: "Quand tu auras terminé, dis-le à ton équipage.",
        cards: [
          {
            title: "Observer les alentours",
            caption: "Révèle les environs du navire.",
          },
          {
            title: "Placer des tuiles",
            caption: "Une ou deux tuiles. L’équipage ne doit rien voir.",
          },
        ],
        footer: "à l’équipage",
        undoLabel: "Undo",
      },
      lookAroundTimer: {
        title: "Observe les alentours",
      },
    },
    crew: {
      morningIntro: {
        title: "C’est le matin !",
        body: "À ton tour, fidèle équipage !",
      },
      diceRoll: {
        title: "Lancé de dés",
        body: "Le dé révèle le nombre de cases que tu peux parcourir.",
      },
      chooseCard: {
        title: "Laquelle ?",
        body: "Appuie sur l’une des trois cartes.",
        undoLabel: "Undo",
        cards: [
          {
            title: "On n’a rien vu",
            caption: "Rien à signaler pour l’instant.",
          },
          {
            title: "Coup de burst",
            caption: "Effet à préciser.",
          },
          {
            title: "Accalmie",
            caption: "La mer se calme un instant.",
          },
        ],
      },
      afternoonIntro: {
        title: "C’est l’après-midi",
        body: "Cap vers... ?",
        caption: "ancienne position",
        undoLabel: "Undo",
      },
      directionConfirm: {
        title: "T’es sûr de ton choix ?",
        body: "Clique sur une autre flèche pour changer.",
        caption: "ancienne position",
        primaryButton: "Suivant",
      },
    },
  },
  reveal: {
    calmSea: {
      title: "La mer est calme...",
      primaryButton: "Suivant",
    },
    encounterGeneric: {
      title: "Ouch ! L’équipage rencontre un XX",
      primaryButton: "J’ai de quoi me défendre !",
      secondaryButton: "On n’a rien...",
    },
    encounterTyphoon: {
      title: "Ouch ! L’équipage rencontre un typhon",
      body: "Choisis une carte pour vous défendre du typhon.",
      secondaryButton: "On n’a rien...",
      cards: [
        {
          title: "Coque renforcée",
          caption: "Effet à préciser.",
        },
        {
          title: "Cocktail molotov",
          caption: "Effet à préciser.",
        },
      ],
    },
    encounterMonster: {
      title: "Ouch ! L’équipage rencontre un monstre",
      body: "Choisis une carte pour vous défendre du monstre.",
      secondaryButton: "On n’a rien...",
      cards: [
        {
          title: "Boulet de canon",
          caption: "Effet à préciser.",
        },
        {
          title: "Coque renforcée",
          caption: "Effet à préciser.",
        },
        {
          title: "Cocktail molotov",
          caption: "Effet à préciser.",
        },
      ],
    },
    island: {
      title: "C’est une île !! Capitaine... ?",
      body: "Texte de règle à préciser.",
      primaryButton: "Suivant",
    },
  },
} as const;
