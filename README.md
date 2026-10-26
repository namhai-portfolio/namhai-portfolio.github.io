# Nam-Hai Hoang Le — Portfolio

Public portfolio: https://namhai-portfolio.github.io/

This repository contains a static snapshot of the saved portfolio. Visitors can browse projects, filter work, read project details and share project links without signing in.

## Updating the portfolio

1. Edit text and images in the original editor website, then click **Lưu lên web**.
2. Run `python scripts/export_snapshot.py https://YOUR-EDITOR-SITE` from this repository. The URL is an argument and is not saved in the public output.
3. Review the generated pages and assets, then commit the updated snapshot to `main`.
4. GitHub Pages publishes the new version. Changes in the editor do not sync automatically.

The exporter copies the saved text and displayed image crops into this repository. It does not upload credentials, editor access, original uncropped images or unsaved drafts. No database service is required.

GitHub Pages configuration: deploy from branch `main`, folder `/ (root)`.

The downloadable PDF CV is excluded from this public snapshot pending the owner’s explicit approval.
