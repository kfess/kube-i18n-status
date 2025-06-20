# kubernetes i18n Tracker

A dashboard to visualize and track the translation status of Kubernetes website documentation across different languages. This tool helps contributors and maintainers monitor localization progress and identify areas requiring translation efforts.

📍 **Live site**: [https://kfess.github.io/kube-i18n-status](https://kfess.github.io/kube-i18n-status) (Deployed on GitHub Pages)

## [![Build and Deploy to GitHub Pages](https://github.com/kfess/kube-i18n-status/actions/workflows/build_deploy.yaml/badge.svg)](https://github.com/kfess/kube-i18n-status/actions/workflows/build_deploy.yaml)

## 🚀 Features

- View translation status across all supported languages
- Track translation availability for each file

## ![Screenshot](./images/screenshot.png)

## 🔗 Who is this for?

- **Localization contributors** who want to see which files need translation
- **SIG Docs reviewers** managing the progress of i18n
- **New translators** who want to identify good entry points for contribution

---

## 🛠 Tech Stack

- Frontend: React + Vite
- Data Source: [kubernetes/website](https://github.com/kubernetes/website)
- CI/CD: GitHub Actions
- Hosting: GitHub Pages

---

## 🧩 How it works

- Automatically fetches the latest kubernetes/website content daily
- Powered by GitHub Actions for reliable updates and deployment

## 🤝 Contribution

We welcome feedback, suggestions, and contributions.

If you'd like to help improve this dashboard, feel free to open an issue or pull request.
