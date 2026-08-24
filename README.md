# Simulateur USSD FinZuu

Application mobile qui reproduit une session USSD, pour éprouver le canal en recette et le présenter aux partenaires — en l'absence d'intégration avec les opérateurs télécom.

**Outil de transition.** Il disparaît du périmètre le jour où les opérateurs sont branchés : l'usager final n'installera jamais rien, il composera un code court sur n'importe quel téléphone.

---

## Ce que fait l'application, en trois phrases

Quand quelqu'un compose `*321#` sur un téléphone sans internet, un service distant lui renvoie un menu, et il navigue en tapant des chiffres. Aucun opérateur n'étant branché, cette application reproduit ce parcours en s'adressant directement au service.

Elle ne contient **aucune** logique métier : ni menu, ni règle, ni donnée financière. Elle transmet une saisie, elle affiche un texte.

---

## Les trois principes

Ils commandent toute décision. Une contribution qui en viole un est refusée, quelle que soit sa qualité par ailleurs.

**Fidélité au parcours réel.** Le numéro attribué est une carte SIM virtuelle. Une fois attribué, il n'est plus jamais saisi — aucun écran ne permet de le taper.

**Aucune logique embarquée.** L'application ignore l'arborescence des menus, les règles d'enchaînement, les libellés. La réponse du service est une chaîne opaque, affichée telle quelle. Seule interprétation autorisée : le préfixe de continuation, qui relève du protocole.

**Représentativité des données.** Le numéro correspond toujours à un client réellement enregistré. Aucune génération locale, aucun repli, aucune valeur par défaut.

---

## Le cycle de vie

**Phase 1 — attribution.** Une fois par bail. L'usager choisit pays, genre et catégorie dans des listes fermées ; le service d'attribution rend un numéro, lié à l'appareil pour sept jours.

**Phase 2 — session.** Toutes les fois suivantes. `*321#` part avec le numéro stocké, le service renvoie les écrans successifs.

**Échéance.** Au bout de sept jours le bail expire, le numéro retourne au pool, l'application le signale et reconduit en phase 1.

---

## Démarrer

> **Le projet ne se construit pas depuis WSL.** WSL2 n'expose pas les ports USB : un téléphone branché y est invisible, et l'émulateur n'y a aucune accélération matérielle. La chaîne d'outils vit sur Windows.

```
Projet          C:\dev\simulateur-ussd
Vu depuis WSL   /mnt/c/dev/simulateur-ussd
```

```bash
# Sur Windows, dans PowerShell
npm install
cp .env.example .env        # renseigner les adresses des services

# Téléphone Android branché en USB, débogage activé
npx react-native run-android
```

Aucun émulateur n'est nécessaire, et un appareil réel est préférable : c'est une application dont l'objet est de reproduire un parcours téléphone.

---

## Organisation du code

Quatre couches, dépendances orientées vers le bas uniquement. Un module placé dans le mauvais dossier est un défaut d'architecture visible à la lecture de l'arborescence.

```
src/
  presentation/     écrans et dialogues
  coordination/     état de session, cycle du bail
  distant/          clients des deux services
  persistance/      stockage local du bail
  commun/           thème, constantes, types
```

| Couche | Ne contient jamais |
|---|---|
| Présentation | aucune règle métier, aucun libellé de menu, aucun appel réseau |
| Coordination | aucun appel réseau direct |
| Accès distant | aucune décision de navigation |
| Persistance | aucune donnée personnelle hors le numéro et la langue |

**Une seule adresse de service dans tout le projet**, dans le fichier de configuration. Aucun branchement conditionnel ailleurs : la bascule entre environnements est une adresse, jamais une branche de code.

---

## Documentation

| Document | Contenu |
|---|---|
| `docs/CAHIER_DES_CHARGES.docx` | Le besoin : exigences, invariants, critères de recette |
| `docs/CONCEPTION.pptx` | Les treize écrans, annotés, avec la traçabilité |
| `docs/STACK_TECHNIQUE.docx` | Technologie, architecture, chaîne de production |
| `docs/CONTRAT_ATTRIBUTION.md` | Contrat du service d'attribution — **figé** |

Le contrat est la référence unique de l'application. Elle code contre lui, jamais contre son implémentation.

---

## Contribuer

**Commits.** Décrire ce que le commit fait, pas les fichiers touchés.

```
Ajoute la vérification du bail au lancement
Corrige la persistance de la clé d'idempotence
```

**Traçabilité.** Un fichier qui tient une exigence la cite en commentaire. La revue de recette doit pouvoir remonter d'une exigence à une ligne.

**Branches.** Une branche par sujet, fusion par demande de tirage. La branche principale n'est jamais poussée directement.

---

## État

Deux dépendances externes ne relèvent pas de l'application et n'empêchent pas de la construire — elles empêchent de la démontrer.

| Dépendance | État |
|---|---|
| Service USSD | Ne restitue aucun menu. Anomalie ouverte côté équipe de développement. |
| Service d'attribution | À construire côté Loader, contre le contrat figé. |

---

*FinZuu SAS — Kuate Abdel Yaniv, QA Lead*
