# Contribuer

## Avant d'écrire une ligne

Lire les trois principes du `README`. Ils ne sont pas des recommandations : une contribution qui en viole un est refusée, quelle que soit sa qualité par ailleurs.

## Ce qui fait refuser une contribution

| Motif | Règle enfreinte |
|---|---|
| Un libellé de menu écrit en dur | Aucune logique embarquée |
| Un champ de saisie recevant un numéro de téléphone | Fidélité au parcours réel |
| Une adresse de service hors du fichier de configuration | Une seule adresse dans tout le projet |
| Un branchement conditionnel par environnement | La bascule est une adresse, pas une branche |
| Une donnée personnelle stockée hors des valeurs prévues | Périmètre de la persistance |
| Une traduction du texte restitué par le service | L'application demande une langue, elle n'en produit aucune |

## Traçabilité

Un fichier qui tient une exigence la cite en commentaire, avec sa référence.

```ts
// EF-09 — le numéro provient du stockage, jamais d'une saisie.
```

La revue de recette doit pouvoir remonter d'une exigence du cahier des charges à une ligne de code. C'est ce qui rend les critères vérifiables autrement que par confiance.

## Commits

Décrire ce que le commit fait, jamais les fichiers touchés.

```
Ajoute la vérification du bail au lancement
Corrige la persistance de la clé d'idempotence
Retire la transmission de langue au service USSD
```

Un commit par idée. Un correctif et une fonctionnalité ne voyagent pas ensemble.

## Branches

Une branche par sujet, nommée par ce qu'elle apporte.

```
verification-bail-au-lancement
correction-cle-idempotence
```

La branche principale n'est jamais poussée directement, même seul sur le projet. Une fusion passe par une demande de tirage, même sans relecteur : elle laisse une trace de ce qui a été livré et pourquoi.

## Avant de proposer une fusion

- Le typage passe sans erreur
- L'application se lance sur un appareil réel
- Aucune adresse, aucune clé, aucun secret dans les fichiers modifiés
- Les exigences touchées sont citées dans le code
