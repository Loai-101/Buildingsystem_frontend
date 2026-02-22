# Fix: Code not showing on GitHub

Your push failed because **the repository does not exist** at:
`https://github.com/Loai-101/Buildingsystem`

## Option A – Create the repo on GitHub (recommended)

1. Open: **https://github.com/new**
2. **Repository name:** `Buildingsystem` (or any name you want)
3. Leave it **empty** (no README, no .gitignore).
4. Click **Create repository**.
5. Copy the repo URL GitHub shows (e.g. `https://github.com/Loai-101/Buildingsystem.git` or your username/repo).
6. In your project folder, run (use your actual URL from step 5):

   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

7. If Git asks for a password, use a **Personal Access Token** (not your GitHub password):
   - GitHub → Settings → Developer settings → Personal access tokens → Generate new token.
   - Use the token as the password when `git push` asks for it.

---

## Option B – Repo already exists under a different URL

If you already created the repo with another name or under another account:

```bash
git remote set-url origin https://github.com/CORRECT_USERNAME/CORRECT_REPO.git
git push -u origin main
```

Replace `CORRECT_USERNAME` and `CORRECT_REPO` with your real GitHub username and repo name.

---

## Check current remote

```bash
git remote -v
```

Your commits are saved locally; after the remote is correct and you push, they will appear on GitHub.
