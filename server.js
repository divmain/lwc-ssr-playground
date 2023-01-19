const fs = require('fs');
const path = require('path');
const express = require('express');
const rollup = require('rollup');
const prettier = require('prettier');
const htmlEntities = require('html-entities');
const engineServer = require('@lwc/engine-server');

const rollupConfig = require('./rollup-server.config.js');

const PORT = 3000;
const app = express();
app.use(express.static('dist'));

const htmlTemplate = ({ markup, prettifiedMarkup, compiledComponentCode, props }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
    />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Server-Rendered Component</title>
    <style>
    .container {
      margin: 16px;
      padding: 16px;
      border-style: solid;
      border-width: 2px;
      border-color: black;
    }
    pre {
      margin: 0;
    }
    </style>
  </head>
  <body>
    <h3>Rendered Component</h3>
    <div class="container">
      <div id="main">
          ${markup}    
      </div>
    </div>
    <hr />
    <h3>Prettified Markup:</h3>
    <div class="container">
      <pre>${prettifiedMarkup}</pre>
    </div>
    <hr />
    <h3>Compiled Component Code:</h3>
    <div class="container">
      <pre>${compiledComponentCode}</pre>
    </div>
    </footer>
  </body>
  <script>
    window.lwcRuntimeFlags = window.lwcRuntimeFlags || {};
    window.lwcRuntimeFlags.ENABLE_LIGHT_DOM_COMPONENTS = true;
  </script>
  <script type="text/javascript">window.APP_PROPS = ${props}</script>
  <script src="/entry-rehydrate.js"></script>
</html>
`;

function buildResponse(props) {
  globalThis.lwc = engineServer;

  const compiledComponentPath = path.resolve(__dirname, './dist/app.js');
  delete require.cache[require.resolve(compiledComponentPath)];
  const cmp = require(compiledComponentPath);
  const renderedMarkup = engineServer.renderComponent('x-parent', cmp, props);

  return htmlTemplate({
    markup: renderedMarkup,
    prettifiedMarkup: htmlEntities.encode(prettier.format(renderedMarkup, {
      parser: 'html',
      htmlWhitespaceSensitivity: 'ignore',
    })),
    compiledComponentCode: htmlEntities.encode(fs.readFileSync(compiledComponentPath, 'utf8')),
    props: JSON.stringify(props),
  });
}

app.get('/ssr', (req, res) => {
  const componentProps = req.query.props || {};
  return res.send(buildResponse(componentProps));
});

app.get('/csr', (req, res) => {
  return res.sendFile(path.resolve(__dirname, './static/csr.html'));
});

app.get('*', (req, res) => {
  return res.sendFile(path.resolve(__dirname, './static/root.html'));
});

app.listen(PORT, () =>
  console.log(`Listening at http://localhost:${PORT}`)
);

(async () => {
  const watcher = await rollup.watch(rollupConfig);
  watcher.on('event', (event) => {
    if (event.code === 'ERROR') {
      console.error(event.error);
    }
    if (event.code === 'START') {
      process.stdout.write('Compiling...');
    }
    if (event.code === 'END') {
      console.log(' done!');
    }
  });
})();
