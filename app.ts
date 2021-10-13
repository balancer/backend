import { createApp } from './app/createApp';
import { loadRoutes } from './app/loadRoutes';
import { env } from './app/env';

const app = createApp();
loadRoutes(app);

app.listen(env.PORT, () => {
    console.log(`Listening on port ${env.PORT}`);
});
