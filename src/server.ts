import app from "./app";
import { env } from "./config/env";

async function bootstrap() {
  // await ensureQdrantIndexes();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}
bootstrap();
