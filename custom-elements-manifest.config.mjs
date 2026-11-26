const litState = {
  name: "lit-state-attributes",
  analyzePhase({ ts, node, moduleDoc }) {
    if (!ts.isClassDeclaration(node) || !node.name) return;
    const properties = node.members.find(
      (member) =>
        ts.isPropertyDeclaration(member) &&
        member.name.getText() === "properties" &&
        member.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword),
    )?.initializer;
    if (!properties || !ts.isObjectLiteralExpression(properties)) return;

    // The Lit analyzer maps `state: true` fields to attributes, but Lit only
    // exposes them as properties. Keep the field for JS and JSX consumers.
    const state = new Set(
      properties.properties
        .filter(
          (property) =>
            ts.isPropertyAssignment(property) &&
            ts.isObjectLiteralExpression(property.initializer) &&
            property.initializer.properties.some(
              (option) =>
                ts.isPropertyAssignment(option) &&
                option.name.text === "state" &&
                option.initializer.kind === ts.SyntaxKind.TrueKeyword,
            ),
        )
        .map((property) => property.name.text),
    );
    if (!state.size) return;

    const declaration = moduleDoc.declarations.find(
      (entry) => entry.name === node.name.text,
    );
    if (!declaration) return;
    declaration.attributes = declaration.attributes?.filter(
      ({ name, fieldName }) => !state.has(fieldName ?? name),
    );
    for (const field of declaration.members ?? []) {
      if (field.kind === "field" && state.has(field.name)) {
        delete field.attribute;
        delete field.reflects;
      }
    }
  },
};

export default {
  globs: ["src/components/*/*.ts"],
  exclude: ["**/*.test.ts", "**/*.stories.ts", "**/*.e2e.ts", "**/*.css.ts"],
  outdir: "dist",
  litelement: true,
  packagejson: false,
  plugins: [litState],
};
