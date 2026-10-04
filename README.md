# Atlas Location

Prototype de gestion d’une agence de location de voitures : véhicules, clients, réservations, contrats, factures, paiements et cautions. Interface en français, adaptée aux ordinateurs et téléphones.

## Lancer l’application

Installer Node.js 22.12 ou une version plus récente, avec npm. Décompresser l’archive, puis ouvrir un terminal dans le dossier `Gestion-Location-Auto` :

```sh
npm ci
npm run dev -- --port 5173
```

Ouvrir [http://localhost:5173](http://localhost:5173). Pour tester sur téléphone connecté au même Wi-Fi, utiliser l’adresse « Network » affichée dans le terminal.

## Vérifier et compiler

```sh
npm test
npm run build
```

La compilation produit le dossier `dist`. Le projet utilise React, TypeScript, Tailwind CSS et Vite. Le fichier `package-lock.json` fixe les versions des dépendances.

## Utilisation

Le tableau de bord propose un planning par date. Sélectionner « Voitures à sortir » ou « Voitures à récupérer » pour afficher les mouvements restants du jour, puis ouvrir la réservation ou le contrat depuis sa carte. Les retours futurs des réservations confirmées et des contrats préparés sont inclus.

Créer un client, enregistrer une réservation, puis la convertir en contrat. Les paiements, la caution et les états du véhicule au départ et au retour se gèrent depuis le contrat. Le bouton « Générer une facture » crée un document distinct lié au contrat. « Imprimer / PDF » ouvre l’impression du navigateur : choisir « Enregistrer au format PDF ».

Les paramètres permettent de modifier le nom et les coordonnées de l’agence. Les données fictives sont créées au premier lancement. « Réinitialiser la démo » les restaure après confirmation.

## Données et limites

- Sauvegarde locale dans le navigateur, sans serveur de données ni API externe. Les données ne sont pas partagées entre appareils ou navigateurs. Utiliser un seul onglet à la fois.
- L’effacement des données du navigateur efface la démo. Une sauvegarde JSON peut être exportée depuis les paramètres ; aucun import n’est intégré.
- Cautions séparées des encaissements. Les paiements sont partagés entre contrat et facture, sans double comptabilisation.
- Documents de démonstration, sans validation fiscale ou juridique. TVA facultative, désactivée par défaut. Aucun avoir ni remboursement de location ; les montants sont verrouillés après facturation.
- Export PDF par l’impression du navigateur ; les photos sont limitées à 1,5 Mo par fichier et à la capacité du stockage local.

## Licences des dépendances

Les licences et attributions des dépendances sont conservées dans `THIRD_PARTY_NOTICES.txt`. Elles restent également disponibles dans les paquets installés par `npm ci`.
