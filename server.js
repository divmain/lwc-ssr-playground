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

const htmlTemplate = ({ content, code, props }) => `
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
  </head>
  <body>
    <div id="main">
      <h3>Rendered Component</h3>
        ${content}    
    </div>
    <footer>
      <h3>Component Code:</h3>
      <pre>${code}</pre>
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
  global.lwc = engineServer;

  const modulePath = path.resolve(__dirname, './dist/app.js');
  delete require.cache[require.resolve(modulePath)];
  const cmp = require(modulePath);
  const renderedHtml = ssr.renderComponent('x-parent', cmp, props);

  return buildResponse({
    content: renderedHtml,
    code: htmlEntities.encode(prettier.format(renderedComponent, {
      parser: 'html',
      htmlWhitespaceSensitivity: 'ignore',
    })),
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
