// Keynotes (fondateur) : action ACTIVE du joueur (coût en énergie légitime) qui vend des produits.
// Zéro RNG : le timer est un simple décompte. La keynote est aussi le premier robinet de
// followers AVANT la célébrité (presse tech) : le pont mécanique P4 → P5.

export const KEYNOTE_PERIOD = 60; // secondes entre deux keynotes disponibles
export const KEYNOTE_BOOST = 0.5; // +50 % de revenu produits pendant le boost
export const KEYNOTE_BOOST_SECS = 15; // durée du boost armé par une keynote
export const KEYNOTE_FOLLOWERS = 5000; // followers gagnés par keynote (la presse tech en parle)
export const KEYNOTE_ENERGY_COST = 6; // énergie dépensée par keynote (action active → coût légitime)

// Presse (pont fondateur → célébrité) : chaque grand geste de la boîte fait parler d'elle.
export const PRESS_FOLLOWERS_RAISE = 10000; // par levée bouclée (grantCash)
export const PRESS_FOLLOWERS_ACQUISITION = 3000; // par acquisition
