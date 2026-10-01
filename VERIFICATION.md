# Vérification du prototype

Contrôles effectués le 1er octobre 2026 avec des données fictives.

## Automatisés

`npm test` : 7 tests réussis.

- Tranches de 24 h, durée de 24 h exacte et dépassement d’une minute.
- Conflits entre réservations ; créneaux adjacents autorisés ; annulation ; maintenance.
- Contrat préparé bloquant, contrat clôturé libérant la voiture.
- Tarif, remise, frais et TVA explicitement configurée ; séparation des cautions.
- Paiement nul/négatif/non numérique/excessif refusé ; paiement exact autorisé.
- Retour avec kilométrage incohérent refusé ; statut réel du véhicule.
- Facture distincte et instantané indépendant des données source.

`npm run build` : TypeScript et compilation de production réussis.

## Parcours réel dans le navigateur

- Création du client fictif « Imane Démo » avec coordonnées et permis.
- Création d’une réservation pour une Peugeot 208 et conversion en CTR-2026-0006 sans ressaisie.
- Paiement de 400 MAD refusé pour un solde de 320 MAD ; paiement de 100 MAD accepté.
- Réception de 3 000 MAD de caution, sans modification du montant payé pour la location.
- Départ : le contrat passe « en cours ».
- Retour : saisie de 35 000 km refusée pour un départ à 35 100 km.
- Retour accepté à 35 250 km, avec 80 MAD de frais de carburant justifiés ; contrat clôturé et voiture disponible.
- Création de FAC-2026-0003, distincte de CTR-2026-0006 : total 400 MAD, payé 100 MAD, solde 300 MAD.
- Ajout du paiement de 300 MAD depuis la facture : le contrat et la même facture affichent 400 MAD payés et un solde nul.
- Le bouton « Ouvrir la facture » réutilise la facture existante. Les modifications financières sont masquées et un message de verrouillage est affiché.
- Bouton d’impression/PDF déclenché ; document dédié à l’impression A4 présent. Le dialogue natif et le choix final du fichier PDF dépendent du navigateur de l’utilisateur.
- Rechargement : contrat clôturé, frais, facture, deux paiements et caution conservés.
- Formulaire de réservation : conflit de contrat et voiture en maintenance refusés dans l’interface.
- Calcul visuel après saisie de 24 h + 1 minute : 2 journées, 640 MAD au tarif de 320 MAD.
- Calendrier mensuel : réservations et contrats affichés sur leurs journées.
- Vue ordinateur à 1440 px et vue téléphone à 390 px inspectées. Largeur du document égale à 390 px, sans débordement horizontal global ; menu et flotte accessibles.
- Aucune erreur ou alerte JavaScript dans les journaux du navigateur consultés.

L’impression physique et la validation fiscale ne font pas partie de ces contrôles. Le navigateur de démo a ensuite été réinitialisé aux données de présentation.

## Contrôle avant livraison de l’archive source

- Nom de l’agence repris dans l’interface et le titre de l’onglet.
- Textes promotionnels et commentaires de présentation superflus retirés.
- Mentions de démonstration et licences des dépendances conservées.
- Compilation de production réussie après nettoyage.
- Les 7 tests métier passent avec `node --import tsx --test src/domain.test.ts`.
- Aperçu contrôlé : tableau de bord présent et aucune erreur JavaScript signalée.
- Archive source vérifiée : fichiers de configuration, verrouillage des dépendances et guide de lancement inclus ; dépendances installées, résultats de compilation, caches et secrets exclus.
