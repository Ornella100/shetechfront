# 📹 Comment ajouter vos propres vidéos en français

## 1. Créer la table dans votre base de données

Exécutez le script SQL suivant dans PhpMyAdmin ou MySQL Workbench :

```sql
CREATE TABLE IF NOT EXISTS videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lecon_id INT NOT NULL,
  titre VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  duree VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lecon_id) REFERENCES lecons(id) ON DELETE CASCADE
);

CREATE INDEX idx_videos_lecon_id ON videos(lecon_id);
```

## 2. Accéder au panel admin

1. Connectez-vous à votre compte avec le rôle "admin"
2. Allez dans le Dashboard
3. Cliquez sur "Gestion des Vidéos" (menu admin)

## 3. Ajouter des vidéos

### Étapes :
1. **Sélectionnez une Formation** dans la liste
2. **Sélectionnez un Module** associé à la formation
3. **Sélectionnez une Leçon** dans le module
4. **Remplissez les informations** :
   - **Titre** : Nom de la vidéo (ex: "Introduction au HTML")
   - **URL YouTube** : Lien complet YouTube (ex: https://www.youtube.com/watch?v=...)
   - **Description** : Courte description du contenu (optionnel)
   - **Durée** : Durée de la vidéo (ex: "15 min") (optionnel)
5. Cliquez sur **"✓ Ajouter la vidéo"**

### Formats acceptés :
- ✅ URLs YouTube complètes : `https://www.youtube.com/watch?v=...`
- ✅ URLs YouTube courtes : `https://youtu.be/...`

## 4. Gérer les vidéos

### Voir les vidéos existantes :
- Sélectionnez une leçon
- Les vidéos existantes s'affichent en bas du formulaire

### Supprimer une vidéo :
- Cliquez sur le bouton "Supprimer" à côté de la vidéo

## 5. Conseils pour les vidéos en français

### Sources de vidéos en français :
- **YouTube Français** : Cherchez des tutoriels en français sur YouTube
- **Créez vos propres vidéos** : Enregistrez des vidéos avec OBS ou Camtasia
- **Ressources francophones** : Grafikart, Codecademy FR, Openclassroom

### Bonnes pratiques :
- Télécharger les vidéos sur YouTube d'abord
- Utiliser des URLs YouTube officielles (pas d'outils proxy)
- Vérifier que les vidéos sont accessibles publiquement
- Tester les liens avant de les publier

## 6. Modifier les vidéos

Les vidéos peuvent être modifiées via l'API :

```bash
PUT /videos/:id
{
  "titre": "Nouveau titre",
  "url": "https://www.youtube.com/watch?v=...",
  "description": "Nouvelle description",
  "duree": "20 min"
}
```

Nécessite : Token JWT d'admin

## 7. Vérifier que les vidéos s'affichent

1. Quittez le panel admin
2. Allez dans **Formations**
3. Sélectionnez une formation
4. Sélectionnez un module
5. Sélectionnez une leçon vidéo
6. La vidéo devrait s'afficher dans le lecteur

## Problèmes courants

### "Vidéo introuvable" :
- Vérifier que l'URL YouTube est correcte
- Vérifier que la vidéo est publique sur YouTube

### Authentification refusée :
- Vérifier que vous êtes connecté avec un compte admin
- Vérifier que votre token JWT est valide

### Vidéos ne s'affichent pas :
- Vérifier que la leçon est bien liée à la vidéo
- Vérifier que la table `videos` existe dans la BD

## API Endpoints

### Ajouter une vidéo
```
POST /lecons/:lecon_id/videos
Authorization: Bearer {token}

{
  "titre": "Titre de la vidéo",
  "url": "https://www.youtube.com/watch?v=...",
  "description": "Description",
  "duree": "15 min"
}
```

### Voir les vidéos d'une leçon
```
GET /lecons/:lecon_id/videos
Authorization: Bearer {token}
```

### Supprimer une vidéo
```
DELETE /videos/:video_id
Authorization: Bearer {token}
```

### Modifier une vidéo
```
PUT /videos/:video_id
Authorization: Bearer {token}

{
  "titre": "Nouveau titre",
  "url": "https://www.youtube.com/watch?v=...",
  "description": "Nouvelle description",
  "duree": "20 min"
}
```
