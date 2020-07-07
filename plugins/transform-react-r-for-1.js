const { declare } = require("@babel/helper-plugin-utils");
const t = require('@babel/types');

module.exports = declare((api, options) => {
  api.assertVersion(7);
  return {
    name: "transform-react-r-for",
    visitor: {
      JSXElement(path) {
        const { node } = path;

        const { attributes } = node.openingElement;
        if (!attributes.length) return;

        let attrs = {};
        for (const attr of attributes) {
          const key = attr.name.name;
          if (key === 'r-for') {
            attrs[key] = attr.value.expression;
          } else {
            switch(attr.value.type) {
              case 'StringLiteral':
                attrs[key] = attr.value.value;
                break;
              case 'JSXExpressionContainer':
                attrs[key] = attr.value.expression.name;
                break;
            }
          }
        }

        if (attrs['r-for']) {
          const newAttrs = JSON.parse(JSON.stringify(attrs));
          delete newAttrs['r-for'];

          const element = node.openingElement.name.name;
          const { left, right } = attrs['r-for'];

          const { type } = left;
          let mapItem = null
          if (type === 'SequenceExpression') {
            mapItem = left.expressions.map(t => t.name).join(',')
          }
          if (type === 'Identifier') {
            mapItem = left.name;
          }

          path.replaceWithSourceString(`${right.name}.map((${mapItem}) => React.createElement("${element}", {key: ${newAttrs['key']}}, item))`);
        }
      },
    },
  };
});