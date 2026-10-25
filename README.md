
# Daisy Booking Widget

Widget de réservation intégrable sur le site d'un artisan, développé avec Next.js, React et TypeScript.

**Démo :** https://daisy-booking-widget-ensc.vercel.app/

## 1. Présentation du projet

L'objectif est de permettre à des artisans de proposer la réservation de leurs cours directement depuis leur site, sans imposer à leurs clients un parcours compliqué.
J'ai choisi ce sujet après avoir rencontré personnellement un problème sur un site de réservation qui m'avait empêchée de finaliser une réservation. Cette expérience m'a sensibilisée à l'importance d'un parcours simple, fiable et compréhensible.

## 2. Choix techniques

- **Next.js App Router :** structure de l'application et routes API.
- **React et TypeScript :** interface interactive et typage des données.
- **Shadow DOM :** encapsulation des styles du widget afin de limiter les conflits avec le CSS du site hôte.
- **API REST :** récupération des cours et des créneaux, puis traitement des réservations.
- **Données en mémoire :** utilisées pour cette démonstration, sans base de données persistante.
- 

## 3. Isolation CSS : pourquoi le Shadow DOM ?

Un widget intégré à un site WordPress ou à un autre site tiers peut subir des styles globaux qui modifient ses boutons, ses champs de formulaire, sa typographie ou ses espacements.

J'ai implémenté un composant `WidgetShadow` qui crée un Shadow DOM avec `attachShadow({ mode: "open" })`. Le composant charge une feuille de style dédiée et utilise un portail React pour afficher le widget à l'intérieur de cette frontière.

J'ai également créé une page `/isolation-test` qui simule un site hôte avec des règles CSS volontairement agressives : boutons rouges, champs roses, bordures épaisses, police différente et espacement des lettres forcé.Pour tester sont efficacité.J ai fais une page test isolation-test pour tester le widget sur un page ou le css est difficile ou insalubre 
Cette page permet de vérifier si le widget conserve son apparence face aux styles du site hôte.

## 4. Personnalisation du widget

La page de réservation représente aussi l'identité de l'artisan. Je souhaitais donc permettre à chaque atelier de personnaliser son apparence, notamment les couleurs et la typographie.
Cependant, laisser une liberté totale peut nuire à la lisibilité, à l'accessibilité et à la cohérence du produit. Avec 70 ateliers, chaque configuration supplémentaire augmente aussi le nombre de combinaisons à tester et à maintenir.
J'ai envisagé de créer une interface permettant aux artisans de prévisualiser leur widget et de modifier ses couleurs et ses polices. J'ai abandonné cette fonctionnalité dans le périmètre actuel, car elle aurait nécessité une véritable interface d'administration, une sélection de typographies lisibles, des palettes et des règles de personnalisation.
J ai tout de meme mis une visualisation sur le project  les possibilités que les artisans ont pour personnifier leurs ateliers comme:
_ la couleur de la typo
_ la typographie, la police et la taille
_ les couleurs du boutons
_la photo de profil de l ateliers
_ changer la couleur des boutons et du blocs

## 5. Parcours de réservation et gestion des erreurs

Le widget permet de sélectionner un cours et un créneau, de saisir les coordonnées du client et d'envoyer une demande de réservation.
J'ai prévu plusieurs cas d'erreur pour éviter qu'une demande invalide ou impossible soit confirmée :
- Données invalides : l'API vérifie les informations envoyées et refuse les données manquantes, un e-mail invalide ou un JSON mal formé.
Téléphone obligatoire : la réservation est refusée si le numéro de téléphone requis n'est pas renseigné.
Nombre de places incorrect : je limite le nombre de places par réservation et refuse les demandes qui dépassent la limite autorisée.
Créneau inexistant : l'API renvoie une erreur 404 si le créneau demandé n'existe pas.
Créneau complet ou annulé : la réservation est refusée si le créneau ne peut plus être réservé. Le widget informe l'utilisateur et lui permet de choisir un autre créneau.
Origine non autorisée : l'API vérifie l'origine de la requête et renvoie une erreur 403 lorsque le site n'est pas autorisé.
Trop de requêtes : j'ai ajouté une limitation du nombre de requêtes par adresse IP afin de réduire les abus. Lorsque la limite est atteinte, l'API renvoie une erreur 429.
Erreur réseau : j'ai prévu un message explicite lorsque le service de réservation ne peut pas être contacté, afin que l'utilisateur comprenne le problème et puisse réessayer.

J'ai testé ces différents scénarios, ainsi qu'une réservation valide retournant une confirmation 201. L'objectif était de vérifier non seulement le parcours nominal, mais aussi le comportement du widget lorsque la réservation échoue.
La limitation actuelle est que le contrôle du nombre de requêtes et les données de réservation reposent sur une gestion en mémoire, qui devra être adaptée pour une utilisation en production. 

### Dernière place prise pendant la saisie

L'API vérifie à nouveau la disponibilité au moment de la réservation. Si le nombre de places restantes est insuffisant, elle renvoie une erreur `409` avec le code `slot_full`.

Le widget affiche alors le message :

> Ce créneau n'est malheureusement plus disponible. Choisissez une autre date.

Le créneau sélectionné est réinitialisé, mais les coordonnées déjà saisies sont conservées afin d'éviter à l'utilisateur de recommencer le formulaire.

Cette solution traite le cas où le créneau est devenu complet avant la vérification finale. En revanche, les données étant conservées en mémoire, le système ne garantit pas encore la cohérence de réservations réellement simultanées en production.

### Simulation des erreurs en développement

J'ai crée une page `/shadow-test` avec un sélecteur de scénarios de test. Il permet de simuler différents résultats : réservation réussie, créneau complet, créneau annulé, téléphone obligatoire, nombre de places excessif, limitation des requêtes, origine non autorisée et erreur réseau.Sur la partie reservation vous avez aussi une section pour devellopeur ou vous pouvez choisir les erreurs et similuer une reservation et une erreur apparaitras 

Pour tester ces scénarios, ouvrir :

- `/shadow-test` pour le parcours de réservation et les erreurs simulées.
- `/isolation-test` pour observer le comportement du widget face à des styles CSS agressifs.

En particulier, le scénario réseau affiche le message :

> Impossible de contacter le service de réservation. Vérifiez votre connexion puis réessayez.

Ces scénarios permettent de vérifier les messages et les comportements de l'interface sans devoir provoquer systématiquement une véritable panne.

## 6. Sécurité et limites actuelles

J'ai ajouté plusieurs contrôles côté API :

- Validation des données avant la création d'une réservation.
- Vérification des coordonnées obligatoires et du format de l'e-mail.
- Contrôle du nombre de places demandées.
- Vérification de la disponibilité du créneau.
- Liste des origines autorisées.
- Limitation du nombre de requêtes par adresse IP.

Ces contrôles améliorent la robustesse de la démonstration, mais ne suffisent pas à garantir une sécurité de production complète.

Les réservations et les disponibilités sont stockées en mémoire. Elles peuvent être perdues au redémarrage et ne sont pas partagées entre plusieurs instances de l'application. La limitation de requêtes en mémoire présente également cette limite.

Avant une mise en production, je mettrais en place une base de données persistante, une opération atomique de réservation pour éviter les doubles réservations, et un mécanisme de limitation de requêtes adapté à plusieurs instances.

### Parcours utilisateur et routes API

1. **Choisir un cours** parmi les cours proposés.
2. **Sélectionner un créneau** et consulter les places disponibles.
3. **Renseigner ses informations** et le nombre de places souhaitées.
4. **Confirmer la réservation** : le widget envoie les données à l’API.
5. **Afficher le résultat** : confirmation si la réservation réussit, ou message explicatif en cas d’erreur.

**Routes API :**
- `GET /api/courses` : récupère la liste des cours.
- `GET /api/courses/courseid/slots` : récupère les créneaux selon le cours et la période.
- `GET /api/studio` : récupère les informations du studio et ses règles de réservation.
- `POST /api/bookings` : valide la réservation et renvoie une confirmation ou une erreur.













