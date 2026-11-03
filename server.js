require('dotenv').config({ quiet: true });
const app = require('./src/app');

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Task manager started on http://localhost:${port}`));
