const { declare } = require("@babel/helper-plugin-utils");
const { types: t } = require('@babel/core');
const _ = require('lodash');

module.exports = declare((api, options) => {
  api.assertVersion(7);
  return {
    name: "transform-react-r-for-3",
    visitor: {
      JSXElement(path) {
        const { cloneNode } = t;
        const { node } = path;

        const attributes = node.openingElement.attributes;
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

        // 递归找到 r-for 中引用的数组
        function findParent(p, name) {
          if (p.parent.type === 'BlockStatement') {
            const { body } = p.parent;
            let result = [];
            for (const child of body) {
              if (child.type === 'VariableDeclaration') {
                for (const d of child.declarations) {
                  if (d.type === 'VariableDeclarator' && d.id.name === name) {
                    result = d.init.elements;
                    break;
                  }
                }
              }
            }
            if (result) {
              result = result.map(generateObject);
            } else {
              result = []
            }
            return result;
          }
          return findParent(p.parentPath, name);
        }

        // 解析「.」操作符连接的表达式
        function findPropertyPath(node) {
          if (node.type === 'MemberExpression') {
            const { object, property } = node;
            return `${findPropertyPath(object)}.${property.name}`
          }
          if (node.type === 'Identifier') {
            return node.name
          }
        }

        // 解析出对象源数据
        function generateObject(node) {
          let obj = {};
          if (node.type === 'ObjectExpression') {
            for (const prop of node.properties) {
              _.set(obj, prop.key.name, generateObject(prop.value))
            }
            return obj;
          }
          return node;
        }

        if (attrs['r-for']) {
          const arrName = attrs['r-for'].right.name;

          const blockArray = findParent(path, arrName);
          let propPath = findPropertyPath(node.children[1].expression);

          propPath = propPath.split('.').splice(1, propPath.length).join('.');

          // 每一个节点复制上一个节点生成节点群
          function createCloneNode(node, index) {
            const _node0 = cloneNode(node);
            const newAttributes = [];
            for (const a of _node0.openingElement.attributes) {
              if (!['r-for', 'key'].includes(a.name.name)) {
                newAttributes.push(a);
              }
            }
            _node0.openingElement.attributes = newAttributes;

            // 取元素本身或者取元素的某个属性
            const child = propPath ? _.get(blockArray[index], propPath) : blockArray[index]
            _node0.children = [child];

            return _node0
          }

          let _nodes = [createCloneNode(node, 0)];

          for (let i = 0; i < blockArray.length - 1; i++) {
            const _node_n = createCloneNode(_nodes[i], i + 1);
            _nodes.push(_node_n);
          }

          // 从节点数据到节点字符串
          function parseNodeToString(node) {
            let { openingElement, openingElement: {attributes}, children } = node;
            let attrString = ''
            attributes.forEach(item => {
              const {name, value} = item;
              attrString += `${name.name.replace('className', 'class')}="${value.value}" `
            })
            const eleName = openingElement.name.name;
            return `<${eleName} ${attrString.trim()}>${children[0] ? children[0].value : ''}</${eleName}>`
          }

          const finalELements = _nodes.map(item => parseNodeToString(item)).join('')

          path.replaceWithSourceString(`React.createElement('div', {
            dangerouslySetInnerHTML: {__html: '${finalELements}'}
          }, null)`);
        }
      },
    },
  };
});

