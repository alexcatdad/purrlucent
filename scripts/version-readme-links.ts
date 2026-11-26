import { version } from "../package.json";

const readme = Bun.file("README.md");
const content = await readme.text();
const links =
  /\]\((?:https:\/\/github\.com\/alexcatdad\/purrlucent\/blob\/v[^/]+\/)?(docs\/(?:install|react|components|kits)\.md|SECURITY\.md)\)/g;

await Bun.write(
  readme,
  content.replace(
    links,
    (_, path: string) =>
      `](https://github.com/alexcatdad/purrlucent/blob/v${version}/${path})`,
  ),
);
