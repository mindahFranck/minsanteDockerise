# Guide de Contribution - Health Management System

Merci de votre intérêt pour contribuer au projet Health Management System ! Ce guide vous aidera à comprendre comment contribuer efficacement.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Configuration de l'Environnement](#configuration-de-lenvironnement)
- [Workflow de Développement](#workflow-de-développement)
- [Standards de Code](#standards-de-code)
- [Tests](#tests)
- [Commits](#commits)
- [Pull Requests](#pull-requests)

## 🤝 Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :

- Soyez respectueux et professionnel
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est mieux pour la communauté
- Montrez de l'empathie envers les autres membres

## 💡 Comment Contribuer

Il existe plusieurs façons de contribuer au projet :

### 1. Signaler des Bugs

Si vous trouvez un bug :

1. Vérifiez qu'il n'existe pas déjà dans les [Issues](https://github.com/yourusername/API-HEALTH/issues)
2. Créez une nouvelle issue avec le template "Bug Report"
3. Incluez :
   - Description claire du bug
   - Étapes pour reproduire
   - Comportement attendu vs actuel
   - Screenshots si applicable
   - Version du navigateur/OS

### 2. Proposer des Fonctionnalités

Pour proposer une nouvelle fonctionnalité :

1. Vérifiez les issues existantes
2. Créez une issue avec le template "Feature Request"
3. Décrivez :
   - Le problème que cela résout
   - La solution proposée
   - Des alternatives envisagées
   - Impact potentiel

### 3. Contribuer au Code

Voir la section [Workflow de Développement](#workflow-de-développement)

### 4. Améliorer la Documentation

La documentation est cruciale ! N'hésitez pas à :
- Corriger des fautes
- Ajouter des exemples
- Clarifier des explications
- Traduire la documentation

## 🛠️ Configuration de l'Environnement

### Prérequis

- Node.js 20.x ou supérieur
- MySQL 8.0
- Git
- Docker (optionnel mais recommandé)

### Installation

```bash
# 1. Fork et clone le repository
git clone https://github.com/VOTRE-USERNAME/API-HEALTH.git
cd API-HEALTH

# 2. Installer les dépendances du backend
cd backend
npm install
cp .env.example .env
# Configurer votre .env

# 3. Installer les dépendances du frontend
cd ../frontend
npm install
cp .env.example .env
# Configurer votre .env

# 4. Démarrer la base de données (avec Docker)
docker run -d \
  --name mysql_dev \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=health_management_dev \
  -e MYSQL_USER=devuser \
  -e MYSQL_PASSWORD=devpassword \
  -p 3306:3306 \
  mysql:8.0

# 5. Exécuter les migrations
cd backend
npm run db:migrate

# 6. Charger les données de test
npm run db:seed

# 7. Démarrer le backend en mode dev
npm run dev

# 8. Dans un autre terminal, démarrer le frontend
cd ../frontend
npm run dev
```

## 🔄 Workflow de Développement

### 1. Créer une Branche

```bash
# Mettre à jour main
git checkout main
git pull origin main

# Créer une branche feature
git checkout -b feature/nom-de-la-fonctionnalite

# Ou pour un bugfix
git checkout -b fix/description-du-bug
```

### 2. Nommage des Branches

Format : `type/description-courte`

**Types** :
- `feature/` - Nouvelle fonctionnalité
- `fix/` - Correction de bug
- `docs/` - Documentation
- `refactor/` - Refactoring
- `test/` - Ajout de tests
- `chore/` - Maintenance

**Exemples** :
- `feature/add-fosa-filtering`
- `fix/login-validation-error`
- `docs/update-api-documentation`

### 3. Développer

```bash
# Faire vos modifications
# Tester localement
# Commiter régulièrement
```

### 4. Tester

```bash
# Backend
cd backend
npm test
npm run lint

# Frontend
cd frontend
npm test
npm run lint
```

### 5. Commiter

Voir la section [Commits](#commits)

### 6. Pousser et Créer une PR

```bash
# Pousser votre branche
git push origin feature/nom-de-la-fonctionnalite

# Créer une Pull Request sur GitHub
```

## 📏 Standards de Code

### Backend (TypeScript)

```typescript
// ✅ BON
export class FosaService extends BaseService {
  /**
   * Retrieve all FOSA with optional filters
   * @param filters - Query filters
   * @returns Promise with FOSA list
   */
  async findAll(filters: FosaFilters): Promise<Fosa[]> {
    const { page = 1, limit = 10, search } = filters;

    const query: any = {};
    if (search) {
      query.nom = { [Op.like]: `%${search}%` };
    }

    return await Fosa.findAll({
      where: query,
      limit,
      offset: (page - 1) * limit,
    });
  }
}

// ❌ MAUVAIS
async function getFosa(p, l, s) {
  let q = {}
  if(s) q.nom = {[Op.like]: '%'+s+'%'}
  return await Fosa.findAll({where:q,limit:l,offset:(p-1)*l})
}
```

**Règles** :
- Utiliser TypeScript strict
- Typer toutes les variables et fonctions
- Documenter les fonctions publiques (JSDoc)
- Utiliser async/await (pas de callbacks)
- Gérer les erreurs avec try/catch
- Noms explicites (pas d'abréviations obscures)
- Maximum 200 lignes par fichier
- Une responsabilité par fonction

### Frontend (React/TypeScript)

```typescript
// ✅ BON
interface FosaCardProps {
  fosa: Fosa;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const FosaCard: React.FC<FosaCardProps> = ({
  fosa,
  onEdit,
  onDelete
}) => {
  const handleEdit = () => {
    onEdit(fosa.id);
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold">{fosa.nom}</h3>
      <p className="text-gray-600">{fosa.adresse}</p>
      <button onClick={handleEdit}>Modifier</button>
    </div>
  );
};

// ❌ MAUVAIS
function Card(props) {
  return <div onClick={() => props.onEdit(props.data.id)}>
    <h3>{props.data.nom}</h3>
  </div>
}
```

**Règles** :
- Utiliser les Hooks React
- Composants fonctionnels (pas de classes)
- Props typées avec TypeScript
- Noms de composants en PascalCase
- Extraire la logique complexe dans des hooks
- Utiliser Tailwind CSS pour le styling
- Composants réutilisables dans `components/`
- Pages dans `pages/`

### Style de Code

```typescript
// Indentation : 2 espaces
// Quotes : doubles "
// Semicolons : oui
// Trailing commas : oui
// Arrow functions : préférées

// ✅ BON
const fetchData = async (id: number): Promise<Data> => {
  try {
    const response = await api.get(`/data/${id}`);
    return response.data;
  } catch (error) {
    logger.error("Error fetching data:", error);
    throw error;
  }
};

// Utilisez les templates literals
const message = `Hello ${name}, you have ${count} notifications`;

// Déstructuration
const { id, name, email } = user;
```

## 🧪 Tests

### Backend

```typescript
// tests/services/FosaService.test.ts
describe("FosaService", () => {
  describe("findAll", () => {
    it("should return all FOSA", async () => {
      const result = await fosaService.findAll({});
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should filter by search term", async () => {
      const result = await fosaService.findAll({ search: "Hôpital" });
      expect(result.every(f => f.nom.includes("Hôpital"))).toBe(true);
    });
  });
});
```

**Exécuter les tests** :
```bash
npm test                 # Tous les tests
npm test -- --watch      # Mode watch
npm test -- --coverage   # Avec couverture
```

### Frontend

```typescript
// tests/components/FosaCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { FosaCard } from "./FosaCard";

describe("FosaCard", () => {
  const mockFosa = {
    id: 1,
    nom: "Hôpital Test",
    adresse: "123 Rue Test",
  };

  it("should render fosa information", () => {
    render(<FosaCard fosa={mockFosa} onEdit={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByText("Hôpital Test")).toBeInTheDocument();
    expect(screen.getByText("123 Rue Test")).toBeInTheDocument();
  });

  it("should call onEdit when edit button is clicked", () => {
    const onEdit = jest.fn();
    render(<FosaCard fosa={mockFosa} onEdit={onEdit} onDelete={jest.fn()} />);

    fireEvent.click(screen.getByText("Modifier"));
    expect(onEdit).toHaveBeenCalledWith(1);
  });
});
```

## 📝 Commits

### Format des Messages

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

**Types** :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage (pas de changement de code)
- `refactor` : Refactoring
- `test` : Ajout/modification de tests
- `chore` : Maintenance

**Exemples** :

```bash
# Feature
git commit -m "feat(fosa): add filtering by region"

# Bug fix
git commit -m "fix(auth): correct JWT expiration validation"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api): change authentication endpoint

BREAKING CHANGE: /auth/login now requires email instead of username"
```

## 🔃 Pull Requests

### Checklist Avant de Soumettre

- [ ] Code testé localement
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests passent (`npm test`)
- [ ] Linter passe (`npm run lint`)
- [ ] Documentation mise à jour si nécessaire
- [ ] Commits suivent le format conventionnel
- [ ] Branche à jour avec `main`

### Template de PR

```markdown
## Description
Décrivez vos changements

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Comment tester
1. Étape 1
2. Étape 2
3. ...

## Checklist
- [ ] Tests ajoutés
- [ ] Documentation mise à jour
- [ ] Linter passe
```

### Processus de Review

1. Au moins 1 approbation requise
2. Tous les checks CI/CD doivent passer
3. Pas de conflits avec `main`
4. Review de code par un mainteneur

## 🐛 Debugging

### Backend

```typescript
// Utiliser le logger Winston
import { logger } from "./config/logger";

logger.debug("Debugging info", { userId, action });
logger.info("User logged in", { userId });
logger.warn("Rate limit approaching", { ip, count });
logger.error("Database error", { error, query });
```

### Frontend

```typescript
// Utiliser les React DevTools
// Console logs pour le développement uniquement
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}
```

## 📚 Ressources

- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## ❓ Questions

Si vous avez des questions :

1. Consultez la [documentation](./README.md)
2. Cherchez dans les [issues](https://github.com/yourusername/API-HEALTH/issues)
3. Créez une nouvelle issue avec le label "question"
4. Contactez les mainteneurs : mindahnkemeni@gmail.com

## 🙏 Remerciements

Merci à tous les contributeurs qui aident à améliorer ce projet !

---

**Dernière mise à jour** : 2025-01-03
