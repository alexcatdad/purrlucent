# Starter kits

Purrlucent includes five editable starter kits built with HTML, CSS, and TypeScript. Start with a full page or copy the sections you need into your own project.

## Open a kit

From a project with Vite 8 and Purrlucent installed, copy the kit directory and start Vite with the included config. [Install Purrlucent](./install.md)

```sh
cp -R node_modules/purrlucent/kits ./starter-kits
npm exec -- vite --config ./starter-kits/vite.config.ts --open /product-site/index.html
```

The config serves the copied directory as the site root. Use these paths to open the other demos.

| Kit           | Path                       | Included examples                                                                                                             |
| ------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Product site  | `/product-site/index.html` | Split hero, feature sections, FAQ, and expanded footer. `/product-site/centered.html` has a centered hero and compact footer. |
| Onboarding    | `/onboarding/index.html`   | Account creation, password reset, invitation, profile, and workspace setup.                                                   |
| Admin         | `/admin/index.html`        | Support queue with search, status filters, bulk resolution, request details, and retry.                                       |
| Billing       | `/billing/index.html`      | Monthly and yearly pricing, plan comparisons, confirmed changes, undo, and invoice history.                                   |
| Documentation | `/docs/index.html`         | Installation and theming articles with navigation, contents, and copyable code.                                               |

## Adapt a kit

Edit the page’s HTML and its adjacent `styles.css` and `main.ts`. Keep the associated assets and the shared files used by the page. The product and documentation kits use `site-chrome.css` for the header and footer and `site-navigation.ts` for disclosure keyboard behavior. `shared.css` sets the base page styles.

The shared stylesheet imports the Purrlucent tokens. Each page’s TypeScript imports the components it uses. To copy a product section, find the named HTML comments in `product-site/index.html` or `product-site/centered.html`. Keep the styles and imports that the section uses, update links and image paths for your app, and preserve the relationships between heading IDs and their labels.

The onboarding, admin, and billing kits use sample data and client-side interactions. Connect your application’s services when you adapt those flows.

## Build the kits

Build the edited pages with the same config.

```sh
npm exec -- vite build --config ./starter-kits/vite.config.ts
```

Vite writes the static pages and assets to `starter-kits/dist/`.
