# Corriger "Permission denied (publickey)" quand tu fais git push en root

Quand tu es connecté en **root** et que tu fais `git push`, SSH utilise les clés de **root** (`/root/.ssh/`), pas celles de l'utilisateur **cursor**. La clé GitHub est dans `/home/cursor/.ssh/`, donc il faut que root utilise la même clé.

## Commandes à exécuter (en root sur le serveur)

Copie-colle tout le bloc dans ton terminal (tu es déjà root) :

```bash
# Créer .ssh pour root si besoin
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Copier la clé GitHub depuis cursor
cp /home/cursor/.ssh/id_ed25519_github /root/.ssh/
cp /home/cursor/.ssh/id_ed25519_github.pub /root/.ssh/
chmod 600 /root/.ssh/id_ed25519_github
chmod 644 /root/.ssh/id_ed25519_github.pub

# Configurer SSH pour utiliser cette clé avec GitHub
cat >> /root/.ssh/config << 'EOF'

Host github.com
  HostName github.com
  User git
  IdentityFile /root/.ssh/id_ed25519_github
  IdentitiesOnly yes
EOF
chmod 600 /root/.ssh/config

# Pousser vers GitHub
cd /home/conta/conta.cd-dev
git push -u origin sprint-0
```

Après ça, `git push` fonctionnera quand tu es en root.

## Vérifier que la clé est bien sur GitHub

Sur https://github.com → Settings → SSH and GPG keys, tu dois avoir une clé dont la ligne commence par `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIDuBBixQ8/...`. Si tu ne l’as pas encore ajoutée, ajoute-la (New SSH key, colle la sortie de `cat /home/cursor/.ssh/id_ed25519_github.pub`).
