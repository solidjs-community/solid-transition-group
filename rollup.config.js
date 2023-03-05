import babel from "@rollup/plugin-babel";
import nodeResolve from "@rollup/plugin-node-resolve";
import path from "path";
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json")));
const { dependencies, peerDependencies } = pkg;
const external = Object.keys(dependencies).concat(Object.keys(peerDependencies));

const plugins = [
  nodeResolve({
    extensions: [".js", ".ts"]
  }),
  babel({
    extensions: [".js", ".ts"],
    babelHelpers: "bundled",
    presets: ["@babel/preset-typescript"],
    exclude: "node_modules/**"
  })
];

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist//solid-transition-group.cjs",
      format: "cjs"
    },
    {
      file: "dist//solid-transition-group.js",
      format: "es"
    }
  ],
  external,
  plugins
};
