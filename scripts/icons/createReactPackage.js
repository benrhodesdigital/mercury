'use strict';

const lodash = require('lodash');
const transform = require('@babel/core').transform;

// Transform code to ES5
const getTransformedSourceCode = (originalSource) => transform(originalSource, {
  presets: [ '@babel/preset-react']
}).code;

// Get the contents of the optimized SVG
// by trimming leading and tailing <svg> tags
const getSVGContent = (source) => source.slice(source.indexOf('>') + 1).slice(0, -6);

/**
 * Template: React components
 */
const getReactSource = ({ componentName, height, width, svgPaths }) => getTransformedSourceCode(`
import createIconComponent from './utils/createIconComponent';
import React from 'react';
const ${componentName} = createIconComponent({ content: <g>${svgPaths}</g>, height: ${height}, width: ${width} });
${componentName}.displayName = '${componentName}';
export default ${componentName};
`);

/**
 * Template: createIconComponent
 */
const getCreateIconSource = () => getTransformedSourceCode(`
import { createElement } from 'react';
import React from 'react';
const createIconComponent = ({ content, height, width }) =>
  (props) => createElement('svg', {
    ...props,
    viewBox: \`0 0 \${width} \${height}\`,
    className: 'mercury-icon'
  },
  content);


export default createIconComponent;
`);

/**
 * Template: package.json
 */
const getPackageJsonSource = ({ version }) => `{
  "name": "@mercury/icons",
  "version": "${version}",
  "peerDependencies": {
    "react": ">=16.2.0",
    "react-native-web": ">=0.3.4"
  }
}`;

const createReactPackage = (svgs, version) => {
  const files = svgs.map((svg) => {
    const { name, width, height } = svg.metadata;
    const componentName = `Icon${lodash.upperFirst(lodash.camelCase(name))}`;
    const svgPaths = getSVGContent(svg.source);
    const source = getReactSource({ componentName, width, height, svgPaths });
    const filepath = `${name}.js`;

    return { filepath, source };
  });

  files.push({
    filepath: 'utils/createIconComponent.js',
    source: getCreateIconSource()
  });

  files.push({
    filepath: 'package.json',
    source: getPackageJsonSource({ version })
  });

  return {
    name: 'mercury-icons',
    files
  }
}

module.exports = createReactPackage;
